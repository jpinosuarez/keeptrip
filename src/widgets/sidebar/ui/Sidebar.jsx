/**
 * Sidebar — 2026 Spatial Navigation System (Refined)
 *
 * Refinements applied:
 *  1. Glassmorphic animated tooltips on Fluid Rail hover (Framer Motion)
 *  2. Active state: fill="currentColor" icon + soft glass pill — no orange dot
 *  3. Disc logomark at top of Rail (desktop); brand always visible
 *  4. CSS-first responsive strategy preserved — zero JS breakpoint detection
 */
import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Map,
  BookOpen,
  Settings,
  LogOut,
  Disc,
  Trophy,
  Plus
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS, SHADOWS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { mediaStyles } from './Sidebar.styles';

const URL_MAP = {
  home:     '/dashboard',
  mapa:     '/map',
  bitacora: '/trips',
  hub:      '/explorer',
  config:   '/settings',
};

const MENU_ITEMS = (t) => [
  { id: 'home',     icon: LayoutGrid, label: t('home') },
  { id: 'mapa',     icon: Map,        label: t('map')  },
  { id: 'bitacora', icon: BookOpen,   label: t('journal') },
  { id: 'hub',      icon: Trophy,     label: t('hub')  },
  { id: 'config',   icon: Settings,   label: t('adjust') },
];

function useInjectNavStyles() {
  useEffect(() => {
    const id = 'keeptrip-nav-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = mediaStyles;
    document.head.appendChild(el);
  }, []);
}

// ─────────────────────────────────────────────
// Glassmorphic Tooltip (Refinement #1)
// ─────────────────────────────────────────────
const GlassTooltip = ({ label, visible }) => (
  <AnimatePresence>
    {visible && (
      <Motion.div
        initial={{ opacity: 0, scale: 0.88, x: -6 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.88, x: -6 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        style={{
          position: 'absolute',
          left: 'calc(100% + 14px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(22, 28, 36, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: SHADOWS.float || '0 8px 32px rgba(0,0,0,0.25)',
          borderRadius: RADIUS.md,
          padding: '6px 12px',
          color: '#fff',
          fontSize: '0.82rem',
          fontWeight: '700',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 200,
          letterSpacing: '0.2px',
        }}
      >
        {label}
        {/* Arrow pointing left */}
        <span style={{
          position: 'absolute',
          left: '-5px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderRight: '5px solid rgba(22, 28, 36, 0.88)',
        }} />
      </Motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────
// Rail Button with active state (Refinement #2)
// Uses fill + strokeWidth instead of orange dot
// ─────────────────────────────────────────────
const RailButton = ({ item, active, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Motion.button
      type="button"
      onClick={() => onClick(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.88 }}
      aria-current={active ? 'page' : undefined}
      title={item.label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: RADIUS.xl,
        border: 'none',
        // Glass pill on active — soft, no color, just shape
        background: active
          ? 'rgba(0, 0, 0, 0.08)'
          : hovered
          ? 'rgba(0, 0, 0, 0.04)'
          : 'transparent',
        color: active ? COLORS.charcoalBlue : COLORS.textSecondary,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {/* Active: fill icon with currentColor (Lucide constraint) */}
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 1.8}
        fill={active ? 'currentColor' : 'none'}
        style={{
          filter: active ? `drop-shadow(0 0 6px ${COLORS.charcoalBlue}40)` : 'none',
          transition: 'filter 0.2s',
        }}
      />

      {/* Glassmorphic tooltip */}
      <GlassTooltip label={item.label} visible={hovered} />
    </Motion.button>
  );
};

const Sidebar = () => {
  useInjectNavStyles();
  const { logout } = useAuth();
  const { t } = useTranslation('nav');
  const { openBuscador: openTripSearch } = useUI();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuItems = MENU_ITEMS(t);

  const handleSelect = (id) => {
    navigate(URL_MAP[id] || '/dashboard');
  };

  const isActive = (id) => {
    const url = URL_MAP[id] || '';
    return pathname === url || (url.length > 1 && pathname.startsWith(url + '/'));
  };

  // ─────────────────────────────────────────────
  // DESKTOP: Fluid Rail
  // ─────────────────────────────────────────────
  const FluidRail = (
    <aside className="desktop-fluid-rail" aria-label={t('navLabel')}>
      {/* Disc Logomark (Refinement #3) — acts as Home shortcut */}
      <Motion.button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="rail-logo"
        whileHover={{ rotate: [0, -12, 12, 0], transition: { duration: 0.45 } }}
        whileTap={{ scale: 0.90 }}
        aria-label="Keeptrip Home"
        title="Keeptrip"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: RADIUS.xl,
          marginBottom: '8px',
        }}
      >
        <Disc size={32} color={COLORS.atomicTangerine} />
      </Motion.button>

      <nav className="rail-nav" role="navigation">
        {menuItems.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={isActive(item.id)}
            onClick={handleSelect}
          />
        ))}
      </nav>

      <div className="rail-footer">
        <Motion.button
          type="button"
          onClick={logout}
          className="rail-btn"
          whileTap={{ scale: 0.88 }}
          title={t('exit')}
          aria-label={t('exit')}
          style={{
            color: COLORS.textSecondary,
            opacity: 0.65,
          }}
        >
          <LogOut size={18} strokeWidth={1.8} />
        </Motion.button>
      </div>
    </aside>
  );

  // ─────────────────────────────────────────────
  // MOBILE: Dynamic Island Tab Bar
  // Center + FAB replaces the MobileCreateFab
  // ─────────────────────────────────────────────
  const PRIMARY_TABS = menuItems.filter(item => item.id !== 'config');

  const TabBar = (
    <nav
      className="mobile-tab-bar"
      role="navigation"
      aria-label={t('navLabel')}
    >
      {/* Left 2 tabs */}
      {PRIMARY_TABS.slice(0, 2).map((item) => {
        const active = isActive(item.id);
        const Icon = item.icon;
        return (
          <Motion.button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`mobile-tab-btn${active ? ' active' : ''}`}
            whileTap={{ scale: 0.85 }}
            aria-current={active ? 'page' : undefined}
          >
            <Motion.div
              animate={{ y: active ? -2 : 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.8}
                fill={active ? 'currentColor' : 'none'}
              />
            </Motion.div>
          </Motion.button>
        );
      })}

      {/* Center + FAB */}
      <Motion.button
        type="button"
        onClick={openTripSearch}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.88 }}
        style={{
          background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
          border: 'none',
          borderRadius: '50%',
          width: '52px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          boxShadow: `0 4px 20px ${COLORS.atomicTangerine}70`,
          flexShrink: 0,
        }}
        aria-label={t('addTrip')}
      >
        <Plus size={24} strokeWidth={2.5} />
      </Motion.button>

      {/* Right 2 tabs */}
      {PRIMARY_TABS.slice(2, 4).map((item) => {
        const active = isActive(item.id);
        const Icon = item.icon;
        return (
          <Motion.button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`mobile-tab-btn${active ? ' active' : ''}`}
            whileTap={{ scale: 0.85 }}
            aria-current={active ? 'page' : undefined}
          >
            <Motion.div
              animate={{ y: active ? -2 : 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.8}
                fill={active ? 'currentColor' : 'none'}
              />
            </Motion.div>
          </Motion.button>
        );
      })}
    </nav>
  );

  return (
    <>
      {FluidRail}
      {TabBar}
    </>
  );
};

export default Sidebar;
