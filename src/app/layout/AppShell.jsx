/**
 * AppShell — Capa de orquestación del shell autenticado.
 *
 * Fase 2 (Actual):
 *   - Renderiza el layout con Sidebar + Header + contenido de página.
 *   - El contenido de página se inyecta via <Outlet context={activeViewController} />.
 *   - Los adaptadores de ruta en AppRouter.jsx extraen lo que necesita cada página.
 *   - Los modales siguen siendo overlays globales gestionados por AppModalsManager.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';

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
import { useNavigate } from 'react-router-dom';

function AppShell() {
  const { isAdmin } = useAuth();
  const { pushToast } = useToast();
  const { isMobile } = useWindowSize(768);
  const navigate = useNavigate();

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
    fetchError,
    isError,
  } = useViajes();

  const {
    sidebarCollapsed,
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

  // Helper de E2E: permite a Playwright navegar a cualquier ruta programáticamente
  React.useEffect(() => {
    if (import.meta.env.VITE_ENABLE_TEST_LOGIN !== 'true') return undefined;
    window.__test_navigate = (path) => navigate(path);
    return () => { delete window.__test_navigate; };
  }, [navigate]);

  // Global Cmd+K listener to open SearchPalette from anywhere
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't trigger if user is typing in an input field or textarea
      const isFormActive = 
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isFormActive) {
        e.preventDefault();
        if (!searchPaletteOpen) {
          openSearchPalette();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchPaletteOpen, openSearchPalette]);

  const {
    onLugarSeleccionado,
    modalController,
    modalData,
    crudController,
    activeViewController,
    invitationsCount,
  } = useAppShellComposition({
    ui: {
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
      fetchError,
      isError,
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
    onAfterDelete: () => navigate('/trips'),
  });

  return (
    <AppScaffold
      isMobile={isMobile}
      sidebarCollapsed={sidebarCollapsed}
      invitationsCount={invitationsCount}
      content={<Outlet context={activeViewController} />}
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


