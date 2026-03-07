import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Map,
  BookOpen,
  Settings,
  Image,
  LogOut,
  Disc,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS, Z_INDEX } from '@shared/config';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isMobile = false }) => {
  const { logout, isAdmin } = useAuth();
  const { t } = useTranslation('nav');
  const {
    vistaActiva,
    setVistaActiva,
    sidebarCollapsed,
    toggleSidebarCollapse,
    mobileDrawerOpen,
    setMobileDrawerOpen
  } = useUI();

  const menuItems = [
    { id: 'home', icon: LayoutGrid, label: t('home') },
    { id: 'mapa', icon: Map, label: t('map') },
    { id: 'bitacora', icon: BookOpen, label: t('journal') },
    { id: 'hub', icon: Trophy, label: t('hub') },
    { id: 'curacion', icon: Image, label: t('curation') },
    { id: 'config', icon: Settings, label: t('adjust') }
  ].filter((item) => item.id !== 'curacion' || isAdmin);

  const handleSelect = (id) => {
    setVistaActiva(id);
    if (isMobile) setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    if (isMobile) setMobileDrawerOpen(false);
    logout();
  };

  const sidebarContent = (
    <>
      {isMobile ? (
        <div style={styles.mobileTopRow}>
          <div style={styles.logoContainerMobile}>
            <Disc size={28} color={COLORS.atomicTangerine} />
            <h1 style={styles.logoText}>Keeptrip</h1>
          </div>
          <button type="button" onClick={() => setMobileDrawerOpen(false)} style={styles.mobileCloseBtn}>
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <button onClick={toggleSidebarCollapse} style={styles.toggleBtn}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div style={{ ...styles.logoContainer, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <Disc size={32} color={COLORS.atomicTangerine} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <Motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                  style={styles.logoText}
                >
                  Keeptrip
                </Motion.h1>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = vistaActiva === item.id;
          return (
            <Motion.button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              whileHover={{ backgroundColor: isActive ? COLORS.charcoalBlue : '#f1f5f9' }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? COLORS.charcoalBlue : 'transparent',
                color: isActive ? 'white' : '#64748b',
                justifyContent: isMobile || !sidebarCollapsed ? 'flex-start' : 'center',
                padding: isMobile || !sidebarCollapsed ? '12px 16px' : '12px'
              }}
              title={!isMobile && sidebarCollapsed ? item.label : ''}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

              <AnimatePresence>
                {(isMobile || !sidebarCollapsed) && (
                  <Motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    style={styles.labelSpan}
                  >
                    {item.label}
                  </Motion.span>
                )}
              </AnimatePresence>
            </Motion.button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button
          onClick={handleLogout}
          style={{ ...styles.logoutBtn, justifyContent: isMobile || !sidebarCollapsed ? 'flex-start' : 'center' }}
        >
          <LogOut size={20} />
          <AnimatePresence>
            {(isMobile || !sidebarCollapsed) && (
              <Motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}
              >
                {t('exit')}
              </Motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={styles.mobileOverlay}
              onClick={() => setMobileDrawerOpen(false)}
            />

            <Motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              style={styles.mobileSidebar}
            >
              {sidebarContent}
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed ? '80px' : '260px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={styles.sidebar}
    >
      {sidebarContent}
    </Motion.aside>
  );
};

const baseSidebar = {
  height: '100vh',
  backgroundColor: COLORS.surface,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${COLORS.border}`,
  top: 0,
  left: 0,
  boxShadow: SHADOWS.sm
};

const styles = {
  sidebar: {
    ...baseSidebar,
    position: 'fixed',
    zIndex: 60
  },
  mobileSidebar: {
    ...baseSidebar,
    position: 'fixed',
    zIndex: 120,
    width: '280px',
    maxWidth: '84vw'
  },
  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 110,
    ...GLASS.overlay
  },
  mobileTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 10px'
  },
  logoContainerMobile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  mobileCloseBtn: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    borderRadius: RADIUS.sm,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.textSecondary,
    cursor: 'pointer'
  },
  toggleBtn: {
    position: 'absolute',
    top: '32px',
    right: '-12px',
    width: '24px',
    height: '24px',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    zIndex: Z_INDEX.sticky,
    boxShadow: SHADOWS.sm,
    transition: TRANSITIONS.fast
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    height: '60px',
    marginBottom: '30px',
    padding: '0 20px',
    overflow: 'hidden'
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-0.5px',
    margin: 0,
    whiteSpace: 'nowrap'
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, padding: '0 12px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: TRANSITIONS.fast,
    width: '100%',
    overflow: 'hidden'
  },
  labelSpan: { fontWeight: '600', marginLeft: '12px', whiteSpace: 'nowrap' },
  footer: { borderTop: `1px solid ${COLORS.background}`, padding: '20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: COLORS.textSecondary,
    cursor: 'pointer',
    padding: '10px',
    fontWeight: '600',
    fontSize: '0.9rem',
    width: '100%',
    borderRadius: RADIUS.sm
  }
};

export default Sidebar;
