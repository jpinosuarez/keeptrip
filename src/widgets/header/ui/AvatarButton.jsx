import React from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

const AvatarButton = ({
  user,
  canShowPhoto,
  photoUrl,
  initials,
  setFailedPhoto,
  openUserMenu,
  onLoginClick,
  className,
}) => {
  const { t } = useTranslation(['nav', 'common']);

  if (!user) {
    return (
      <button
        type="button"
        data-testid="header-login-button"
        onClick={onLoginClick}
        className={cn(
          "bg-mutedTeal text-white border-none px-4 py-2 min-h-[44px] rounded-lg font-bold cursor-pointer font-heading flex items-center justify-center text-sm",
          className
        )}
      >
        {t('common:login')}
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="header-avatar"
      onClick={() => openUserMenu()}
      title={t('nav:settings')}
      aria-label={t('nav:settings')}
      className={cn(
        "w-11 h-11 rounded-full bg-mutedTeal border-2 border-white/80 shadow-md flex items-center justify-center text-white font-bold text-[0.85rem] shrink-0 cursor-pointer overflow-hidden",
        className
      )}
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
  );
};

export default React.memo(AvatarButton);
