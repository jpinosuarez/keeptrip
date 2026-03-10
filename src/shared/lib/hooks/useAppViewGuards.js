import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Efectos de guard reactivos a la ruta actual.
 * - Limpia la búsqueda al salir de /trips
 * - Cierra el drawer móvil en cada cambio de ruta
 * - Cierra el drawer al hacer resize a desktop
 *
 * El guard de admin está delegado al componente AdminGuard en el router.
 */
export function useAppViewGuards({
  busqueda,
  setBusqueda,
  isMobile,
  mobileDrawerOpen,
  setMobileDrawerOpen,
}) {
  const { pathname } = useLocation();

  // Limpiar búsqueda al salir de la vista de trips
  useEffect(() => {
    if (!pathname.startsWith('/trips') && busqueda) {
      setBusqueda('');
    }
  }, [pathname, busqueda, setBusqueda]);

  // Cerrar drawer móvil en cada cambio de ruta
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      if (isMobile && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
      prevPathnameRef.current = pathname;
    }
  }, [pathname, isMobile, mobileDrawerOpen, setMobileDrawerOpen]);

  // Cerrar drawer al hacer resize a desktop
  useEffect(() => {
    if (!isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, mobileDrawerOpen, setMobileDrawerOpen]);
}
