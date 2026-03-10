import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@app/providers';

/**
 * Protege todas las rutas de la app autenticada.
 * Si el usuario no está autenticado, redirige a la Landing Page.
 * Mientras Firebase resuelve la sesión (cargando), no renderiza nada para
 * evitar un flash de redirect incorrecto.
 */
function AuthGuard() {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default AuthGuard;
