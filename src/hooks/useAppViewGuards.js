import { useEffect, useRef } from 'react';

export function useAppViewGuards({
  vistaActiva,
  busqueda,
  setBusqueda,
  isMobile,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  isAdmin,
  setVistaActiva,
}) {
  useEffect(() => {
    if (vistaActiva !== 'bitacora' && busqueda) {
      setBusqueda('');
    }
  }, [vistaActiva, busqueda, setBusqueda]);

  const prevVistaRef = useRef(vistaActiva);
  useEffect(() => {
    if (prevVistaRef.current !== vistaActiva) {
      if (isMobile && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
      prevVistaRef.current = vistaActiva;
    }
  }, [vistaActiva, isMobile, mobileDrawerOpen, setMobileDrawerOpen]);

  useEffect(() => {
    if (!isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, mobileDrawerOpen, setMobileDrawerOpen]);

  useEffect(() => {
    if (vistaActiva === 'curacion' && !isAdmin) {
      setVistaActiva('home');
    }
  }, [vistaActiva, isAdmin, setVistaActiva]);
}
