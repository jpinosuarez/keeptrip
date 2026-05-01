/**
 * Header — 2026 Ambient Context Bar
 *
 * Performance Guardrail #3 (useScroll):
 *   - We use Framer Motion's `useScroll` + `useTransform` to animate
 *     background opacity and backdrop-filter OUTSIDE React's render cycle.
 *   - No `useState` attached to `window.addEventListener('scroll')`.
 *   - The animations run directly on the DOM via Framer's Motion Values.
 */
import React, { useState, lazy, Suspense, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, User, X, Bell, Disc } from 'lucide-react';
import {
  motion as Motion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { useSearch, useUI } from '@app/providers/UIContext';
import { COLORS, RADIUS, Z_INDEX, ENABLE_INVITATIONS } from '@shared/config';
import { useTranslation } from 'react-i18next';

// Lazy loading AuthModal prevents pulling `BottomSheet` (framer-motion) and `LegalDocumentViewer` into the critical parsing path.
const authModalPromise = import('@features/auth/ui/AuthModal');
const AuthModal = lazy(() => authModalPromise);

const PAGE_TITLES = {
  '/dashboard':   'pageTitle.home',
  '/trips':       'pageTitle.journal',
  '/map':         'pageTitle.worldMap',
  '/explorer':    'pageTitle.hub',
  '/invitations': 'pageTitle.invitations',
  '/settings':    'pageTitle.settings',
};

// Mobile routes where full wordmark is hidden (space-constrained) — Disc logomark still shown
const COMPACT_LOGO_ROUTES = ['/trips', '/map'];

const Header = ({ isMobile = false, invitationsCount = 0 }) => {
  const { usuario: user, login } = useAuth();
  const { openBuscador: openTripSearch, openUserMenu, isReadOnlyMode } = useUI();
  const { busqueda: query, setBusqueda: setQuery, limpiarBusqueda: clearQuery } = useSearch();
  const { t } = useTranslation(['nav', 'common']);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ─────────────────────────────────────────────
  // Ambient Scroll Effect (Performance Guardrail #3)
  // useScroll tracks scroll outside React render cycle.
  // ─────────────────────────────────────────────
  const { scrollY } = useScroll();

  const bgOpacity = useTransform(scrollY, [0, 72], [0, 1]);
  const backdropStrength = useTransform(scrollY, [0, 72], [0, 20]);
  const springBgOpacity = useSpring(bgOpacity, { damping: 30, stiffness: 200 });

  // Pre-compute derived animated values (Rules of Hooks: cannot call inside style prop)
  const animBgColor = useTransform(springBgOpacity, (v) => `rgba(248, 250, 252, ${v})`);
  const animBackdrop = useTransform(backdropStrength, (v) => `blur(${v}px) saturate(160%)`);
  const animBorder = useTransform(springBgOpacity, (v) => `1px solid rgba(0,0,0,${v * 0.06})`);

  // Page title
  const pageTitleKey = PAGE_TITLES[pathname] ?? (pathname.startsWith('/trips/') ? 'pageTitle.journal' : null);
  const headerTitle = pageTitleKey ? t(`nav:${pageTitleKey}`) : 'Keeptrip';
  const showSearch = pathname === '/trips' || pathname.startsWith('/trips/');
  const searchPlaceholder = t('nav:searchJournal');

  const initials = useMemo(
    () => user?.displayName?.trim()?.[0]?.toUpperCase() || '',
    [user?.displayName]
  );
  const photoUrl = user?.photoURL || null;
  const canShowPhoto = Boolean(photoUrl && failedPhoto !== photoUrl);

  // Brand visibility for mobile (Refinement #3)
  const isCompactLogoRoute = COMPACT_LOGO_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  return (
    <Motion.header
      role="banner"
      className="app-shell-focus"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: Z_INDEX.dropdown,
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile
          ? 'var(--safe-area-top-padding) 16px 8px 16px'
          : 'var(--safe-area-top-padding) 24px 8px 24px',
        gap: isMobile ? '8px' : '16px',
        // Ambient Glass BG — Framer Motion MotionValues, animates outside React render cycle
        backgroundColor: animBgColor,
        backdropFilter: animBackdrop,
        WebkitBackdropFilter: animBackdrop,
        borderBottom: animBorder,
      }}
    >
      {/* Left: Brand (mobile) + Page Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {/* Mobile Brand Anchor (Refinement #3) */}
        {isMobile && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginRight: '4px' }}
          >
            <Disc size={22} color={COLORS.atomicTangerine} />
            {!isCompactLogoRoute && (
              <span style={{ fontWeight: '900', fontSize: '1rem', color: COLORS.charcoalBlue, letterSpacing: '-0.5px' }}>
                Keeptrip
              </span>
            )}
          </div>
        )}
        {/* Title */}
        <Motion.h2
          key={pathname}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            color: COLORS.charcoalBlue,
            fontWeight: '800',
            margin: 0,
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {headerTitle}
        </Motion.h2>
      </div>

      {/* Right: Contextual Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', minWidth: 0 }}>
        {/* Desktop Search (only on /trips) */}
        {!isMobile && showSearch && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.04)',
              padding: '8px 14px',
              borderRadius: RADIUS.md,
              border: '1px solid rgba(0,0,0,0.06)',
              minWidth: '240px',
            }}
          >
            <Search size={15} color={COLORS.textSecondary} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={t('nav:searchJournal')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                color: COLORS.charcoalBlue,
                width: '100%',
                outline: 'none',
              }}
            />
            {query && (
              <button type="button" onClick={clearQuery} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.textSecondary, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Mobile Search toggle (only on /trips) */}
        {isMobile && showSearch && (
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(o => !o)}
            aria-label={isMobileSearchOpen ? t('nav:closeSearch') : t('nav:openSearch')}
            aria-expanded={isMobileSearchOpen}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.08)',
              color: COLORS.textSecondary,
              width: '44px',
              height: '44px',
              borderRadius: RADIUS.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        )}

        {/* Desktop Add Trip CTA */}
        {!isMobile && (
          <Motion.button
            type="button"
            onClick={openTripSearch}
            disabled={isReadOnlyMode}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: RADIUS.full,
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 6px 20px ${COLORS.atomicTangerine}45`,
              fontSize: '0.88rem',
              minHeight: '40px',
              whiteSpace: 'nowrap',
              transition: 'box-shadow 0.2s ease',
              opacity: isReadOnlyMode ? 0.55 : 1,
              cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={16} />
            {t('nav:addTrip')}
          </Motion.button>
        )}

        {/* User Area */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Invitations Bell */}
            {ENABLE_INVITATIONS && (
              <button
                type="button"
                data-testid="header-invitations-button"
                onClick={() => navigate('/invitations')}
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
                  borderRadius: RADIUS.md,
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={18} />
                {invitationsCount > 0 && (
                  <span
                    data-testid="header-invitations-count"
                    aria-live="polite"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: COLORS.danger,
                      color: '#fff',
                      borderRadius: '9999px',
                      width: '16px',
                      height: '16px',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {invitationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Avatar (Mobile Only) */}
            <div className="md:hidden">
              <button
                type="button"
                data-testid="header-avatar"
                onClick={() => openUserMenu()}
                title={t('nav:settings')}
                aria-label={t('nav:settings')}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: RADIUS.full,
                  backgroundColor: COLORS.mutedTeal,
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {canShowPhoto ? (
                  <img
                    src={photoUrl}
                    alt={t('nav:avatarAlt', { name: user.displayName || '' })}
                    style={{ width: '100%', height: '100%', borderRadius: RADIUS.full, objectFit: 'cover' }}
                    onError={() => setFailedPhoto(photoUrl)}
                  />
                ) : initials ? (
                  <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{initials}</span>
                ) : (
                  <User size={18} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            data-testid="header-login-button"
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              backgroundColor: COLORS.mutedTeal,
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: RADIUS.md,
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {t('common:login')}
          </button>
        )}
      </div>

      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onContinue={login}
          />
        </Suspense>
      )}

      {/* Mobile Search Dropdown */}
      {isMobile && showSearch && isMobileSearchOpen && (
        <Motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            position: 'absolute',
            top: 'calc(64px + var(--safe-area-inset-top, 0px))',
            left: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: RADIUS.lg,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
          }}
        >
          <Search size={16} color={COLORS.textSecondary} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label={t('nav:searchJournal')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              color: COLORS.charcoalBlue,
              width: '100%',
              outline: 'none',
            }}
          />
          {query && (
            <button type="button" onClick={clearQuery} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.textSecondary, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </Motion.div>
      )}
    </Motion.header>
  );
};

export default Header;
