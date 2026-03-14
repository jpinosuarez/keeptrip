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
  onAfterDelete,
}) {
  const {
    mobileDrawerOpen,
    setMobileDrawerOpen,
    mostrarBuscador,
    closeBuscador,
    searchPaletteOpen,
    openSearchPalette,
    closeSearchPalette,
    viajeBorrador,
    setViajeBorrador,
    ciudadInicialBorrador,
    setCiudadInicialBorrador,
    confirmarEliminacion,
    setConfirmarEliminacion,
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
    pushToast,
    confirmarEliminacion,
    setConfirmarEliminacion,
    onAfterDelete,
  });

  const onLugarSeleccionado = useLugarSelectionDraft({
    closeBuscador,
    setFiltro,
    setViajeBorrador,
    setCiudadInicialBorrador,
  });

  useAppViewGuards({
    busqueda,
    setBusqueda,
    isMobile,
    mobileDrawerOpen,
    setMobileDrawerOpen,
  });

  const modalController = {
    mostrarBuscador,
    closeBuscador,
    searchPaletteOpen,
    openSearchPalette,
    closeSearchPalette,
    filtro,
    setFiltro,
    viajeBorrador,
    setViajeBorrador,
    ciudadInicialBorrador,
    setCiudadInicialBorrador,
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
