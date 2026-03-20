import { useCallback, useState } from 'react';


function isDraftMeaningful(data, paradas = []) {
  const title = String(data?.titulo || '').trim();
  const hasTitle = title.length > 0;
  const hasLocation = Array.isArray(data?.coordenadas) && data.coordenadas.some(Boolean);
  const hasParadas = Array.isArray(paradas) && paradas.length > 0;
  const hasText = String(data?.texto || '').trim().length > 0;
  return hasTitle || hasLocation || hasParadas || hasText;
}

export function useViajeCrudHandlers({
  guardarNuevoViaje,
  actualizarDetallesViaje,
  actualizarParadaHook,
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

  const isDeletingViaje = useCallback((id) => viajesEliminando.has(id), [viajesEliminando]);

  // PHASE 1: Pure database persistence (no UI side-effects)
  const saveTripToDb = useCallback(async (id, datosCombinados) => {
    // Aseguramos que valores falsy de id se traten como nuevo viaje para no fallar
    const targetId = id || 'new';
    const { paradasNuevas, ...datosViaje } = datosCombinados;

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

        const nuevoId = await guardarNuevoViaje(datosViaje, todasLasParadasLocal);
        console.log('[useViajeCrudHandlers] nuevoId devuelto de guardarNuevoViaje:', nuevoId);
        if (nuevoId) {
          setViajeBorrador(null);
          setCiudadInicialBorrador(null);
        }
        return nuevoId || null;
      }

      const okViaje = await actualizarDetallesViaje(id, datosViaje);
      let okParadas = true;

      if (paradasNuevas && paradasNuevas.length > 0) {
        const nuevasReales = paradasNuevas.filter((p) => p.id && p.id.toString().startsWith('temp'));
        for (const parada of nuevasReales) {
          const okParada = await agregarParada(parada, id);
          if (!okParada) okParadas = false;
        }
      }

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
  }, [ciudadInicialBorrador, guardarNuevoViaje, actualizarDetallesViaje, agregarParada, pushToast]);

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
    const { paradasNuevas, ...datosViaje } = datosCombinados;

    try {
      const okViaje = await actualizarDetallesViaje(id, datosViaje);
      let okParadas = true;

      if (paradasNuevas && paradasNuevas.length > 0) {
        for (const parada of paradasNuevas) {
          const isNew = parada.id && parada.id.toString().startsWith('temp');
          if (isNew) {
            const okParada = await agregarParada(parada, id);
            if (!okParada) okParadas = false;
          } else if (parada.id) {
            const okParada = await actualizarParadaHook(parada, id);
            if (!okParada) okParadas = false;
          }
        }
      }

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
  }, [isSavingViewer, actualizarDetallesViaje, agregarParada, actualizarParadaHook, pushToast]);

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
