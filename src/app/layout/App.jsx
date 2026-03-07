import React from 'react';

import LandingPage from '../../components/Landing/LandingPage';
import AppActiveView from './AppActiveView';
import AppModalsManager from './AppModalsManager';
import AppScaffold from './AppScaffold';

import CelebrationQueue from '@shared/ui/components/CelebrationQueue';
import PWAUpdatePrompt from '@shared/ui/components/PWAUpdatePrompt';
import OfflineBanner from '@shared/ui/components/OfflineBanner';

import { useViajes } from '../../hooks/useViajes';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAppShellComposition } from '../../hooks/useAppShellComposition';
import { useAuth, useToast, useSearch, useUI } from '@app/providers';
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
