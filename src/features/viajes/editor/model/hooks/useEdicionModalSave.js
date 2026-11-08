import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { normalizeToIsoDate, resolveCoverPhotoUrl } from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode, getCountryName } from '@shared/lib/utils/countryUtils';
import { ParadaSchema } from '@entities/viajes/model/viajeSchema';
import { findWishlistMatches } from '@shared/lib/wishlist/wishlistUtils';

/**
 * Recursively strips `undefined` values (Firestore writeBatch/writeBatch throws on
 * them) while preserving non-plain objects such as File/Blob/Date/FieldValue.
 */
const sanitizeValue = (value) => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (value[key] === undefined) return;
      out[key] = sanitizeValue(value[key]);
    });
    return out;
  }
  return value;
};

const sanitizeStop = (stop) => {
  if (!stop || typeof stop !== 'object') return stop;
  const clean = sanitizeValue({ ...stop });
  // Empty date strings are not valid ISO dates → coerce to null so the
  // tolerant ParadaSchema (optional().nullable()) passes cleanly.
  ['fecha', 'fechaLlegada', 'fechaSalida'].forEach((key) => {
    if (clean[key] === '' || clean[key] === undefined) clean[key] = null;
  });
  // Every stop must carry a city label for downstream persistence/validation.
  if (!clean.ciudad || String(clean.ciudad).trim() === '') {
    clean.ciudad = clean.nombre || '';
  }
  // Strip raw empty transport tokens.
  if (clean.transporte === '') clean.transporte = null;
  // Drop places with an empty name (they would fail ParadaSchema min(1)).
  if (Array.isArray(clean.lugares)) {
    clean.lugares = clean.lugares.filter(
      (lugar) => lugar && typeof lugar.nombre === 'string' && lugar.nombre.trim().length > 0
    );
  }
  clean.paisCodigo = normalizeCountryCode(clean?.paisCodigo) || null;
  // Infer a human-readable country name from the ISO code when absent so the
  // legacy `pais` field is never an empty save blocker.
  if ((!clean.pais || String(clean.pais).trim() === '') && clean.paisCodigo) {
    clean.pais = getCountryName(clean.paisCodigo) || clean.paisCodigo;
  }
  return clean;
};

function resolveSavedTripId(saveResult, tripId, fallbackTripId = null) {
  if (typeof saveResult === 'string' && saveResult.trim()) return saveResult;
  if (saveResult && typeof saveResult === 'object' && typeof saveResult.id === 'string') return saveResult.id;
  // `true` is a success signal from legacy CRUD handlers. Prefer the freshly
  // generated id (newly created trip) and fall back to the known persisted id.
  if (saveResult === true) {
    if (fallbackTripId && fallbackTripId !== 'new') return fallbackTripId;
    if (tripId && tripId !== 'new') return tripId;
  }
  return null;
}

export function useEdicionModalSave({
  isProcessingImage,
  isSaving,
  isUploading,
  formData,
  viaje,
  ciudadInicial,
  paradas,
  onSave,
  galleryFiles,
  galleryPortada,
  draftTags = {},
  hasUploadContext,
  iniciarSubida,
  pushToast,
  t,
  limpiarEstado,
  onClose,
  resetDirty,
  onAfterSave,
  autoFinalize = true,
  wishlist = [],
  onWishlistFulfilled = null,
}) {
  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();

  const handleSave = async () => {
    if (isProcessingImage || isSaving || isUploading) return;

    const existingStops = viaje?.paradas || viaje?.destinos || [];
    const isPersistedTrip = Boolean(viaje?.id && viaje.id !== 'new');

    if (!isPersistedTrip && operationalLevel >= 1) {
      pushToast(
        t(
          'error.tripCreationPausedOperational',
          'Trip creation is temporarily paused while map search is stabilized. You can still edit existing trips.'
        ),
        'warning'
      );
      return null;
    }

    const hasValidStops = Array.isArray(paradas) && paradas.length > 0;
    const hasValidTitle = Boolean((formData?.titulo || '').trim());
    const hasValidStartDate = Boolean((formData?.fechaInicio || viaje?.fechaInicio || '').toString().trim());

    if (!isPersistedTrip && !hasValidStops) {
      pushToast(t('error.tripNeedsStop', 'El viaje debe tener al menos un destino'), 'error');
      return null;
    }

    if (!hasValidTitle) {
      pushToast(t('error.tripNeedsTitle', 'El viaje debe tener un titulo'), 'error');
      return null;
    }

    if (!hasValidStartDate) {
      pushToast(t('error.tripNeedsStartDate', 'El viaje debe tener fecha de inicio'), 'error');
      return null;
    }

    const invalidStopDate = Array.isArray(paradas) && paradas.find((p) => {
      const llegada = normalizeToIsoDate(p?.fechaLlegada || p?.fecha);
      const salida = normalizeToIsoDate(p?.fechaSalida);
      return Boolean(llegada && salida && salida < llegada);
    });

    if (invalidStopDate) {
      pushToast(
        t('editor.errors.dateInverted', 'La fecha de salida no puede ser anterior a la de llegada') +
          (invalidStopDate.nombre ? ` (${invalidStopDate.nombre})` : ''),
        'error'
      );
      return null;
    }

    try {
      const savePayload = {
        ...formData,
        // Borrador: defensa final para no perder destino por orden de renders.
        code: formData.code || viaje?.code || ciudadInicial?.paisCodigo || '',
        nombreEspanol: formData.nombreEspanol || viaje?.nombreEspanol || '',
        titular: formData.titular ?? viaje?.titular ?? '',
        coordenadas: formData.coordenadas || viaje?.coordenadas || ciudadInicial?.coordenadas || null,
        latlng:
          formData.latlng ||
          viaje?.latlng ||
          formData.coordenadas ||
          viaje?.coordenadas ||
          ciudadInicial?.coordenadas ||
          null,
        newStops: paradas,
        paradasNuevas: paradas,
      };

      // Normalize date fields to prevent invalid values (Infinity / NaN / unparsed Timestamps) from
      // being written to Firestore and corrupting trip timestamps.
      const safeFechaInicio = normalizeToIsoDate(savePayload.fechaInicio) || normalizeToIsoDate(viaje?.fechaInicio);
      const safeFechaFin = normalizeToIsoDate(savePayload.fechaFin) || normalizeToIsoDate(viaje?.fechaFin);

      if (safeFechaInicio) savePayload.fechaInicio = safeFechaInicio;
      if (safeFechaFin) savePayload.fechaFin = safeFechaFin;

      // If after normalization we still have invalid dates, strip them to allow
      // server-side defaults or validation to handle the case.
      if (!savePayload.fechaInicio) delete savePayload.fechaInicio;
      if (!savePayload.fechaFin) delete savePayload.fechaFin;

      // Ensure photo fields are normalized and synchronized when cover photo is set.
      const resolvedPortada = resolveCoverPhotoUrl(savePayload.portadaUrl || savePayload.foto);
      if (resolvedPortada) {
        savePayload.foto = resolvedPortada;
        savePayload.fotoPortada = resolvedPortada;
        savePayload.portadaUrl = resolvedPortada;
      }

      // Normalize the trip country + sanitize the payload and every stop so
      // Firestore writeBatch never throws on `undefined` fields or malformed
      // ISO codes ("Código de país debe tener 2 caracteres").
      savePayload.code = normalizeCountryCode(savePayload.code) || savePayload.code || '';
      const sanitizedStops = (Array.isArray(paradas) ? paradas : []).map(sanitizeStop);
      savePayload.newStops = sanitizedStops;
      savePayload.paradasNuevas = sanitizedStops;
      const sanitizedPayload = sanitizeValue(savePayload);

      // Guarantee a destination label + strip raw empty enum tokens so optional
      // Zod fields never fail on "" and Firestore never stores empty enums.
      if (!sanitizedPayload.destino || String(sanitizedPayload.destino).trim() === '') {
        sanitizedPayload.destino = sanitizedPayload.titulo || sanitizedStops[0]?.nombre || '';
      }
      if (sanitizedPayload.transporte === '') sanitizedPayload.transporte = null;
      if (sanitizedPayload.companionType === '') sanitizedPayload.companionType = null;

      // Infer trip-level country text from the ISO code / first stop so the
      // legacy `pais`/`nombreEspanol` fields are never empty save blockers
      // (multi-country and legacy trips legitimately lack a single country name).
      if (!sanitizedPayload.pais && sanitizedPayload.code) {
        sanitizedPayload.pais = getCountryName(sanitizedPayload.code) || sanitizedPayload.code;
      }
      if (!sanitizedPayload.nombreEspanol || String(sanitizedPayload.nombreEspanol).trim() === '') {
        sanitizedPayload.nombreEspanol =
          sanitizedPayload.pais ||
          sanitizedStops[0]?.pais ||
          (sanitizedStops[0]?.paisCodigo ? getCountryName(sanitizedStops[0].paisCodigo) : '') ||
          '';
      }

      // Validate every stop with the tolerant Zod schema BEFORE persistence so a
      // constraint violation surfaces as a specific, localized warning instead
      // of an opaque Firestore/network error toast.
      for (const stop of sanitizedStops) {
        const validation = ParadaSchema.safeParse(stop);
        if (!validation.success) {
          console.error('[useEdicionModalSave] Zod validation failed:', validation.error.issues);
          const firstIssue = validation.error.issues[0];
          const fieldName = firstIssue.path.length > 0 ? ` (${firstIssue.path.join('.')})` : '';
          pushToast(`${firstIssue.message}${fieldName}`, 'warning');
          return false;
        }
      }

      // we are inside useEdicionModalSave, and the actual editor has `viaje.paradas`. 
      // The stops on the modal itself are modified as `paradas`.
      // We pass the unedited stops (if available) as the 3rd param to cleanly diff.
      const saveResult = isPersistedTrip
        ? await onSave(viaje.id, sanitizedPayload, existingStops)
        : await onSave(viaje.id, sanitizedPayload);

      // `false` means downstream validation failed and an inline warning was
      // already shown. Do NOT duplicate it with the generic red toast.
      if (saveResult === false) {
        return false;
      }

      const savedTripId = resolveSavedTripId(saveResult, viaje?.id);

      if (!savedTripId) {
        // No false "network error" toast here: downstream already reported the
        // reason (validation warning) or swallowed a real error with its own toast.
        console.warn('[useEdicionModalSave] save produced no trip id; keeping editor open.');
        return null;
      }

      // Block 2.5 — Auto-completion: if this saved trip fulfills any wishlist
      // dream (matching country code or city name), remove it and celebrate.
      // Pure matching lives in wishlistUtils; persistence + toast are delegated
      // to the composition root (no extra Firestore reads, single merge write).
      if (Array.isArray(wishlist) && wishlist.length > 0 && typeof onWishlistFulfilled === 'function') {
        try {
          const matched = findWishlistMatches(wishlist, sanitizedStops);
          if (matched.length > 0) {
            await onWishlistFulfilled(matched);
            const destination = matched[0]?.nombre || '';
            pushToast(
              t('toast.wishlistFulfilled', {
                ns: 'editor',
                destination,
                defaultValue: `🎉 ¡Sueño cumplido! Visitaste ${destination}, lo tachamos de tu Wishlist.`,
              }),
              'success'
            );
          }
        } catch (wishlistError) {
          console.warn('[useEdicionModalSave] wishlist auto-complete failed:', wishlistError?.message || wishlistError);
        }
      }

      if (galleryFiles.length > 0) {
        console.log('Subiendo a viajeId:', savedTripId, 'con files:', galleryFiles.length, 'portadaIndex:', galleryPortada);
        console.log('Referencia a iniciarSubida:', iniciarSubida?.toString?.());

        if (hasUploadContext) {
          try {
            pushToast(t('toast.uploadingPhotos'), 'info');
            await iniciarSubida(savedTripId, galleryFiles, galleryPortada, { draftTags });
            pushToast(t('toast.uploadingPhotosDone'), 'success');
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            pushToast(t('gallery.errorUploadFailed', { ns: 'gallery' }), 'error');
            throw uploadError; // evitar cierre silencioso y forzar retry en UI
          }
        } else {
          pushToast(t('error.unexpectedError'), 'error');
          throw new Error('Upload context no disponible');
        }
      }

      // A completed save must always flush any dirty guard BEFORE closing so a
      // successful save can never be blocked by isDirty.
      resetDirty?.();

      // SINGLE-OWNER CLOSE CONTRACT (Block 2.4):
      // - autoFinalize === true (legacy EdicionModal): the hook owns closing.
      // - autoFinalize === false (EditorFocusPanel): the panel owns closing via
      //   onAfterSave, so we must NOT invoke onClose here (avoids a race where
      //   the manager closes before the gallery uploads finish).
      if (autoFinalize) {
        limpiarEstado();
        if (onAfterSave) {
          onAfterSave(savedTripId);
        } else {
          onClose?.();
        }
      }

      return savedTripId;
    } catch (error) {
      console.error('Error en useEdicionModalSave:', error);
      // Preferimos mostrar mensaje descriptivo si está disponible, sino mensaje genérico
      const mensaje = error?.message ? `${t('error.saveFailed')}: ${error.message}` : t('error.saveFailed');
      pushToast(mensaje, 'error');
      return null;
    }
  };

  return handleSave;
}
