import { useOperationalFlags } from '@shared/lib';

function resolveSavedTripId(saveResult, tripId) {
  if (typeof saveResult === 'string' && saveResult.trim()) return saveResult;
  if (saveResult && typeof saveResult === 'object' && typeof saveResult.id === 'string') return saveResult.id;
  if (saveResult === true && tripId && tripId !== 'new') return tripId;
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
  hasUploadContext,
  iniciarSubida,
  pushToast,
  t,
  limpiarEstado,
  onClose,
  onAfterSave,
  autoFinalize = true,
}) {
  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();

  const handleSave = async () => {
    const normalizeIsoDate = (value) => {
      if (!value && value !== 0) return null;
      if (typeof value === 'number' && !Number.isFinite(value)) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    };

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

    try {
      const savePayload = {
        ...formData,
        // Borrador: defensa final para no perder destino por orden de renders.
        code: formData.code || viaje?.code || ciudadInicial?.paisCodigo || '',
        nombreEspanol: formData.nombreEspanol || viaje?.nombreEspanol || '',
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

      // Normalize date fields to prevent invalid values (Infinity / NaN) from
      // being written to Firestore and corrupting trip timestamps.
      const safeFechaInicio = normalizeIsoDate(savePayload.fechaInicio) || normalizeIsoDate(viaje?.fechaInicio);
      const safeFechaFin = normalizeIsoDate(savePayload.fechaFin) || normalizeIsoDate(viaje?.fechaFin);

      if (safeFechaInicio) savePayload.fechaInicio = safeFechaInicio;
      if (safeFechaFin) savePayload.fechaFin = safeFechaFin;

      // If after normalization we still have invalid dates, strip them to allow
      // server-side defaults or validation to handle the case.
      if (!savePayload.fechaInicio) delete savePayload.fechaInicio;
      if (!savePayload.fechaFin) delete savePayload.fechaFin;

      // Ensure legacy photo field is updated when portadaUrl is set.
      if (savePayload.portadaUrl) {
        savePayload.foto = savePayload.portadaUrl;
        savePayload.fotoPortada = savePayload.portadaUrl;
      }

      // we are inside useEdicionModalSave, and the actual editor has `viaje.paradas`. 
      // The stops on the modal itself are modified as `paradas`.
      // We pass the unedited stops (if available) as the 3rd param to cleanly diff.
      const saveResult = isPersistedTrip
        ? await onSave(viaje.id, savePayload, existingStops)
        : await onSave(viaje.id, savePayload);
      const savedTripId = resolveSavedTripId(saveResult, viaje?.id);

      if (!savedTripId) {
        pushToast(t('error.saveFailed'), 'error');
        return null;
      }

      if (galleryFiles.length > 0) {
        console.log('Subiendo a viajeId:', savedTripId, 'con files:', galleryFiles.length, 'portadaIndex:', galleryPortada);
        console.log('Referencia a iniciarSubida:', iniciarSubida?.toString?.());

        if (hasUploadContext) {
          try {
            pushToast(t('toast.uploadingPhotos'), 'info');
            await iniciarSubida(savedTripId, galleryFiles, galleryPortada);
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

      if (autoFinalize) {
        limpiarEstado();
        if (onAfterSave) {
          onAfterSave(savedTripId);
        } else {
          onClose();
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
