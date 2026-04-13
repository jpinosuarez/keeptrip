import { useCallback, useState } from 'react';
import { construirBanderasViaje, construirCiudadesViaje } from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

function isDraftMeaningful(data, stops = []) {
  const title = String(data?.titulo || '').trim();
  const hasTitle = title.length > 0;
  const hasLocation = Array.isArray(data?.coordenadas) && data.coordenadas.some(Boolean);
  const hasStops = Array.isArray(stops) && stops.length > 0;
  const hasText = String(data?.texto || '').trim().length > 0;
  return hasTitle || hasLocation || hasStops || hasText;
}

function rebuildStoryMetadata(tripData = {}, stops = []) {
  const safeStops = Array.isArray(stops) ? stops : [];
  const uniqueCodes = [
    ...new Set(safeStops.map((stop) => stop?.paisCodigo || stop?.countryCode).filter(Boolean)),
  ];
  const rebuiltFlags = uniqueCodes.map((code) => getFlagUrl(code)).filter(Boolean);
  const fallbackFlags = construirBanderasViaje(tripData.code || tripData.paisCodigo || '', safeStops);
  const finalFlags = rebuiltFlags.length > 0 ? rebuiltFlags : fallbackFlags;

  return {
    ...tripData,
    banderas: finalFlags,
    flags: finalFlags,
    ciudades: construirCiudadesViaje(safeStops),
  };
}

export function useViajeCrudHandlers({
  guardarNuevoViaje: createTrip,
  actualizarDetallesViaje: updateTripDetails,
  updateStopsBatch,
  eliminarViaje: deleteTrip,
  ciudadInicialBorrador: initialDraftCity,
  setViajeBorrador: setDraftTrip,
  setCiudadInicialBorrador: setInitialDraftCity,
  pushToast,
  confirmarEliminacion: pendingDeleteTripId,
  setConfirmarEliminacion: setPendingDeleteTripId,
  onAfterDelete,
}) {
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [isSavingViewer, setIsSavingViewer] = useState(false);
  const [deletingTripIds, setDeletingTripIds] = useState(new Set());

  const isDeletingTrip = useCallback((id) => deletingTripIds.has(id), [deletingTripIds]);

  const closeTripEditor = useCallback(() => {
    setDraftTrip(null);
    setInitialDraftCity(null);
  }, [setDraftTrip, setInitialDraftCity]);

  const saveTripToDb = useCallback(async (id, formPayload, existingStops = []) => {
    const targetTripId = id || 'new';
    const newStops = formPayload?.newStops || formPayload?.paradasNuevas || [];
    const { newStops: _newStops, paradasNuevas: _legacyNewStops, ...tripData } = formPayload || {};

    try {
      if (targetTripId === 'new') {
        const localStops = [...newStops];

        if (initialDraftCity) {
          const alreadyExists = localStops.some((stop) => stop.nombre === initialDraftCity.nombre);
          if (!alreadyExists) localStops.unshift(initialDraftCity);
        }

        if (!isDraftMeaningful(tripData, localStops)) {
          return null;
        }

        const tripDataWithStory = rebuildStoryMetadata(tripData, localStops);
        const createdTripId = await createTrip(tripDataWithStory, localStops);

        if (createdTripId) {
          closeTripEditor();
        }

        return createdTripId || null;
      }

      const tripDataWithStory = rebuildStoryMetadata(tripData, newStops);
      const isTripUpdated = await updateTripDetails(targetTripId, tripDataWithStory);

      let areStopsUpdated = true;
      if (newStops.length > 0) {
        areStopsUpdated = await updateStopsBatch(newStops, targetTripId, existingStops);
      }

      if (isTripUpdated && areStopsUpdated) {
        return targetTripId;
      }

      if (isTripUpdated && !areStopsUpdated) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
        return targetTripId;
      }

      return null;
    } catch {
      pushToast('Error al guardar el viaje', 'error');
      return null;
    }
  }, [
    initialDraftCity,
    createTrip,
    updateTripDetails,
    updateStopsBatch,
    closeTripEditor,
    pushToast,
  ]);

  const handleSaveModal = useCallback(async (id, formPayload, existingStops = []) => {
    if (isSavingModal) return null;

    setIsSavingModal(true);
    try {
      return await saveTripToDb(id, formPayload, existingStops);
    } finally {
      setIsSavingModal(false);
    }
  }, [isSavingModal, saveTripToDb]);

  const handleSaveFromViewer = useCallback(async (id, formPayload, existingStops = []) => {
    if (isSavingViewer) return false;

    setIsSavingViewer(true);

    const newStops = formPayload?.newStops || formPayload?.paradasNuevas || [];
    const { newStops: _newStops, paradasNuevas: _legacyNewStops, ...tripData } = formPayload || {};
    const tripDataWithStory = rebuildStoryMetadata(tripData, newStops);

    try {
      const isTripUpdated = await updateTripDetails(id, tripDataWithStory);
      let areStopsUpdated = true;

      if (newStops.length > 0) {
        areStopsUpdated = await updateStopsBatch(newStops, id, existingStops);
      }

      if (isTripUpdated && areStopsUpdated) {
        return id;
      }

      if (isTripUpdated && !areStopsUpdated) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
        return id;
      }

      return false;
    } finally {
      setIsSavingViewer(false);
    }
  }, [isSavingViewer, updateTripDetails, updateStopsBatch, pushToast]);

  const requestTripDelete = useCallback((id) => {
    if (!id || deletingTripIds.has(id)) return;
    setPendingDeleteTripId(id);
  }, [deletingTripIds, setPendingDeleteTripId]);

  const handleDeleteTrip = useCallback(async () => {
    const tripId = pendingDeleteTripId;
    if (!tripId || deletingTripIds.has(tripId)) return false;

    setDeletingTripIds((prev) => {
      const next = new Set(prev);
      next.add(tripId);
      return next;
    });

    try {
      const isDeleted = await deleteTrip(tripId);
      if (!isDeleted) return false;
      onAfterDelete?.();
      return true;
    } finally {
      setPendingDeleteTripId(null);
      setDeletingTripIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  }, [
    pendingDeleteTripId,
    deletingTripIds,
    deleteTrip,
    onAfterDelete,
    setPendingDeleteTripId,
  ]);

  return {
    isSavingModal,
    isSavingViewer,
    deletingTripIds,
    isDeletingTrip,
    saveTripToDb,
    closeTripEditor,
    handleSaveModal,
    handleSaveFromViewer,
    requestTripDelete,
    handleDeleteTrip,
    // Legacy aliases kept to avoid breaking existing callers.
    viajesEliminando: deletingTripIds,
    isDeletingViaje: isDeletingTrip,
    handleGuardarModal: handleSaveModal,
    handleGuardarDesdeVisor: handleSaveFromViewer,
    solicitarEliminarViaje: requestTripDelete,
    handleDeleteViaje: handleDeleteTrip,
  };
}
