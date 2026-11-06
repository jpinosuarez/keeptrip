import { useCallback, useEffect } from 'react';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { db as firestoreDb } from '@shared/firebase';
import { actualizarParadaFoto } from '@shared/api/services/viajes/galeriaService';

export function useEdicionGalleryManager({
  galeria,
  captionDrafts,
  setCaptionDrafts,
  pushToast,
  t,
  viajeId = null,
  ownerUid = null,
  db = firestoreDb,
  activeTab = 'route',
}) {
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyMode = Boolean(appReadonlyMode) || operationalLevel >= 3;

  // Immediate gallery hydration when the editor is deep-linked straight to the
  // gallery tab (?editing=ID&tab=galeria): force a reload as soon as viajeId is
  // resolved, instead of waiting for a manual tab re-click.
  useEffect(() => {
    if (viajeId && activeTab === 'gallery' && typeof galeria?.recargar === 'function') {
      galeria.recargar();
    }
    // Keyed on viajeId + activeTab only to avoid re-running on galeria identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId, activeTab]);

  const handleSetPortadaExistente = useCallback(
    async (fotoId) => {
      if (isReadOnlyMode) {
        pushToast(
          t(
            'common:operational.readOnlyBlockedAction',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          ),
          'info'
        );
        return;
      }

      try {
        const ok = await galeria.cambiarPortada(fotoId);
        if (!ok) pushToast(t('error.coverUpdateFailed'), 'error');
      } catch {
        pushToast(t('error.coverUpdateFailed', 'No se pudo actualizar la portada.'), 'error');
      }
    },
    [galeria, isReadOnlyMode, pushToast, t]
  );

  const handleEliminarFoto = useCallback(
    async (fotoId) => {
      if (isReadOnlyMode) {
        pushToast(
          t(
            'common:operational.readOnlyBlockedAction',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          ),
          'info'
        );
        return;
      }

      const confirm = window.confirm(t('confirm.deletePhoto'));
      if (!confirm) return;
      try {
        const ok = await galeria.eliminar(fotoId);
        if (!ok) pushToast(t('error.photoDeleteFailed'), 'error');
      } catch {
        pushToast(t('error.photoDeleteFailed', 'No se pudo eliminar la foto.'), 'error');
      }
    },
    [galeria, isReadOnlyMode, pushToast, t]
  );

  const handleCaptionChange = useCallback((fotoId, value) => {
    setCaptionDrafts((prev) => ({ ...prev, [fotoId]: value }));
  }, [setCaptionDrafts]);

  const handleCaptionSave = useCallback(
    async (foto) => {
      if (isReadOnlyMode) {
        pushToast(
          t(
            'common:operational.readOnlyBlockedAction',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          ),
          'info'
        );
        return;
      }

      const draft = captionDrafts[foto.id];
      if (draft === undefined) return;

      const normalized = draft.trim();
      const nextCaption = normalized.length ? normalized : null;
      const currentCaption = foto.caption || null;
      if (currentCaption === nextCaption) return;

      try {
        const ok = await galeria.actualizarCaption(foto.id, nextCaption);
        if (!ok) {
          pushToast(t('error.captionSaveFailed'), 'error');
          return;
        }
        pushToast(t('toast.captionUpdated'), 'success', 1500);
      } catch {
        pushToast(t('error.captionSaveFailed', 'No se pudo guardar la descripción.'), 'error');
      }
    },
    [captionDrafts, galeria, isReadOnlyMode, pushToast, t]
  );

  const handleAssignParada = useCallback(
    async (foto, paradaId) => {
      if (isReadOnlyMode) {
        pushToast(
          t(
            'common:operational.readOnlyBlockedAction',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          ),
          'info'
        );
        return;
      }

      if (!foto?.id || !viajeId || !ownerUid) return;

      try {
        const ok = await actualizarParadaFoto({
          db,
          userId: ownerUid,
          viajeId,
          fotoId: foto.id,
          paradaId: paradaId || null,
        });
        if (!ok) pushToast(t('error.photoAssignFailed', 'No se pudo asignar la parada.'), 'error');
      } catch {
        pushToast(t('error.photoAssignFailed', 'No se pudo asignar la parada.'), 'error');
      }
    },
    [db, isReadOnlyMode, ownerUid, pushToast, t, viajeId]
  );

  return {
    handleSetPortadaExistente,
    handleEliminarFoto,
    handleCaptionChange,
    handleCaptionSave,
    handleAssignParada,
  };
}
