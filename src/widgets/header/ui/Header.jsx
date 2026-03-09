import React, { useMemo, useState } from 'react';
import { Search, Plus, LogOut, User, X, Menu, Bell } from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useSearch, useUI } from '@app/providers/UIContext';
import { styles } from './Header.styles';
import { COLORS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';

const Header = ({ isMobile = false, invitationsCount = 0 }) => {
  const { usuario: user, login, logout } = useAuth();
  const {
    tituloHeader: headerTitle,
    mostrarBusqueda: showSearch,
    searchPlaceholder,
    openBuscador: openTripSearch,
    setVistaActiva: setActiveView,
    openMobileDrawer,
    mobileDrawerOpen: isDrawerOpen
  } = useUI();
  const { busqueda: query, setBusqueda: setQuery, limpiarBusqueda: clearQuery } = useSearch();
  const { t } = useTranslation(['nav', 'common']);
  const [failedPhoto, setFailedPhoto] = useState(null);

  const initials = useMemo(
    () => user?.displayName?.trim()?.[0]?.toUpperCase() || '',
    [user?.displayName]
  );
  const photoUrl = user?.photoURL || null;
  const canShowPhoto = Boolean(photoUrl && failedPhoto !== photoUrl);

  return (
    <header role="banner" style={styles.header(isMobile)}>
      <div style={styles.leftSide}>
        {isMobile && (
          <button
            type="button"
            style={styles.menuButton}
            onClick={openMobileDrawer}
            aria-label={t('nav:openMenu')}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-sidebar-drawer"
          >
            <Menu size={18} />
          </button>
        )}
        {!isMobile && <span style={styles.breadcrumb}>Keeptrip</span>}
        {!isMobile && <span style={styles.separator}>/</span>}
        <h2 style={styles.titulo(isMobile)}>{headerTitle}</h2>
      </div>

      <div style={styles.rightSide(isMobile)}>
        {showSearch && (
          <div style={styles.searchContainer(isMobile)}>
            <Search size={16} color={COLORS.textSecondary} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={t('nav:searchJournal')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                style={styles.clearButton}
                aria-label={t('nav:clearSearch')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <button type="button" style={styles.addButton(isMobile)} onClick={openTripSearch}>
          <Plus size={18} />
          {!isMobile && <span style={styles.addButtonLabel}>{t('nav:addTrip')}</span>}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              data-testid="header-invitations-button"
              onClick={() => setActiveView('invitations')}
              aria-label={t('nav:invitations', { count: invitationsCount })}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.textSecondary,
                display: 'flex',
                alignItems: 'center',
                minWidth: '44px',
                minHeight: '44px',
                justifyContent: 'center'
              }}
            >
              <Bell size={18} />
              {invitationsCount > 0 && (
                <span
                  data-testid="header-invitations-count"
                  aria-live="polite"
                  style={{
                    background: COLORS.danger,
                    color: COLORS.surface,
                    borderRadius: RADIUS.sm,
                    padding: '2px 6px',
                    fontSize: 11,
                    marginLeft: 6
                  }}
                >
                  {invitationsCount}
                </span>
              )}
            </button>

            <div
              data-testid="header-avatar"
              style={{ ...styles.avatar, cursor: 'pointer' }}
              onClick={() => setActiveView('config')}
              title={t('nav:settings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveView('config')}
            >
              {canShowPhoto ? (
                <img
                  src={photoUrl}
                  alt={t('nav:avatarAlt', { name: user.displayName || '' })}
                  style={{ width: '100%', height: '100%', borderRadius: RADIUS.full, objectFit: 'cover' }}
                  onError={() => setFailedPhoto(photoUrl)}
                />
              ) : initials ? (
                <span style={styles.avatarInitials}>{initials}</span>
              ) : (
                <User size={20} />
              )}
            </div>

            {!isMobile && (
              <button
                type="button"
                data-testid="header-logout-button"
                onClick={logout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSecondary, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={t('common:logout')}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            data-testid="header-login-button"
            onClick={login}
            style={{ ...styles.addButton(isMobile), backgroundColor: '#4285F4' }}
          >
            {t('common:login')}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
