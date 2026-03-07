import React from 'react';

import LandingPage from './components/Landing/LandingPage';
import AppActiveView from './components/AppShell/AppActiveView';
import AppModalsManager from './components/AppShell/AppModalsManager';
import AppScaffold from './components/AppShell/AppScaffold';

import CelebrationQueue from './components/Shared/CelebrationQueue';
import PWAUpdatePrompt from './components/Shared/PWAUpdatePrompt';
import OfflineBanner from './components/Shared/OfflineBanner';

import { useViajes } from './hooks/useViajes';
import { useWindowSize } from './hooks/useWindowSize';
import { useAppShellComposition } from './hooks/useAppShellComposition';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useSearch, useUI } from './context/UIContext';
import { useAchievements } from '@features/gamification';
import { useInvitations } from '@features/invitations';

function App() {
  const { usuario, cargando, isAdmin } = useAuth();
  const { pushToast } = useToast();
  const { isMobile } = useWindowSize(768);

  const {
    paisesVisitados,
    bitacora,
    bitacoraData,
    todasLasParadas,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    actualizarParada: actualizarParadaHook,
    eliminarViaje,
    agregarParada,
    loading: loadingViajes
  } = useViajes();

  const {
    vistaActiva,
    sidebarCollapsed,
    mobileDrawerOpen,
    setMobileDrawerOpen,
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
    setVistaActiva
  } = useUI();

  const { filtro, setFiltro, busqueda, setBusqueda } = useSearch();

  // ── Gamification: achievements + level-up celebrations ──
  const {
    celebrations,
    dismissCelebration,
    dismissAll,
    stats: achievementStats,
    achievementsWithProgress,
  } = useAchievements({ paisesVisitados, bitacora, todasLasParadas });

  // Single source of truth for invitations to avoid duplicate Firestore listeners.
  const invitationsHook = useInvitations();

  const {
    onLugarSeleccionado,
    modalController,
    modalData,
    crudController,
    activeViewController,
    invitationsCount,
  } = useAppShellComposition({
    ui: {
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
    },
    search: {
      busqueda,
      setBusqueda,
      filtro,
      setFiltro,
    },
    viajes: {
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
    },
    permissions: {
      isAdmin,
      isMobile,
    },
    feedback: {
      pushToast,
    },
    gamification: {
      achievementsWithProgress,
      achievementStats,
    },
    invitations: invitationsHook,
  });

  if (!cargando && !usuario) return <LandingPage />;

  return (
    <AppScaffold
      isMobile={isMobile}
      sidebarCollapsed={sidebarCollapsed}
      invitationsCount={invitationsCount}
      content={(
        <AppActiveView {...activeViewController} />
      )}
      overlays={(
        <>
          <AppModalsManager
            modalController={modalController}
            data={modalData}
            crud={crudController}
            onLugarSeleccionado={onLugarSeleccionado}
            pushToast={pushToast}
          />

          <CelebrationQueue
            celebrations={celebrations}
            onDismiss={dismissCelebration}
            onDismissAll={dismissAll}
          />

          <PWAUpdatePrompt />
          <OfflineBanner />
        </>
      )}
    />
  );
}

export default App;
