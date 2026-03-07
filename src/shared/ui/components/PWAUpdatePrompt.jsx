import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { COLORS, RADIUS, SHADOWS, GLASS } from '@shared/config';

export default function PWAUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div style={styles.banner}>
      <span style={styles.text}>{t('pwa.updateAvailable')}</span>
      <div style={styles.actions}>
        <button onClick={() => updateServiceWorker(true)} style={styles.updateBtn}>
          {t('pwa.update')}
        </button>
        <button onClick={() => setNeedRefresh(false)} style={styles.dismissBtn}>
          {t('pwa.later')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.float,
    zIndex: 600,
    ...GLASS.medium,
    border: `1px solid ${COLORS.border}`,
  },
  text: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: COLORS.textPrimary,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  updateBtn: {
    padding: '6px 14px',
    borderRadius: RADIUS.sm,
    border: 'none',
    background: COLORS.atomicTangerine,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  dismissBtn: {
    padding: '6px 10px',
    borderRadius: RADIUS.sm,
    border: `1px solid ${COLORS.border}`,
    background: 'transparent',
    color: COLORS.textSecondary,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
};
