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
import { Search, Plus, X, Bell } from 'lucide-react';
import {
  motion as Motion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { useSearch, useUI } from '@app/providers/UIContext';
import { ENABLE_INVITATIONS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';
import MobileTopBar from './MobileTopBar';
import MapFloatingHud from './MapFloatingHud';

// Lazy loading AuthModal prevents pulling `BottomSheet` (framer-motion) and `LegalDocumentViewer` into the critical parsing path.
const authModalPromise = import('@features/auth/ui/AuthModal');
const AuthModal = lazy(() => authModalPromise);

const PAGE_TITLES = {
  '/dashboard':   'pageTitle.home',
  '/trips':       'pageTitle.journal',
  '/map':         'pageTitle.worldMap',
  '/mapa':        'pageTitle.worldMap',
  '/explorer':    'pageTitle.hub',
  '/invitations': 'pageTitle.invitations',
  '/settings':    'pageTitle.settings',
};

const Header = ({ invitationsCount = 0 }) => {
  const { usuario: user, login } = useAuth();
  const { openBuscador: openTripSearch, openUserMenu, isReadOnlyMode } = useUI();
  const { busqueda: query, setBusqueda: setQuery, limpiarBusqueda: clearQuery } = useSearch();
  const { t } = useTranslation(['nav', 'common']);
  const [failedPhoto, setFailedPhoto] = useState(null);
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

  const isMapRoute = pathname === '/map' || pathname === '/mapa';

  return (
    <>
      {/* ── MOBILE TOP BAR / HUD ───────────────────────────── */}
      {isMapRoute ? (
        <MapFloatingHud
          user={user}
          canShowPhoto={canShowPhoto}
          photoUrl={photoUrl}
          initials={initials}
          setFailedPhoto={setFailedPhoto}
          openUserMenu={openUserMenu}
          onLoginClick={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <MobileTopBar
          pathname={pathname}
          headerTitle={headerTitle}
          user={user}
          invitationsCount={invitationsCount}
          canShowPhoto={canShowPhoto}
          photoUrl={photoUrl}
          initials={initials}
          setFailedPhoto={setFailedPhoto}
          openUserMenu={openUserMenu}
          openTripSearch={openTripSearch}
          isReadOnlyMode={isReadOnlyMode}
          onLoginClick={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* ── DESKTOP HEADER (MD+) ───────────────────────────── */}
      <Motion.header
        role="banner"
        className={cn(
          "app-shell-focus sticky top-0 z-dropdown min-h-[64px] hidden md:flex items-center justify-between",
          "px-6 gap-4"
        )}
        style={{
          // Ambient Glass BG — Framer Motion MotionValues, animates outside React render cycle
          backgroundColor: animBgColor,
          backdropFilter: animBackdrop,
          WebkitBackdropFilter: animBackdrop,
          borderBottom: animBorder,
        }}
      >
        {/* Left: Page Context Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Motion.h2
            key={pathname}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={cn(
              "text-[1.15rem] text-charcoalBlue font-extrabold m-0",
              "tracking-tight whitespace-nowrap overflow-hidden text-ellipsis font-heading"
            )}
          >
            {headerTitle}
          </Motion.h2>
        </div>

        {/* Right: Contextual Actions */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Desktop Search (only on /trips) */}
          <div className={cn(
            "items-center gap-2 bg-black/5 px-3.5 py-2 rounded-md",
            "border border-border min-w-[240px]",
            showSearch ? "flex" : "hidden"
          )}>
            <Search size={15} className="text-text-secondary" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={t('nav:searchJournal')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-none bg-none text-[0.9rem] text-charcoalBlue w-full outline-none focus:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                aria-label={t('nav:clearSearch')}
                className="border-none bg-transparent cursor-pointer text-text-secondary flex p-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Desktop Add Trip CTA */}
          <div>
            <Motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); openTripSearch(); }}
              disabled={isReadOnlyMode}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              data-testid="add-trip-button"
              className={cn(
                "bg-gradient-to-br from-atomicTangerine to-orange-400 text-white border-none",
                "px-5 py-2.5 rounded-full font-extrabold flex items-center gap-2",
                "shadow-[0_6px_20px_rgba(255,107,53,0.45)] text-[0.88rem] min-h-[40px]",
                "whitespace-nowrap transition-shadow duration-200 font-heading",
                isReadOnlyMode ? "opacity-55 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <Plus size={16} />
              {t('nav:addTrip')}
            </Motion.button>
          </div>

        {/* User Area */}
        {user ? (
          <div className="flex items-center gap-2">
            {/* Invitations Bell */}
            {ENABLE_INVITATIONS && (
              <button
                type="button"
                data-testid="header-invitations-button"
                onClick={() => navigate('/invitations')}
                aria-label={t('nav:invitations', { count: invitationsCount })}
                className="bg-transparent border-none cursor-pointer text-text-secondary flex items-center min-w-[44px] min-h-[44px] rounded-md justify-center relative hover:bg-black/5 transition-colors"
              >
                <Bell size={18} />
                {invitationsCount > 0 && (
                  <span
                    data-testid="header-invitations-count"
                    aria-live="polite"
                    className="absolute top-1 right-1 bg-danger text-white rounded-full w-4 h-4 text-[0.65rem] font-extrabold flex items-center justify-center"
                  >
                    {invitationsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            data-testid="header-login-button"
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-mutedTeal text-white border-none px-5 py-2.5 rounded-md font-bold cursor-pointer font-heading"
          >
            {t('common:login')}
          </button>
        )}
      </div>
    </Motion.header>

    {isAuthModalOpen && (
      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onContinue={login}
        />
      </Suspense>
    )}
  </>
);
};

export default Header;
