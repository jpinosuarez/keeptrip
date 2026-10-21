import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvatarButton from './AvatarButton';

const MapFloatingHud = ({
  user,
  canShowPhoto,
  photoUrl,
  initials,
  setFailedPhoto,
  openUserMenu,
  onLoginClick,
}) => {
  const { t } = useTranslation('nav');

  return (
    <div
      data-testid="map-floating-hud"
      className="flex md:hidden pointer-events-none fixed top-0 left-0 right-0 pt-safe px-4 z-dropdown justify-between items-center mt-2"
    >
      <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-border/40 rounded-full px-4 h-11 flex items-center gap-2 shadow-sm font-heading font-bold text-sm text-slate-800">
        <MapPin size={16} className="text-atomicTangerine" />
        <span>{t('pageTitle.worldMap')}</span>
      </div>
      <div className="pointer-events-auto">
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
  );
};

export default React.memo(MapFloatingHud);
