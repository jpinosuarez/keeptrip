import { useCallback, useState } from 'react';
import { construirBanderasViaje, construirCiudadesViaje } from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';


function isDraftMeaningful(data, paradas = []) {
  const title = String(data?.titulo || '').trim();
  const hasTitle = title.length > 0;
  const hasLocation = Array.isArray(data?.coordenadas) && data.coordenadas.some(Boolean);
  const hasParadas = Array.isArray(paradas) && paradas.length > 0;
  const hasText = String(data?.texto || '').trim().length > 0;
  return hasTitle || hasLocation || hasParadas || hasText;
}

function rebuildStoryMetadata(datosViaje = {}, paradas = []) {
  const safeParadas = Array.isArray(paradas) ? paradas : [];
  const uniqueCodes = [
    ...new Set(safeParadas.map((parada) => parada?.paisCodigo || parada?.countryCode).filter(Boolean)),
  ];
  const rebuiltFlags = uniqueCodes.map((code) => getFlagUrl(code)).filter(Boolean);
  const fallbackFlags = construirBanderasViaje(datosViaje.code || datosViaje.paisCodigo || '', safeParadas);
  const freshFlags = rebuiltFlags.length > 0 ? rebuiltFlags : fallbackFlags;

  return {
    ...datosViaje,
    banderas: freshFlags,
    flags: freshFlags,
    ciudades: construirCiudadesViaje(safeParadas),
  };
}

function isPersistedStopId(id) {
  if (!id) return false;
  const value = id.toString();
  return !value.startsWith('temp') && value !== 'init';
}

export function useViajeCrudHandlers({
  guardarNuevoViaje,
  actualizarDetallesViaje,
  actualizarParadaHook,
  eliminarParadaHook = async () => true,
  eliminarViaje,
  agregarParada,
  ciudadInicialBorrador,
  setViajeBorrador,
  setCiudadInicialBorrador,
  pushToast,
  confirmarEliminacion,
  setConfirmarEliminacion,
  onAfterDelete,
}) {
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [isSavingViewer, setIsSavingViewer] = useState(false);
  const [viajesEliminando, setViajesEliminando] = useState(new Set());

  const executeStopMutations = useCallback(async ({ tripId, paradasNuevas = [], deletedStopIds = [] }) => {
    const addOrUpdatePromises = (Array.isArray(paradasNuevas) ? paradasNuevas : []).map((parada) => {
      const stopId = parada?.id;
      const isNew = stopId && stopId.toString().startsWith('temp');
      if (isNew) {
        return agregarParada(parada, tripId);
      }
      if (isPersistedStopId(stopId)) {
        return actualizarParadaHook(parada, tripId);
      }
      return Promise.resolve(true);
    });

    const deletePromises = [...new Set((Array.isArray(deletedStopIds) ? deletedStopIds : []).filter(isPersistedStopId))]
      .map((paradaId) => eliminarParadaHook(tripId, paradaId));

    const allResults = await Promise.allSettled([...addOrUpdatePromises, ...deletePromises]);
    return allResults.every((result) => result.status === 'fulfilled' && result.value);
  }, [agregarParada, actualizarParadaHook, eliminarParadaHook]);

  const isDeletingViaje = useCallback((id) => viajesEliminando.has(id), [viajesEliminando]);

  // PHASE 1: Pure database persistence (no UI side-effects)
  const saveTripToDb = useCallback(async (id, datosCombinados) => {
    // Aseguramos que valores falsy de id se traten como nuevo viaje para no fallar
    const targetId = id || 'new';
    const {
      paradasNuevas,
      deletedStopIds = [],
      ...datosViaje
    } = datosCombinados;

    console.log('[useViajeCrudHandlers] saveTripToDb targetId:', targetId, 'datosViaje:', datosViaje);

    try {
      if (targetId === 'new') {
        const todasLasParadasLocal = [...(paradasNuevas || [])];
        if (ciudadInicialBorrador) {
          const yaExiste = todasLasParadasLocal.some((p) => p.nombre === ciudadInicialBorrador.nombre);
          if (!yaExiste) todasLasParadasLocal.unshift(ciudadInicialBorrador);
        }

        // Pre-flight: don't persist an empty draft (title + stops absent)
        if (!isDraftMeaningful(datosViaje, todasLasParadasLocal)) {
          return null;
        }

        const datosViajeConStory = rebuildStoryMetadata(datosViaje, todasLasParadasLocal);
        const nuevoId = await guardarNuevoViaje(datosViajeConStory, todasLasParadasLocal);
        console.log('[useViajeCrudHandlers] nuevoId devuelto de guardarNuevoViaje:', nuevoId);
        if (nuevoId) {
          setViajeBorrador(null);
          setCiudadInicialBorrador(null);
        }
        return nuevoId || null;
      }

      const datosViajeConStory = rebuildStoryMetadata(datosViaje, paradasNuevas);
      const okViaje = await actualizarDetallesViaje(id, datosViajeConStory);
      const okParadas = okViaje
        ? await executeStopMutations({ tripId: id, paradasNuevas, deletedStopIds })
        : false;

      if (okViaje && okParadas) {
        return id;
      }

      if (okViaje && !okParadas) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
        return id;
      }
      return null;
    } catch {
      pushToast('Error al guardar el viaje', 'error');
      return null;
    }
  }, [
    ciudadInicialBorrador,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    executeStopMutations,
    pushToast,
    setViajeBorrador,
    setCiudadInicialBorrador,
  ]);

  // PHASE 1: Explicit UI cleanup (only called by user close action)
  const closeTripEditor = useCallback(() => {
    setViajeBorrador(null);
    setCiudadInicialBorrador(null);
  }, [setViajeBorrador, setCiudadInicialBorrador]);

  const handleGuardarModal = useCallback(
    async (id, datosCombinados) => {
      if (isSavingModal) return null;
      setIsSavingModal(true);

      try {
        // PHASE 1: Delegate to pure DB function, no UI cleanup here
        const result = await saveTripToDb(id, datosCombinados);
        return result;
      } finally {
        setIsSavingModal(false);
      }
    },
    [isSavingModal, saveTripToDb]
  );

  const handleGuardarDesdeVisor = useCallback(async (id, datosCombinados) => {
    if (isSavingViewer) return false;
    setIsSavingViewer(true);
    const {
      paradasNuevas,
      deletedStopIds = [],
      ...datosViaje
    } = datosCombinados;
    const datosViajeConStory = rebuildStoryMetadata(datosViaje, paradasNuevas);

    try {
      const okViaje = await actualizarDetallesViaje(id, datosViajeConStory);
      const okParadas = okViaje
        ? await executeStopMutations({ tripId: id, paradasNuevas, deletedStopIds })
        : false;

      if (okViaje && okParadas) {
        return id;
      }

      if (okViaje && !okParadas) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
        return id;
      }
      return false;
    } finally {
      setIsSavingViewer(false);
    }
  }, [isSavingViewer, actualizarDetallesViaje, executeStopMutations, pushToast]);

  const solicitarEliminarViaje = useCallback((id) => {
    if (!id || viajesEliminando.has(id)) return;
    setConfirmarEliminacion(id);
  }, [viajesEliminando, setConfirmarEliminacion]);

  const handleDeleteViaje = useCallback(async () => {
    const id = confirmarEliminacion;
    if (!id || viajesEliminando.has(id)) return false;

    setViajesEliminando((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const ok = await eliminarViaje(id);
      if (!ok) return false;
      onAfterDelete?.();
      return true;
    } finally {
      setConfirmarEliminacion(null);
      setViajesEliminando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [
    confirmarEliminacion,
    viajesEliminando,
    eliminarViaje,
    onAfterDelete,
    setConfirmarEliminacion,
  ]);

  return {
    isSavingModal,
    isSavingViewer,
    viajesEliminando,
    isDeletingViaje,
    saveTripToDb,
    closeTripEditor,
    handleGuardarModal,
    handleGuardarDesdeVisor,
    solicitarEliminarViaje,
    handleDeleteViaje,
  };
}
