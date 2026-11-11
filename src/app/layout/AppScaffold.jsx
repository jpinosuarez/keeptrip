import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@widgets/sidebar';
import { Header } from '@widgets/header';
import { useUI } from '@app/providers/UIContext';
import { DEV_MENU_EVENT, isDevMenuOpen, setDevMenuOpen } from '@shared/dev/devMenuState';
import { cn } from '@shared/lib/utils/cn';

// DEV-only: `import.meta.env.DEV` is statically replaced with `false` in
// production, so the dynamic import (and its chunk) is dead-code-eliminated.
const DevFloatingMenu = import.meta.env.DEV
  ? React.lazy(() => import('@shared/dev/ui/DevFloatingMenu'))
  : null;

function AppScaffold({ sidebarCollapsed: propSidebarCollapsed, invitationsCount, content, overlays }) {
  const { t } = useTranslation('landing');
  const { sidebarCollapsed: uiSidebarCollapsed } = useUI();

  // DEV-only floating panel state, mirrored from the shared dev store so the
  // profile bottom sheet can open the same panel.
  const [showDevMenu, setShowDevMenu] = useState(() => isDevMenuOpen());
  useEffect(() => {
    const sync = () => setShowDevMenu(isDevMenuOpen());
    window.addEventListener(DEV_MENU_EVENT, sync);
    return () => window.removeEventListener(DEV_MENU_EVENT, sync);
  }, []);

  const isCollapsed = propSidebarCollapsed !== undefined ? propSidebarCollapsed : uiSidebarCollapsed;
  const location = useLocation();
  const isMapRoute = location.pathname === '/map' || location.pathname === '/mapa';
  // Trip Viewer (/trips/:id) owns the whole editorial experience: the generic
  // "Mis Viajes" header must never render concurrently with it.
  const isTripViewer =
    location.pathname.startsWith('/trips/') && location.pathname !== '/trips';
  const sidebarWidth = isCollapsed ? '80px' : '256px';

  // Expose the live sidebar width as a CSS variable so overlays/portals
  // (Trip Viewer + loading skeleton) can offset themselves responsively.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    return undefined;
  }, [sidebarWidth]);

  const handleTransitionEnd = useCallback((e) => {
    // Only dispatch on main's margin transition end to avoid noise from children
    if (e.target === e.currentTarget && (e.propertyName === 'margin-left' || e.propertyName === 'margin')) {
      window.dispatchEvent(new Event('resize'));
    }
  }, []);

  return (
    <div
      className="flex w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-slate-50 pb-safe"
      style={{ '--sidebar-width': sidebarWidth }}
    >
      
      {/* Sidebar - Fixed rail outside main flow */}
      <Sidebar />

      {/* Main Content Area - Transitions margin based on sidebar state via CSS */}
      <main
        onTransitionEnd={handleTransitionEnd}
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden transition-[margin] duration-300 ease-in-out",
          isCollapsed ? "ml-0 md:ml-20" : "ml-0 md:ml-64"
        )}
      >
        {!isTripViewer && <Header invitationsCount={invitationsCount} />}

        <section className={cn(
          "flex flex-col flex-1 min-w-0 min-h-0 w-full max-w-full overflow-hidden",
          isMapRoute ? "p-0 md:px-6 md:py-4" : "px-3 py-3 md:px-6 md:py-4",
          "pb-[max(16px,env(safe-area-inset-bottom,0px))] md:pb-[max(24px,env(safe-area-inset-bottom,0px))]"
        )}>
          {content}
        </section>
      </main>

      {overlays}

      {import.meta.env.DEV && (
        <>
          <button
            type="button"
            onClick={() => setDevMenuOpen(!showDevMenu)}
            aria-label={t('devDock.panel.open', 'Abrir panel de desarrollo')}
            className={cn(
              'fixed bottom-20 left-4 md:bottom-4 md:left-4 z-[9999]',
              'px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400',
              'border border-slate-700 shadow-lg font-mono text-xs font-bold',
              'flex items-center gap-1.5 cursor-pointer',
            )}
            data-testid="dev-floating-trigger"
          >
            <span aria-hidden="true">🛠️</span>
            <span>{t('devDock.panel.trigger', 'DEV')}</span>
          </button>

          {showDevMenu && (
            <React.Suspense fallback={null}>
              <DevFloatingMenu onClose={() => setDevMenuOpen(false)} />
            </React.Suspense>
          )}
        </>
      )}
    </div>
  );
}

export default AppScaffold;

