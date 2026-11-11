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
    fetchError,
    isError,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    updateStopsBatch,
    eliminarViaje,
  } = viajes;

  const { isAdmin, isMobile } = permissions;
  const { pushToast } = feedback;
  const { achievementsWithProgress, achievementStats } = gamification;

  const {
    isSavingModal,
    isSavingViewer,
    deletingTripIds,
    isDeletingTrip,
    handleSaveModal,
    handleSaveFromViewer,
    requestTripDelete,
    handleDeleteTrip,
  } = useViajeCrudHandlers({
    guardarNuevoViaje,
    actualizarDetallesViaje,
    updateStopsBatch,
    eliminarViaje,
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
    deletingTripIds,
    handleSaveModal,
    handleSaveFromViewer,
    requestTripDelete,
    handleDeleteTrip,
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
      fetchError,
      isError,
      todasLasParadas,
      bitacoraData,
    },
    crud: {
      solicitarEliminarViaje: requestTripDelete,
      isDeletingViaje: isDeletingTrip,
    },
    gamification: {
      // Forward the FULL gamification bundle (countryEmblems, xpBreakdown,
      // conquestColor, isConquestColorUnlocked, nextAchievableBadges…).
      // Dropping keys here silently falls back to real-data derivations in the
      // Traveler Hub — e.g. DEV God Mode badges would unlock but emblems would not.
      ...gamification,
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
