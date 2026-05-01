import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { OperationalControlsSection } from '@features/admin-controls';

const FOUNDER_UID_FALLBACK = 'FOUNDER_UID_HERE';

const MaintenanceScreen = () => {
  const { t } = useTranslation('common');
  const { usuario: user } = useAuth();
  const { pushToast } = useToast();

  const founderUid = import.meta.env.VITE_FOUNDER_UID || FOUNDER_UID_FALLBACK;
  const hasFounderUidAccess = Boolean(user?.uid && user.uid === founderUid);
  const canManageOperationalFlags = hasFounderUidAccess;

  return (
    <div className={cn(
      "h-[100dvh] min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden",
      "flex items-start justify-center p-6 bg-background",
      "bg-[radial-gradient(circle_at_14%_18%,rgba(255,107,53,0.12),transparent_40%),radial-gradient(circle_at_82%_85%,rgba(69,176,168,0.15),transparent_46%)]"
    )}>
      <div className={cn(
        "w-full max-w-[760px] mx-auto rounded-xl border border-border",
        "bg-white/95 shadow-float p-7 md:p-10 text-center"
      )}>
        <div className={cn(
          "inline-flex items-center justify-center gap-2",
          "rounded-full border border-border bg-atomicTangerine/10 text-charcoalBlue",
          "text-[0.78rem] font-extrabold tracking-[0.4px] uppercase px-3 py-1.5"
        )}>
          <Compass size={14} />
          {t('operational.maintenanceLabel', 'Maintenance Mode')}
        </div>

        <h1 className={cn(
          "mt-4 mb-2.5 text-charcoalBlue",
          "text-2xl md:text-4xl leading-[1.22] tracking-tight font-black"
        )}>
          {t(
            'operational.maintenanceMessage',
            "Explorer's Rest: We are upgrading the engines. Your trips are safe in the vault. We'll be right back."
          )}
        </h1>

        <p className={cn(
          "m-0 text-text-secondary text-base leading-relaxed font-medium"
        )}>
          {t(
            'operational.maintenanceHint',
            'No action is needed from your side. We will restore routes as soon as system checks are complete.'
          )}
        </p>

        <div className={cn(
          "mt-4.5 inline-flex items-center gap-2 text-mutedTeal text-[0.82rem] font-bold"
        )}>
          <ShieldCheck size={16} />
          {t('operational.dataSafe', 'Data integrity shield is active.')}
        </div>

        {canManageOperationalFlags && (
          <div className={cn(
            "mt-6 pt-5 border-t border-border text-left"
          )}>
            <OperationalControlsSection
              canManageOperationalFlags={canManageOperationalFlags}
              currentUser={user}
              onNotify={pushToast}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceScreen;
