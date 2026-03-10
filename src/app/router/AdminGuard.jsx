import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@app/providers';

/**
 * Protege rutas exclusivas de administrador.
 * Si el usuario no tiene rol admin, redirige al dashboard.
 * Debe usarse anidado dentro de AuthGuard.
 */
function AdminGuard() {
  const { isAdmin, cargando } = useAuth();

  if (cargando) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default AdminGuard;
