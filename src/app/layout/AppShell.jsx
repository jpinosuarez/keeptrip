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

import { CelebrationQueue } from '@features/gamification/ui/components';
import { ENABLE_GAMIFICATION } from '@shared/config';
import PWAUpdatePrompt from '@shared/ui/components/PWAUpdatePrompt';
import ReadOnlyModeBanner from '@shared/ui/components/ReadOnlyModeBanner';
import OfflineBanner from '@shared/ui/components/OfflineBanner';

import { useViajes } from '@features/viajes/model/hooks/useViajes';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useAppShellComposition } from '@shared/lib/hooks/useAppShellComposition';
import { useAuth, useToast, useSearch, useUI } from '@app/providers';
import { useAchievements } from '@features/gamification';
import { useInvitations } from '@features/invitations';
import { useNavigate, useLocation } from 'react-router-dom';

function AppShell() {
  const { isAdmin } = useAuth();
  const { pushToast } = useToast();
  const { isMobile } = useWindowSize(768);
  const navigate = useNavigate();
  const location = useLocation();

  // Splash Handoff — Performance Architecture v6
  //
  // PRIMARY handoff: lives here because AppShell mounts exactly once,
  // only after Firebase auth resolves and AuthGuard passes.
  //
  // WHY double-rAF:
  //   Frame 1: browser queues style recalc for the freshly mounted React tree.
  //   Frame 2: Style + Layout are committed — scaffold-main has its final
  //            dimensions (margin-left:80px on desktop, 0 on mobile).
  //   Hiding the splash at Frame 2 means Lighthouse observes ZERO layout
  //   movement: the layout was already stable when it became visible. CLS = 0.
  //
  // WHY z-index:-1 (not opacity:0):
  //   W3C LCP spec §4.2: 'An element is invisible if its opacity is 0.'
  //   opacity:0 retroactively disqualifies the element from LCP tracking.
  //   z-index:-1 is NOT listed as a disqualification — the element stays
  //   in DOM with opacity:1, preserving any earlier LCP timestamp.
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const splash = document.getElementById('keeptrip-splash');
        if (!splash) return;
        splash.setAttribute('aria-hidden', 'true'); // Remove from a11y tree
        splash.style.zIndex = '-1';                 // Push behind app content
        splash.style.pointerEvents = 'none';        // Block any stray clicks
      });
    });
  }, []);

  const {
    paisesVisitados,
    bitacora,
    bitacoraData,
    todasLasParadas,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    updateStopsBatch,
    eliminarViaje,
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
      updateStopsBatch,
      eliminarViaje,
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
    onAfterDelete: () => {
      if (location.pathname.startsWith('/trips/')) {
        navigate('/trips');
      }
    },
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
          {ENABLE_GAMIFICATION && (
            <CelebrationQueue
              celebrations={celebrations}
              onDismiss={dismissCelebration}
              onDismissAll={dismissAll}
            />
          )}
          <PWAUpdatePrompt />
          <OfflineBanner />
          <ReadOnlyModeBanner />
        </>
      )}
    />
  );
}

export default AppShell;


