/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastContext';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';

const UIContext = createContext(null);
const SearchContext = createContext(null);

// ── mapStyle persistence helpers (Guardrail #2) ──
const MAP_STYLE_KEY = 'keeptrip_map_style';
const MAP_STYLES = ['globe', 'flat', 'hybrid'];
const DEFAULT_MAP_STYLE = 'globe';

const readMapStyle = () => {
  try {
    const stored = localStorage.getItem(MAP_STYLE_KEY);
    return MAP_STYLES.includes(stored) ? stored : DEFAULT_MAP_STYLE;
  } catch {
    return DEFAULT_MAP_STYLE;
  }
};

export const UIProvider = ({ children }) => {
  const { t } = useTranslation('common');
  const { pushToast } = useToast();
  const {
    flags: { level: operationalLevel, appReadonlyMode, appMaintenanceMode },
  } = useOperationalFlags();

  const isReadOnlyMode = Boolean(appReadonlyMode) || Number(operationalLevel || 0) >= 3;
  const isMaintenanceMode = Boolean(appMaintenanceMode) || Number(operationalLevel || 0) >= 4;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // SearchPalette (Cmd+K) state
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

  // User menu bottom sheet
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Modal state para viaje nuevo (borrador no persistido aún)
  const [viajeBorrador, setViajeBorrador] = useState(null);
  const [ciudadInicialBorrador, setCiudadInicialBorrador] = useState(null);
  // Confirmación de eliminación (no requiere URL — es un diálogo transitorio)
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);

  // Map Style preference — initialised from localStorage, reactive (Guardrail #2)
  const [mapStyle, setMapStyleState] = useState(readMapStyle);

  const setMapStyle = useCallback((style) => {
    if (!MAP_STYLES.includes(style)) return;
    setMapStyleState(style);
    try {
      localStorage.setItem(MAP_STYLE_KEY, style);
    } catch {
      // storage unavailable — ignore silently
    }
  }, []);

  const value = useMemo(
    () => {
      // Backward compatibility: alias mostrarBuscador → searchPaletteOpen
      const mostrarBuscador = searchPaletteOpen;
      const openBuscador = () => {
        if (!isReadOnlyMode) {
          setSearchPaletteOpen(true);
          return;
        }

        pushToast(
          t(
            'operational.readOnlyBlockedAction',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          ),
          'info'
        );
      };
      const closeBuscador = () => setSearchPaletteOpen(false);

      return {
        searchPlaceholder: 'Buscar viajes, paises o ciudades...',
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarCollapse: () => setSidebarCollapsed((prev) => !prev),
        mobileDrawerOpen,
        setMobileDrawerOpen,
        openMobileDrawer: () => setMobileDrawerOpen(true),
        closeMobileDrawer: () => setMobileDrawerOpen(false),
        searchPaletteOpen,
        openSearchPalette: () => setSearchPaletteOpen(true),
        closeSearchPalette: () => setSearchPaletteOpen(false),
        userMenuOpen,
        openUserMenu: () => setUserMenuOpen(true),
        closeUserMenu: () => setUserMenuOpen(false),
        // Backward compatibility aliases
        mostrarBuscador,
        openBuscador,
        closeBuscador,
        viajeBorrador,
        setViajeBorrador,
        ciudadInicialBorrador,
        setCiudadInicialBorrador,
        confirmarEliminacion,
        setConfirmarEliminacion,
        isReadOnlyMode,
        isMaintenanceMode,
        // Map style (Guardrail #2)
        mapStyle,
        setMapStyle,
        MAP_STYLES,
      };
    },
    [
      sidebarCollapsed,
      mobileDrawerOpen,
      searchPaletteOpen,
      userMenuOpen,
      viajeBorrador,
      ciudadInicialBorrador,
      confirmarEliminacion,
      isReadOnlyMode,
      isMaintenanceMode,
      mapStyle,
      setMapStyle,
      pushToast,
      t,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || import.meta.env.VITE_ENABLE_TEST_LOGIN !== 'true') {
      return undefined;
    }
    // Backward compatibility for old buscador API
    window.__test_abrirBuscador = () => setSearchPaletteOpen(true);
    // New SearchPalette API
    window.__test_abrirSearchPalette = () => setSearchPaletteOpen(true);
    // Operational flags API
    window.__test_getOperationalLevel = () => operationalLevel;
    return undefined;
  }, [operationalLevel]);

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
