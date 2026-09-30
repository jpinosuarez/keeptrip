import React from 'react';
import { Outlet } from 'react-router-dom';

import AppModalsManager from './AppModalsManager';
import AppScaffold from './AppScaffold';

import { CelebrationQueue } from '@features/gamification/ui/components';
import { ENABLE_GAMIFICATION } from '@shared/config';
import ReadOnlyModeBanner from '@shared/ui/components/ReadOnlyModeBanner';
import OfflineBanner from '@shared/ui/components/OfflineBanner';

import { useViajes } from '@features/viajes/model/hooks/useViajes';
import { useAppShellComposition } from '@shared/lib/hooks/useAppShellComposition';
import { useAuth, useToast, useSearch, useUI } from '@app/providers';
import { useAchievements } from '@features/gamification';
import { useInvitations } from '@features/invitations';
import { useNavigate, useLocation } from 'react-router-dom';

function AppShell() {
  const { isAdmin } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Splash Handoff — Performance Architecture v6
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const splash = document.getElementById('keeptrip-splash');
        if (!splash) return;
        splash.setAttribute('aria-hidden', 'true');
        splash.style.zIndex = '-1';
        splash.style.pointerEvents = 'none';
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

  // Helper de E2E
  React.useEffect(() => {
    if (import.meta.env.VITE_ENABLE_TEST_LOGIN !== 'true') return undefined;
    window.__test_navigate = (path) => navigate(path);
    return () => { delete window.__test_navigate; };
  }, [navigate]);

  // Global Cmd+K listener
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
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
          <OfflineBanner />
          <ReadOnlyModeBanner />
        </>
      )}
    />
  );
}

export default AppShell;



