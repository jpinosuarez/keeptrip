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

import AuthGuard from './AuthGuard';
import AdminGuard from './AdminGuard';
import AppShell from '../layout/AppShell';
import { useAuth } from '@app/providers';

// ── Public ─────────────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@pages/landing'));

// ── Protected pages (lazy) ─────────────────────────────────────────────────────
const DashboardPage  = lazy(() => import('@pages/dashboard/ui/DashboardPage'));
const TripGrid       = lazy(() => import('@widgets/tripGrid'));
const MapaView       = lazy(() => import('@features/mapa/ui/MapaView'));
const TravelerHub    = lazy(() => import('@features/gamification/ui/TravelerHub'));
const InvitationsList = lazy(() => import('@features/invitations/ui/InvitationsList'));
const SettingsPage   = lazy(() => import('@pages/Configuracion/SettingsPage'));
const CuracionPage   = lazy(() => import('@pages/Curacion/CuracionPage'));

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
      />
    </Suspense>
  );
}

function TripsRoute() {
  const { data, crud } = useOutletContext();
  return (
    <Suspense fallback={null}>
      <TripGrid
        trips={data.bitacora}
        tripData={data.bitacoraData}
        handleDelete={crud.solicitarEliminarViaje}
        isDeletingTrip={crud.isDeletingViaje}
      />
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

// ── Router principal ───────────────────────────────────────────────────────────
function AppRouter() {
  return (
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
            <Route path=":id" element={<TripsRoute />} />
          </Route>

          <Route path="map"        element={<MapRoute />} />
          <Route path="explorer"   element={<ExplorerRoute />} />
          <Route path="invitations" element={<InvitationsRoute />} />
          <Route path="settings"   element={<SettingsPage />} />

          {/* Rutas de administrador */}
          <Route element={<AdminGuard />}>
            <Route path="admin/curacion" element={<CuracionPage />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
