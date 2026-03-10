/**
 * AppShell — Capa de orquestación del shell autenticado.
 *
 * Fase 1 (Estado Actual):
 *   Contiene toda la lógica de datos y composición extraída de App.jsx.
 *   Sigue usando vistaActiva (state-based) para el cambio de vistas.
 *   AppActiveView se mantiene operativo durante la migración a React Router.
 *
 * Fase 2 (Próxima):
 *   AppActiveView será reemplazado por <Outlet /> cuando cada página
 *   tenga su propia ruta declarada en AppRouter.jsx.
 */
import React from 'react';

import AppActiveView from './AppActiveView';
import AppModalsManager from './AppModalsManager';
import AppScaffold from './AppScaffold';

import CelebrationQueue from '@shared/ui/components/CelebrationQueue';
import PWAUpdatePrompt from '@shared/ui/components/PWAUpdatePrompt';
import OfflineBanner from '@shared/ui/components/OfflineBanner';

import { useViajes } from '@features/viajes';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useAppShellComposition } from '@shared/lib/hooks/useAppShellComposition';
import { useAuth, useToast, useSearch, useUI } from '@app/providers';
import { useAchievements } from '@features/gamification';
import { useInvitations } from '@features/invitations';

function AppShell() {
  const { isAdmin } = useAuth();
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
    loading: loadingViajes,
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
    setVistaActiva,
  } = useUI();

  const { filtro, setFiltro, busqueda, setBusqueda } = useSearch();

  const {
    celebrations,
    dismissCelebration,
    dismissAll,
    stats: achievementStats,
    achievementsWithProgress,
  } = useAchievements({ paisesVisitados, bitacora, todasLasParadas });

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

  return (
    <AppScaffold
      isMobile={isMobile}
      sidebarCollapsed={sidebarCollapsed}
      invitationsCount={invitationsCount}
      content={<AppActiveView {...activeViewController} />}
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

export default AppShell;
