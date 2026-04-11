/**
 * AppRouter — Árbol de rutas declarativo de Keeptrip.
 *
 * URL Map:
 *   /                → LandingPage  (pública; autenticado → /dashboard)
 *   /dashboard       → DashboardPage
 *   /trips           → TripGrid
 *   /trips/:id       → TripGrid (VisorViaje via UIContext modal — Fase 4)
 *   /map             → MapaView
 *   /explorer        → TravelerHub
 *   /invitations     → InvitationsList
 *   /settings        → SettingsPage
 *   /admin/curacion  → CuracionPage  (AdminGuard)
 *
 * Patrón de datos:
 *   AppShell pasa un OutletContext (activeViewController) con todos los datos
 *   de la sesión. Los adaptadores de ruta (*Route) extraen lo que necesita
 *   cada página sin crear suscripciones adicionales a Firestore.
 */
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import PageLoader from '@shared/ui/components/PageLoader';
import { ENABLE_IMMERSIVE_VIEWER, ENABLE_INVITATIONS, ENABLE_GAMIFICATION } from '@shared/config';

import AuthGuard from './AuthGuard';
import AdminGuard from './AdminGuard';
import AppShell from '../layout/AppShell';
import { useAuth } from '@app/providers';

// ── Public ─────────────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@pages/landing'));

// ── Protected pages (lazy) ─────────────────────────────────────────────────────
const DashboardPage  = lazy(() => import('@pages/dashboard/ui/DashboardPage'));
const TripsPage      = lazy(() => import('@pages/trips/ui/TripsPage'));
const MapaView       = lazy(() => import('@features/mapa/ui').then((mod) => ({ default: mod.MapaView })));
const TravelerHub    = lazy(() => import('@features/gamification/ui').then((mod) => ({ default: mod.TravelerHub })));
const InvitationsList = lazy(() => import('@features/invitations/ui').then((mod) => ({ default: mod.InvitationsList })));
const SettingsPage   = lazy(() => import('@pages/settings/ui/SettingsPage'));

// ── Raíz pública/autenticada ───────────────────────────────────────────────────
function RootRoute() {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  if (usuario) return <Navigate to="/dashboard" replace />;
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

// ── Adaptadores de ruta ────────────────────────────────────────────────────────
// Mapean el OutletContext (activeViewController) a las props de cada página.
// Esto evita suscripciones Firestore duplicadas y preserva las APIs de los
// componentes de página sin modificarlos.

function DashboardRoute() {
  const { data, view } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <DashboardPage
        countriesVisited={data.paisesVisitados}
        log={data.bitacora}
        logData={data.bitacoraData}
        isMobile={view.isMobile}
        loading={data.loadingViajes}
        isError={data.isError}
        fetchError={data.fetchError}
      />
    </Suspense>
  );
}

function TripsRoute() {
  return (
    <Suspense fallback={null}>
      <TripsPage />
    </Suspense>
  );
}

function MapRoute() {
  const { data } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <MapaView
        paises={data.paisesVisitados}
        paradas={data.todasLasParadas}
        trips={data.bitacora}
        tripData={data.bitacoraData}
      />
    </Suspense>
  );
}

function ExplorerRoute() {
  const { data, gamification } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <TravelerHub
        paisesVisitados={data.paisesVisitados}
        bitacora={data.bitacora}
        achievementsWithProgress={gamification.achievementsWithProgress}
        stats={gamification.achievementStats}
      />
    </Suspense>
  );
}

function InvitationsRoute() {
  const { invitations } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <InvitationsList hook={invitations} />
    </Suspense>
  );
}

function SettingsRoute() {
  const { data } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <SettingsPage log={data.bitacora} />
    </Suspense>
  );
}

// ── Router principal ───────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Raíz: Landing o redirect a /dashboard */}
        <Route path="/" element={<RootRoute />} />

        {/* Rutas protegidas: requieren autenticación */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>

            <Route path="dashboard" element={<DashboardRoute />} />

            {/* TripGrid con soporte futuro de nested route para VisorViaje (Fase 4) */}
            <Route path="trips">
              <Route index element={<TripsRoute />} />
              <Route
                path=":id"
                element={ENABLE_IMMERSIVE_VIEWER ? <TripsRoute /> : <Navigate to="/dashboard" replace />}
              />
            </Route>

            <Route path="map"        element={<MapRoute />} />
            <Route path="mapa"       element={<MapRoute />} />
            <Route
              path="explorer"
              element={ENABLE_GAMIFICATION ? <ExplorerRoute /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="invitations"
              element={ENABLE_INVITATIONS ? <InvitationsRoute /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="settings"   element={<SettingsRoute />} />

            {/* Rutas de administrador (Deprecated/Removed) */}

          </Route>
        </Route>

        {/* Fallback global */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
