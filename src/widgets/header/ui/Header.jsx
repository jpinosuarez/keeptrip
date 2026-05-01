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
import { ENABLE_INVITATIONS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

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

const Header = ({ invitationsCount = 0 }) => {
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
      className={cn(
        "app-shell-focus sticky top-0 z-dropdown min-h-[64px] flex items-center justify-between",
        "pt-[var(--safe-area-top-padding)] px-4 pb-2 md:px-6 gap-2 md:gap-4"
      )}
      style={{
        // Ambient Glass BG — Framer Motion MotionValues, animates outside React render cycle
        backgroundColor: animBgColor,
        backdropFilter: animBackdrop,
        WebkitBackdropFilter: animBackdrop,
        borderBottom: animBorder,
      }}
    >
      {/* Left: Brand (mobile) + Page Context */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Mobile Brand Anchor (Refinement #3) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0 mr-1">
          <Disc size={22} className="text-atomicTangerine" />
          {!isCompactLogoRoute && (
            <span className="font-black text-base text-charcoalBlue tracking-tight font-heading">
              Keeptrip
            </span>
          )}
        </div>
        {/* Title */}
        <Motion.h2
          key={pathname}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className={cn(
            "text-base md:text-[1.15rem] text-charcoalBlue font-extrabold m-0",
            "tracking-tight whitespace-nowrap overflow-hidden text-ellipsis font-heading"
          )}
        >
          {headerTitle}
        </Motion.h2>
      </div>

      {/* Right: Contextual Actions */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Desktop Search (only on /trips) */}
        <div className={cn(
          "hidden md:flex items-center gap-2 bg-black/5 px-3.5 py-2 rounded-md",
          "border border-black/5 min-w-[240px]",
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
            <button type="button" onClick={clearQuery} className="border-none bg-transparent cursor-pointer text-text-secondary flex p-0">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile Search toggle (only on /trips) */}
        {showSearch && (
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(o => !o)}
            aria-label={isMobileSearchOpen ? t('nav:closeSearch') : t('nav:openSearch')}
            aria-expanded={isMobileSearchOpen}
            className="flex md:hidden bg-transparent border border-black/10 text-text-secondary w-11 h-11 rounded-md items-center justify-center cursor-pointer"
          >
            {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        )}

        {/* Desktop Add Trip CTA */}
        <div className="hidden md:block">
          <Motion.button
            type="button"
            onClick={openTripSearch}
            disabled={isReadOnlyMode}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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

            {/* Avatar (Mobile Only) */}
            <div className="md:hidden">
              <button
                type="button"
                data-testid="header-avatar"
                onClick={() => openUserMenu()}
                title={t('nav:settings')}
                aria-label={t('nav:settings')}
                className="w-11 h-11 rounded-full bg-mutedTeal border-2 border-white/80 shadow-md flex items-center justify-center text-white font-bold text-[0.85rem] shrink-0 cursor-pointer overflow-hidden"
              >
                {canShowPhoto ? (
                  <img
                    src={photoUrl}
                    alt={t('nav:avatarAlt', { name: user.displayName || '' })}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setFailedPhoto(photoUrl)}
                  />
                ) : initials ? (
                  <span className="font-bold text-[0.8rem] font-heading">{initials}</span>
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
            className="bg-mutedTeal text-white border-none px-5 py-2.5 rounded-md font-bold cursor-pointer font-heading"
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
      <AnimatePresence>
        {showSearch && isMobileSearchOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', damping: 20 }}
            className={cn(
              "absolute top-[calc(64px+var(--safe-area-inset-top,0px))] left-4 right-4",
              "bg-white/95 backdrop-blur-xl rounded-lg border border-black/10 shadow-lg",
              "px-4 py-3 flex items-center gap-2 z-modal"
            )}
          >
            <Search size={16} className="text-text-secondary" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={t('nav:searchJournal')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="border-none bg-none text-base text-charcoalBlue w-full outline-none focus:ring-0"
            />
            {query && (
              <button type="button" onClick={clearQuery} className="border-none bg-transparent cursor-pointer text-text-secondary flex p-0">
                <X size={14} />
              </button>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.header>
  );
};

export default Header;
