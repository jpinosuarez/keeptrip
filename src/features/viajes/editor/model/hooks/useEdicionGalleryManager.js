import { useCallback } from 'react';

export function useEdicionGalleryManager({ galeria, captionDrafts, setCaptionDrafts, pushToast, t }) {
  const handleSetPortadaExistente = useCallback(
    async (fotoId) => {
      const ok = await galeria.cambiarPortada(fotoId);
      if (!ok) pushToast(t('error.coverUpdateFailed'), 'error');
    },
    [galeria, pushToast, t]
  );

  const handleEliminarFoto = useCallback(
    async (fotoId) => {
      const confirm = window.confirm(t('confirm.deletePhoto'));
      if (!confirm) return;
      const ok = await galeria.eliminar(fotoId);
      if (!ok) pushToast(t('error.photoDeleteFailed'), 'error');
    },
    [galeria, pushToast, t]
  );

  const handleCaptionChange = useCallback((fotoId, value) => {
    setCaptionDrafts((prev) => ({ ...prev, [fotoId]: value }));
  }, [setCaptionDrafts]);

  const handleCaptionSave = useCallback(
    async (foto) => {
      const draft = captionDrafts[foto.id];
      if (draft === undefined) return;

      const normalized = draft.trim();
      const nextCaption = normalized.length ? normalized : null;
      const currentCaption = foto.caption || null;
      if (currentCaption === nextCaption) return;

      const ok = await galeria.actualizarCaption(foto.id, nextCaption);
      if (!ok) {
        pushToast(t('error.captionSaveFailed'), 'error');
        return;
      }

      pushToast(t('toast.captionUpdated'), 'success', 1500);
    },
    [captionDrafts, galeria, pushToast, t]
  );

  return {
    handleSetPortadaExistente,
    handleEliminarFoto,
    handleCaptionChange,
    handleCaptionSave,
  };
}
