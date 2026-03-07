import { useAppViewGuards } from './useAppViewGuards';
import { useViajeCrudHandlers } from './useViajeCrudHandlers';
import { useLugarSelectionDraft } from './useLugarSelectionDraft';

export function useAppShellComposition({
  ui,
  search,
  viajes,
  permissions,
  feedback,
  gamification,
  invitations,
}) {
  const {
    vistaActiva,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    setVistaActiva,
    mostrarBuscador,
    closeBuscador,
    viajeEnEdicionId,
    setViajeEnEdicionId,
    viajeExpandidoId,
    setViajeExpandidoId,
    viajeBorrador,
    setViajeBorrador,
    ciudadInicialBorrador,
    setCiudadInicialBorrador,
    confirmarEliminacion,
    setConfirmarEliminacion,
    abrirVisor,
  } = ui;

  const { busqueda, setBusqueda, filtro, setFiltro } = search;

  const {
    paisesVisitados,
    bitacora,
    bitacoraData,
    todasLasParadas,
    loadingViajes,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    actualizarParadaHook,
    eliminarViaje,
    agregarParada,
  } = viajes;

  const { isAdmin, isMobile } = permissions;
  const { pushToast } = feedback;
  const { achievementsWithProgress, achievementStats } = gamification;

  const {
    isSavingModal,
    isSavingViewer,
    viajesEliminando,
    isDeletingViaje,
    handleGuardarModal,
    handleGuardarDesdeVisor,
    solicitarEliminarViaje,
    handleDeleteViaje,
  } = useViajeCrudHandlers({
    guardarNuevoViaje,
    actualizarDetallesViaje,
    actualizarParadaHook,
    eliminarViaje,
    agregarParada,
    ciudadInicialBorrador,
    setViajeBorrador,
    setCiudadInicialBorrador,
    abrirVisor,
    pushToast,
    confirmarEliminacion,
    setConfirmarEliminacion,
    setViajeExpandidoId,
    setViajeEnEdicionId,
  });

  const onLugarSeleccionado = useLugarSelectionDraft({
    closeBuscador,
    setFiltro,
    setViajeBorrador,
    setCiudadInicialBorrador,
    setViajeEnEdicionId,
    setViajeExpandidoId,
  });

  useAppViewGuards({
    vistaActiva,
    busqueda,
    setBusqueda,
    isMobile,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    isAdmin,
    setVistaActiva,
  });

  const modalController = {
    mostrarBuscador,
    closeBuscador,
    filtro,
    setFiltro,
    viajeEnEdicionId,
    setViajeEnEdicionId,
    viajeExpandidoId,
    setViajeExpandidoId,
    viajeBorrador,
    setViajeBorrador,
    ciudadInicialBorrador,
    confirmarEliminacion,
    setConfirmarEliminacion,
  };

  const modalData = {
    bitacora,
    bitacoraData,
  };

  const crudController = {
    isSavingModal,
    isSavingViewer,
    viajesEliminando,
    handleGuardarModal,
    handleGuardarDesdeVisor,
    solicitarEliminarViaje,
    handleDeleteViaje,
  };

  const activeViewController = {
    view: {
      vistaActiva,
      isAdmin,
      isMobile,
    },
    data: {
      paisesVisitados,
      bitacora,
      loadingViajes,
      todasLasParadas,
      bitacoraData,
    },
    crud: {
      solicitarEliminarViaje,
      isDeletingViaje,
    },
    gamification: {
      achievementsWithProgress,
      achievementStats,
    },
    invitations,
  };

  return {
    onLugarSeleccionado,
    modalController,
    modalData,
    crudController,
    activeViewController,
    invitationsCount: invitations?.invitations?.length || 0,
  };
}
