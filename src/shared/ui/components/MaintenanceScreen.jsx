import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, ShieldCheck } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';
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
  // Firestore rules allow writes to operational_flags only for founder UIDs.
  const canManageOperationalFlags = hasFounderUidAccess;

  return (
    <div
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at 14% 18%, rgba(255,107,53,0.12), transparent 40%), radial-gradient(circle at 82% 85%, rgba(69,176,168,0.15), transparent 46%), #F8FAFC',
      }}
    >
      <div
        style={{
          width: 'min(94vw, 760px)',
          margin: '0 auto',
          borderRadius: RADIUS.xl,
          border: `1px solid ${COLORS.border}`,
          background: 'rgba(255, 255, 255, 0.94)',
          boxShadow: SHADOWS.float,
          padding: '28px 26px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: RADIUS.full,
            border: `1px solid ${COLORS.border}`,
            background: 'rgba(255, 107, 53, 0.08)',
            color: COLORS.charcoalBlue,
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            padding: '6px 12px',
          }}
        >
          <Compass size={14} />
          {t('operational.maintenanceLabel', 'Maintenance Mode')}
        </div>

        <h1
          style={{
            margin: '16px 0 10px',
            color: COLORS.charcoalBlue,
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            fontWeight: 900,
          }}
        >
          {t(
            'operational.maintenanceMessage',
            "Explorer's Rest: We are upgrading the engines. Your trips are safe in the vault. We'll be right back."
          )}
        </h1>

        <p
          style={{
            margin: 0,
            color: COLORS.textSecondary,
            fontSize: '0.95rem',
            lineHeight: 1.55,
            fontWeight: 500,
          }}
        >
          {t(
            'operational.maintenanceHint',
            'No action is needed from your side. We will restore routes as soon as system checks are complete.'
          )}
        </p>

        <div
          style={{
            marginTop: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: COLORS.mutedTeal,
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={16} />
          {t('operational.dataSafe', 'Data integrity shield is active.')}
        </div>

        {canManageOperationalFlags && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: `1px solid ${COLORS.border}`,
              textAlign: 'left',
            }}
          >
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
