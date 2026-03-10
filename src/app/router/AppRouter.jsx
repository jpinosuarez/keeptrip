/**
 * AppRouter — Árbol de rutas declarativo de Keeptrip.
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  FASE 1 (ACTUAL): Infraestructura base                 ║
 * ║  /           → Landing (pública)                       ║
 * ║  /*          → AppShell (autenticado, nav state-based) ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  FASE 2 (PRÓXIMA): Rutas declarativas por página       ║
 * ║  /dashboard  → DashboardPage                           ║
 * ║  /trips      → TripGrid                                ║
 * ║  /trips/:id  → TripGrid + VisorViaje (nested Outlet)   ║
 * ║  /map        → MapaView                                ║
 * ║  /explorer   → TravelerHub                             ║
 * ║  /invitations → InvitationsList                        ║
 * ║  /settings   → SettingsPage                            ║
 * ║  /admin/curacion → CuracionPage (AdminGuard)           ║
 * ╚══════════════════════════════════════════════════════════╝
 */
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AuthGuard from './AuthGuard';
import AppShell from '../layout/AppShell';
import { useAuth } from '@app/providers';

const LandingPage = lazy(() => import('@pages/landing'));

/**
 * Redirige según estado de autenticación:
 * - Autenticado  → /dashboard
 * - No autenticado → LandingPage
 */
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

function AppRouter() {
  return (
    <Routes>
      {/* ── Raíz pública / autenticada ── */}
      <Route path="/" element={<RootRoute />} />

      {/* ── Shell autenticado (Fase 1: maneja toda la nav interna) ── */}
      <Route element={<AuthGuard />}>
        <Route path="/*" element={<AppShell />} />
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
