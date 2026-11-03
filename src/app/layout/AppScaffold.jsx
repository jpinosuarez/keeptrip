import React, { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar';
import { Header } from '@widgets/header';
import { useUI } from '@app/providers/UIContext';
import { cn } from '@shared/lib/utils/cn';

function AppScaffold({ sidebarCollapsed: propSidebarCollapsed, invitationsCount, content, overlays }) {
  const { sidebarCollapsed: uiSidebarCollapsed } = useUI();
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
          "pb-[calc(80px+max(16px,env(safe-area-inset-bottom,0px)))] md:pb-[max(24px,env(safe-area-inset-bottom,0px))]"
        )}>
          {content}
        </section>
      </main>

      {overlays}
    </div>
  );
}

export default AppScaffold;

