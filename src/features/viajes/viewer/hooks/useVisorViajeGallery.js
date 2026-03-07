import { useEffect, useState } from 'react';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';

export function useVisorViajeGallery({
  viajeId,
  ownerUid,
  pushToast,
  getEstadoViaje,
  reintentarFoto,
}) {
  const galeria = useGaleriaViaje(viajeId, ownerUid);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [showGalleryTools, setShowGalleryTools] = useState(false);

  const uploadState = getEstadoViaje(viajeId);
  const fotosSubiendo = uploadState?.fotos;
  const isUploading = Boolean(uploadState?.isUploading);

  useEffect(() => {
    const fotosExitosas = (fotosSubiendo || []).filter((f) => f.status === 'success');
    if (fotosExitosas.length > 0 && !isUploading) {
      galeria.recargar?.();
    }
  }, [fotosSubiendo, isUploading, galeria]);

  const handleSetPortadaExistente = async (fotoId) => {
    const ok = await galeria.cambiarPortada(fotoId);
    if (!ok) pushToast('No se pudo actualizar la portada.', 'error');
  };

  const handleEliminarFoto = async (fotoId) => {
    const confirm = window.confirm('Eliminar esta foto de la galeria?');
    if (!confirm) return;
    const ok = await galeria.eliminar(fotoId);
    if (!ok) pushToast('No se pudo eliminar la foto.', 'error');
  };

  const handleCaptionChange = (fotoId, value) => {
    setCaptionDrafts((prev) => ({ ...prev, [fotoId]: value }));
  };

  const handleCaptionSave = async (foto) => {
    const draft = captionDrafts[foto.id];
    if (draft === undefined) return;

    const normalized = draft.trim();
    const nextCaption = normalized.length ? normalized : null;
    const currentCaption = foto.caption || null;
    if (currentCaption === nextCaption) return;

    const ok = await galeria.actualizarCaption(foto.id, nextCaption);
    if (!ok) {
      pushToast('No se pudo guardar el caption.', 'error');
      return;
    }

    pushToast('Caption actualizado.', 'success', 1500);
  };

  return {
    galeria,
    fotosSubiendo,
    isUploading,
    captionDrafts,
    showGalleryTools,
    setShowGalleryTools,
    toggleGalleryTools: () => setShowGalleryTools((prev) => !prev),
    onReintentarFoto: (fotoTempId) => reintentarFoto(viajeId, fotoTempId),
    handleSetPortadaExistente,
    handleEliminarFoto,
    handleCaptionChange,
    handleCaptionSave,
  };
}
