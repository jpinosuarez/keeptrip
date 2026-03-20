function resolveSavedViajeId(saveResult, viajeId) {
  if (typeof saveResult === 'string' && saveResult.trim()) return saveResult;
  if (saveResult && typeof saveResult === 'object' && typeof saveResult.id === 'string') return saveResult.id;
  if (saveResult === true && viajeId && viajeId !== 'new') return viajeId;
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
}) {
  const handleSave = async () => {
    const normalizeDate = (value) => {
      if (!value && value !== 0) return null;
      if (typeof value === 'number' && !Number.isFinite(value)) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    };

    if (isProcessingImage || isSaving || isUploading) return;

    try {
      const payload = {
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
        paradasNuevas: paradas,
      };

      // Normalize date fields to prevent invalid values (Infinity / NaN) from
      // being written to Firestore and corrupting trip timestamps.
      const safeFechaInicio = normalizeDate(payload.fechaInicio) || normalizeDate(viaje?.fechaInicio);
      const safeFechaFin = normalizeDate(payload.fechaFin) || normalizeDate(viaje?.fechaFin);

      if (safeFechaInicio) payload.fechaInicio = safeFechaInicio;
      if (safeFechaFin) payload.fechaFin = safeFechaFin;

      // If after normalization we still have invalid dates, strip them to allow
      // server-side defaults or validation to handle the case.
      if (!payload.fechaInicio) delete payload.fechaInicio;
      if (!payload.fechaFin) delete payload.fechaFin;

      if (!payload.nombreEspanol) {
        pushToast(t('error.saveFailed'), 'error');
        return null;
      }

      // Ensure legacy photo field is updated when portadaUrl is set.
      if (payload.portadaUrl) {
        payload.foto = payload.portadaUrl;
        payload.fotoPortada = payload.portadaUrl;
      }

      const saveResult = await onSave(viaje.id, payload);
      const savedViajeId = resolveSavedViajeId(saveResult, viaje?.id);

      if (!savedViajeId) {
        pushToast(t('error.saveFailed'), 'error');
        return null;
      }

      if (galleryFiles.length > 0) {
        console.log('Subiendo a viajeId:', savedViajeId, 'con files:', galleryFiles.length, 'portadaIndex:', galleryPortada);

        if (hasUploadContext) {
          try {
            pushToast(t('toast.uploadingPhotos'), 'info');
            await iniciarSubida(savedViajeId, galleryFiles, galleryPortada);
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

      limpiarEstado();
      if (onAfterSave) {
        onAfterSave(savedViajeId);
      } else {
        onClose();
      }

      return savedViajeId;
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
