import React, { useRef, useEffect } from 'react';
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
import { COLORS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { styles } from './Sidebar.styles';

const Sidebar = ({ isMobile = false }) => {
  const { logout, isAdmin } = useAuth();
  const { t } = useTranslation('nav');
  const {
    vistaActiva: activeView,
    setVistaActiva: setActiveView,
    sidebarCollapsed: collapsed,
    toggleSidebarCollapse: toggleCollapse,
    mobileDrawerOpen: isDrawerOpen,
    setMobileDrawerOpen: setDrawerOpen
  } = useUI();

  const drawerRef = useRef(null);

  // Focus trap + Escape key for mobile drawer
  useEffect(() => {
    if (!isDrawerOpen || !isMobile) return;

    const el = drawerRef.current;
    if (el) {
      const focusable = el.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, isMobile, setDrawerOpen]);

  const menuItems = [
    { id: 'home', icon: LayoutGrid, label: t('home') },
    { id: 'mapa', icon: Map, label: t('map') },
    { id: 'bitacora', icon: BookOpen, label: t('journal') },
    { id: 'hub', icon: Trophy, label: t('hub') },
    { id: 'curacion', icon: Image, label: t('curation') },
    { id: 'config', icon: Settings, label: t('adjust') }
  ].filter((item) => item.id !== 'curacion' || isAdmin);

  const handleSelect = (id) => {
    setActiveView(id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleLogout = () => {
    if (isMobile) setDrawerOpen(false);
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
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            style={styles.mobileCloseBtn}
            aria-label={t('closeMenu')}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <button type="button" onClick={toggleCollapse} style={styles.toggleBtn}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div style={{ ...styles.logoContainer, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Disc size={32} color={COLORS.atomicTangerine} />
            <AnimatePresence>
              {!collapsed && (
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

      <nav role="navigation" aria-label={t('navLabel')} style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <Motion.button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              whileHover={{ backgroundColor: isActive ? COLORS.charcoalBlue : '#f1f5f9' }}
              whileTap={{ scale: 0.98 }}
              aria-current={isActive ? 'page' : undefined}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? COLORS.charcoalBlue : 'transparent',
                color: isActive ? 'white' : '#64748b',
                justifyContent: isMobile || !collapsed ? 'flex-start' : 'center',
                padding: isMobile || !collapsed ? '12px 16px' : '12px'
              }}
              title={!isMobile && collapsed ? item.label : ''}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <AnimatePresence>
                {(isMobile || !collapsed) && (
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
          type="button"
          onClick={handleLogout}
          style={{
            ...styles.logoutBtn,
            justifyContent: isMobile || !collapsed ? 'flex-start' : 'center'
          }}
        >
          <LogOut size={20} />
          <AnimatePresence>
            {(isMobile || !collapsed) && (
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
        {isDrawerOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={styles.mobileOverlay}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <Motion.aside
              ref={drawerRef}
              id="mobile-sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t('navLabel')}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
      animate={{ width: collapsed ? '80px' : '260px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={styles.sidebar}
    >
      {sidebarContent}
    </Motion.aside>
  );
};

export default Sidebar;
