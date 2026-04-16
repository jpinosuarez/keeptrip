/**
 * Sidebar — 2026 Spatial Navigation System (Refined)
 *
 * Refinements applied:
 *  1. Glassmorphic animated tooltips on Fluid Rail hover (Framer Motion)
 *  2. Active state: fill="currentColor" icon + soft glass pill — no orange dot
 *  3. Disc logomark at top of Rail (desktop); brand always visible
 *  4. CSS-first responsive strategy preserved — zero JS breakpoint detection
 */
import React, { useState } from 'react';
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
import { COLORS, SHADOWS, RADIUS, ENABLE_GAMIFICATION } from '@shared/config';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

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
  ...(ENABLE_GAMIFICATION ? [{ id: 'hub', icon: Trophy, label: t('hub') }] : []),
  { id: 'config',   icon: Settings,   label: t('adjust') },
];

// Removed useInjectNavStyles to prevent layout shift. CSS is loaded natively.

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
        background: active
          ? 'rgba(255, 107, 53, 0.08)'
          : hovered
          ? 'rgba(0, 0, 0, 0.04)'
          : 'transparent',
        color: active ? COLORS.atomicTangerine : COLORS.textSecondary,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        boxShadow: active ? `inset 3px 0 0 ${COLORS.atomicTangerine}` : 'none',
      }}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 1.8}
        stroke="currentColor"
        fill="none"
        style={{
          filter: active ? `drop-shadow(0 0 6px ${COLORS.atomicTangerine}30)` : 'none',
          transition: 'filter 0.2s',
        }}
      />

      {/* Glassmorphic tooltip */}
      <GlassTooltip label={item.label} visible={hovered} />
    </Motion.button>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const { t } = useTranslation('nav');
  const { openBuscador: openTripSearch, isReadOnlyMode } = useUI();

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
      {/* All navigation tabs in sequence */}
      {PRIMARY_TABS.map((item) => {
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
            style={{ position: 'relative' }}
          >
            <Motion.div
              animate={{ y: active ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.8}
                fill="none"
              />
            </Motion.div>
            <span className="mobile-tab-label" style={{
              color: active ? COLORS.charcoalBlue : COLORS.textSecondary,
              fontWeight: active ? 700 : 500,
            }}>
              {item.label}
            </span>
          </Motion.button>
        );
      })}

      {/* + FAB — far right */}
      <Motion.button
        type="button"
        onClick={openTripSearch}
        disabled={isReadOnlyMode}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.88 }}
        style={{
          background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: `0 4px 20px ${COLORS.atomicTangerine}70`,
          flexShrink: 0,
          opacity: isReadOnlyMode ? 0.55 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
        }}
        aria-label={t('addTrip')}
      >
        <Plus size={20} strokeWidth={2.5} />
      </Motion.button>
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
