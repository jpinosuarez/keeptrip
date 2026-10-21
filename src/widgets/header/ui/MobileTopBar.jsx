/* global __APP_VERSION__ */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Bell, ArrowLeft } from 'lucide-react';
import { BrandIsotype } from '@shared/ui/brand';
import { ENABLE_INVITATIONS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import AvatarButton from './AvatarButton';

const MobileTopBar = ({
  pathname,
  headerTitle,
  user,
  invitationsCount = 0,
  canShowPhoto,
  photoUrl,
  initials,
  setFailedPhoto,
  openUserMenu,
  openTripSearch,
  isReadOnlyMode,
  onLoginClick,
}) => {
  const { t } = useTranslation(['nav', 'common']);
  const navigate = useNavigate();

  const isDashboard = pathname === '/dashboard';
  const isTrips = pathname === '/trips' || pathname.startsWith('/trips/');
  const isSettings = pathname === '/settings';
  const isInvitations = pathname === '/invitations';

  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

  return (
    <header
      data-testid="mobile-top-bar"
      className="flex md:hidden flex-col w-full bg-white/85 backdrop-blur-md border-b border-border/40 shrink-0 sticky top-0 z-dropdown pt-safe"
    >
      <div className="flex items-center justify-between h-14 px-4 w-full gap-3">
        {/* Left Side per Route */}
        <div className="flex items-center min-w-0 flex-1">
          {isDashboard ? (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Keeptrip"
              className="flex items-center min-h-[44px] bg-transparent border-none p-0 cursor-pointer text-left shrink-0"
            >
              <BrandIsotype className="w-8 h-8 text-atomicTangerine" />
              <span className="font-heading font-black text-xl text-slate-800 ml-2 tracking-tight">
                Keeptrip
              </span>
            </button>
          ) : isInvitations ? (
            <div className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label={t('common:back', 'Volver')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-transparent border-none text-charcoalBlue cursor-pointer p-0 -ml-2 shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-heading font-bold text-xl text-slate-800 m-0 truncate tracking-tight">
                {t('nav:pageTitle.invitations')}
              </h1>
            </div>
          ) : isTrips ? (
            <h1 className="font-heading font-bold text-xl text-slate-800 m-0 truncate tracking-tight">
              {t('nav:pageTitle.journal')}
            </h1>
          ) : isSettings ? (
            <h1 className="font-heading font-bold text-xl text-slate-800 m-0 truncate tracking-tight">
              {t('nav:pageTitle.settings')}
            </h1>
          ) : (
            <h1 className="font-heading font-bold text-xl text-slate-800 m-0 truncate tracking-tight">
              {headerTitle}
            </h1>
          )}
        </div>

        {/* Right Side per Route */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dashboard: Invitations Bell */}
          {isDashboard && ENABLE_INVITATIONS && user && (
            <button
              type="button"
              data-testid="header-invitations-button"
              onClick={() => navigate('/invitations')}
              aria-label={t('nav:invitations', { count: invitationsCount })}
              className="bg-transparent border-none cursor-pointer text-text-secondary flex items-center min-w-[44px] min-h-[44px] rounded-md justify-center relative hover:bg-black/5 transition-colors"
            >
              <Bell size={20} />
              {invitationsCount > 0 && (
                <span
                  data-testid="header-invitations-count"
                  aria-live="polite"
                  className="absolute top-1.5 right-1.5 bg-danger text-white rounded-full w-4 h-4 text-[0.65rem] font-extrabold flex items-center justify-center"
                >
                  {invitationsCount}
                </span>
              )}
            </button>
          )}

          {/* Trips: Quick Add CTA Button */}
          {isTrips && (
            <button
              type="button"
              data-testid="mobile-add-trip-button"
              onClick={(e) => {
                e.stopPropagation();
                openTripSearch();
              }}
              disabled={isReadOnlyMode}
              aria-label={t('nav:addTrip')}
              title={t('nav:addTrip')}
              className={cn(
                "w-11 h-11 bg-atomicTangerine text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform shrink-0",
                isReadOnlyMode ? "opacity-55 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* Settings: Version Badge Pill */}
          {isSettings && (
            <span
              data-testid="settings-version-badge"
              className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0"
            >
              {`v${appVersion}`}
            </span>
          )}

          {/* User Avatar Button (All Mobile Routes) */}
          <AvatarButton
            user={user}
            canShowPhoto={canShowPhoto}
            photoUrl={photoUrl}
            initials={initials}
            setFailedPhoto={setFailedPhoto}
            openUserMenu={openUserMenu}
            onLoginClick={onLoginClick}
          />
        </div>
      </div>
    </header>
  );
};

export default React.memo(MobileTopBar);
