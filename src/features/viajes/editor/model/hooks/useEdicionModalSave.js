import { useCallback } from 'react';

function resolveSavedViajeId(saveResult, viajeId) {
  if (typeof saveResult === 'string' && saveResult.trim()) return saveResult;
  if (saveResult && typeof saveResult === 'object' && typeof saveResult.id === 'string') return saveResult.id;
  if (saveResult === true && viajeId && viajeId !== 'new') return viajeId;
  return null;
}

export function useEdicionModalSave({
  isProcessingImage,
  isSaving,
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
  return useCallback(async () => {
    if (isProcessingImage || isSaving) return;

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

      if (!payload.nombreEspanol) {
        pushToast(t('error.saveFailed'), 'error');
        return;
      }

      const saveResult = await onSave(viaje.id, payload);
      const savedViajeId = resolveSavedViajeId(saveResult, viaje?.id);

      if (!savedViajeId) {
        pushToast(t('error.saveFailed'), 'error');
        return;
      }

      if (galleryFiles.length > 0) {
        if (hasUploadContext) {
          void iniciarSubida(savedViajeId, galleryFiles, galleryPortada);
        } else {
          pushToast(t('error.unexpectedError'), 'error');
        }
        pushToast(t('toast.uploadingPhotos'), 'info');
      }

      limpiarEstado();
      if (onAfterSave) {
        onAfterSave(savedViajeId);
      } else {
        onClose();
      }
    } catch {
      pushToast(t('error.unexpectedError'), 'error');
    }
  }, [
    ciudadInicial,
    formData,
    galleryFiles,
    galleryPortada,
    hasUploadContext,
    iniciarSubida,
    isProcessingImage,
    isSaving,
    limpiarEstado,
    onAfterSave,
    onClose,
    onSave,
    paradas,
    pushToast,
    t,
    viaje,
  ]);
}
