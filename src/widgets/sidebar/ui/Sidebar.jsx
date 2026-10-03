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
  Trophy,
  Plus,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { ENABLE_GAMIFICATION } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';
import { BrandLogo, BrandIsotype } from '@shared/ui/brand';

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
        className={cn(
          "absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2",
          "bg-slate-900/90 backdrop-blur-lg border border-white/10",
          "shadow-float rounded-md px-3 py-1.5 text-white text-[0.82rem]",
          "font-bold font-heading whitespace-nowrap pointer-events-none z-modal tracking-wider"
        )}
      >
        {label}
        {/* Arrow pointing left */}
        <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-slate-900/90" />
      </Motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────
// Rail / Expanded Nav Button
// Supports collapsed icon-rail & expanded labeled mode
// ─────────────────────────────────────────────
const RailButton = ({ item, active, collapsed, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Motion.button
      type="button"
      onClick={() => onClick(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.94 }}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={item.label}
      data-testid={`sidebar-nav-${item.id}`}
      className={cn(
        "flex items-center h-12 rounded-xl border-none relative transition-colors duration-200 cursor-pointer p-0",
        collapsed ? "w-12 justify-center" : "w-full",
        active
          ? "bg-atomicTangerine/10 text-atomicTangerine shadow-[inset_3px_0_0_theme(colors.atomicTangerine)]"
          : "text-text-secondary hover:bg-black/5 hover:text-charcoalBlue bg-transparent"
      )}
    >
      <div className="w-12 h-12 shrink-0 flex items-center justify-center">
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 1.8}
          stroke="currentColor"
          fill="none"
          className={cn(
            "shrink-0 transition-all duration-200",
            active ? "drop-shadow-[0_0_6px_rgba(255,107,53,0.3)]" : ""
          )}
        />
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
          collapsed ? "w-0 opacity-0 pointer-events-none" : "flex-1 opacity-100 pr-3"
        )}
      >
        <span
          className={cn(
            "font-heading text-sm block truncate transition-colors",
            active ? "font-bold text-atomicTangerine" : "font-medium text-text-secondary"
          )}
        >
          {item.label}
        </span>
      </div>

      {/* Glassmorphic tooltip (only in collapsed rail mode) */}
      {collapsed && <GlassTooltip label={item.label} visible={hovered} />}
    </Motion.button>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const { t } = useTranslation('nav');
  const {
    openBuscador: openTripSearch,
    isReadOnlyMode,
    sidebarCollapsed,
    toggleSidebarCollapse,
  } = useUI();

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
  // DESKTOP: Collapsible Fluid Rail
  // ─────────────────────────────────────────────
  const FluidRail = (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-[100dvh] bg-white/80 backdrop-blur-xl flex flex-col",
        "py-5 border-r border-border z-dropdown hidden md:flex",
        "transition-[width] duration-300 ease-in-out overflow-x-hidden px-4",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
      aria-label={t('navLabel')}
    >
      {/* Sidebar Header: Brand Anchor — Rigid 64px Box (Zero CLS) */}
      <div className="h-16 shrink-0 w-full mb-2 flex items-center relative overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarCollapsed ? (
            <Motion.div
              key="collapsed-brand"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-12 h-12 flex items-center justify-center shrink-0 absolute left-0"
            >
              <Motion.button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-12 h-12 flex items-center justify-center p-0 bg-transparent border-none cursor-pointer rounded-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Keeptrip Home"
                title="Keeptrip"
              >
                <BrandIsotype className="w-8 h-8 text-atomicTangerine mx-auto" />
              </Motion.button>
            </Motion.div>
          ) : (
            <Motion.div
              key="expanded-brand"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full h-12 flex items-center shrink-0 absolute left-0"
            >
              <Motion.button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="h-12 flex items-center p-0 bg-transparent border-none cursor-pointer"
                whileHover={{ opacity: 0.85 }}
                whileTap={{ scale: 0.96 }}
                aria-label="Keeptrip Home"
                title="Keeptrip"
              >
                <BrandLogo className="h-8 w-auto text-slate-900 dark:text-white" />
              </Motion.button>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav
        className="flex flex-col gap-3 flex-1 w-full"
        role="navigation"
      >
        {menuItems.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={isActive(item.id)}
            collapsed={sidebarCollapsed}
            onClick={handleSelect}
          />
        ))}
      </nav>

      {/* Footer Rail: Stationary Ergonomic Toggle + Logout */}
      <div className="flex flex-col gap-2 pb-6 w-full shrink-0">
        <Motion.button
          type="button"
          onClick={toggleSidebarCollapse}
          data-testid="sidebar-collapse-toggle"
          aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          title={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          className={cn(
            "flex items-center h-12 rounded-xl border-none bg-transparent text-text-secondary cursor-pointer hover:bg-black/5 hover:text-charcoalBlue transition-colors duration-200 p-0 relative",
            sidebarCollapsed ? "w-12 justify-center" : "w-full"
          )}
          whileTap={{ scale: 0.94 }}
        >
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            {sidebarCollapsed ? (
              <PanelLeft size={20} className="shrink-0" />
            ) : (
              <PanelLeftClose size={20} className="shrink-0" />
            )}
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
              sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "flex-1 opacity-100 pr-3"
            )}
          >
            <span className="font-heading text-sm font-medium block truncate">
              {t('collapseSidebar')}
            </span>
          </div>
        </Motion.button>

        <Motion.button
          type="button"
          onClick={logout}
          className={cn(
            "flex items-center h-12 rounded-xl border-none bg-transparent text-text-secondary opacity-75 cursor-pointer hover:bg-black/5 hover:text-charcoalBlue hover:opacity-100 transition-colors duration-200 p-0 relative",
            sidebarCollapsed ? "w-12 justify-center" : "w-full"
          )}
          whileTap={{ scale: 0.94 }}
          title={t('exit')}
          aria-label={t('exit')}
          data-testid="sidebar-logout-button"
        >
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
              sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "flex-1 opacity-100 pr-3"
            )}
          >
            <span className="font-heading text-sm font-medium block truncate">
              {t('exit')}
            </span>
          </div>
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
      className={cn(
        "fixed bottom-[max(8px,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2",
        "w-[min(92vw,400px)] h-16 bg-white/92 backdrop-blur-xl border border-white/55",
        "rounded-full shadow-lg z-dropdown px-3 flex md:hidden items-center justify-evenly"
      )}
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
            className={cn(
              "flex flex-col items-center justify-center bg-transparent border-none w-[52px] h-[52px] flex-none cursor-pointer transition-colors duration-200 gap-px p-0",
              active ? "text-atomicTangerine" : "text-slate-700"
            )}
            whileTap={{ scale: 0.85 }}
            aria-current={active ? 'page' : undefined}
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
            <span className={cn(
              "text-[10px] leading-none mt-0.5 tracking-[0.1px] whitespace-nowrap transition-all duration-200 font-heading",
              active ? "text-charcoalBlue font-bold" : "text-text-secondary font-medium"
            )}>
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
        className={cn(
          "bg-gradient-to-br from-atomicTangerine to-orange-400 border-none rounded-full",
          "w-11 h-11 flex items-center justify-center text-white shrink-0",
          "shadow-[0_4px_20px_rgba(255,107,53,0.7)]",
          isReadOnlyMode ? "opacity-55 cursor-not-allowed" : "cursor-pointer"
        )}
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
