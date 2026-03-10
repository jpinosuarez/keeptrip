import { useCallback, useState } from 'react';

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

  const handleGuardarModal = useCallback(async (id, datosCombinados) => {
    if (isSavingModal) return null;
    setIsSavingModal(true);
    const { paradasNuevas, ...datosViaje } = datosCombinados;

    try {
      if (id === 'new') {
        const todasLasParadasLocal = [...(paradasNuevas || [])];
        if (ciudadInicialBorrador) {
          const yaExiste = todasLasParadasLocal.some((p) => p.nombre === ciudadInicialBorrador.nombre);
          if (!yaExiste) todasLasParadasLocal.unshift(ciudadInicialBorrador);
        }

        const nuevoId = await guardarNuevoViaje(datosViaje, todasLasParadasLocal);
        if (!nuevoId) {
          return null;
        }

        setViajeBorrador(null);
        setCiudadInicialBorrador(null);
        // Don't auto-open viewer for new trips created from search modal
        // setTimeout(() => abrirVisor(nuevoId), 500);
        return nuevoId;
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
    } finally {
      setIsSavingModal(false);
    }
  }, [
    isSavingModal,
    ciudadInicialBorrador,
    guardarNuevoViaje,
    setViajeBorrador,
    setCiudadInicialBorrador,
    actualizarDetallesViaje,
    agregarParada,
    pushToast,
  ]);

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
    handleGuardarModal,
    handleGuardarDesdeVisor,
    solicitarEliminarViaje,
    handleDeleteViaje,
  };
}
