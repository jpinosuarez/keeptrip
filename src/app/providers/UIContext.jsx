/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);
const SearchContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  const [viajeEnEdicionId, setViajeEnEdicionId] = useState(null);
  const [viajeExpandidoId, setViajeExpandidoId] = useState(null);
  const [viajeBorrador, setViajeBorrador] = useState(null);
  const [ciudadInicialBorrador, setCiudadInicialBorrador] = useState(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);

  const tituloHeader = null; // eslint-disable-line no-unused-vars

  const value = useMemo(
    () => ({
      searchPlaceholder: 'Buscar viajes, paises o ciudades...',
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapse: () => setSidebarCollapsed((prev) => !prev),
      mobileDrawerOpen,
      setMobileDrawerOpen,
      openMobileDrawer: () => setMobileDrawerOpen(true),
      closeMobileDrawer: () => setMobileDrawerOpen(false),
      mostrarBuscador,
      openBuscador: () => setMostrarBuscador(true),
      closeBuscador: () => setMostrarBuscador(false),
      viajeEnEdicionId,
      setViajeEnEdicionId,
      abrirEditor: (viajeId) => setViajeEnEdicionId(viajeId),
      cerrarEditor: () => setViajeEnEdicionId(null),
      viajeExpandidoId,
      setViajeExpandidoId,
      abrirVisor: (viajeId) => setViajeExpandidoId(viajeId),
      cerrarVisor: () => setViajeExpandidoId(null),
      viajeBorrador,
      setViajeBorrador,
      ciudadInicialBorrador,
      setCiudadInicialBorrador,
      confirmarEliminacion,
      setConfirmarEliminacion
    }),
    [
      sidebarCollapsed,
      mobileDrawerOpen,
      mostrarBuscador,
      viajeEnEdicionId,
      viajeExpandidoId,
      viajeBorrador,
      ciudadInicialBorrador,
      confirmarEliminacion
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || import.meta.env.VITE_ENABLE_TEST_LOGIN !== 'true') {
      return undefined;
    }

    window.__test_abrirVisor = (viajeId) => setViajeExpandidoId(viajeId);
    window.__test_abrirBuscador = () => setMostrarBuscador(true);

    return () => {
      delete window.__test_abrirVisor;
    };
  }, [setViajeExpandidoId]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const SearchProvider = ({ children }) => {
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const value = useMemo(
    () => ({
      filtro,
      setFiltro,
      busqueda,
      setBusqueda,
      limpiarBusqueda: () => setBusqueda('')
    }),
    [filtro, busqueda]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe usarse dentro de UIProvider');
  }
  return context;
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe usarse dentro de SearchProvider');
  }
  return context;
};
