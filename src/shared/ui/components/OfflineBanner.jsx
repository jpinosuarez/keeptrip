import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, GLASS } from '@shared/config';

/**
 * Global banner that appears when the browser loses connectivity.
 * Uses the navigator.onLine API + online/offline events.
 * Styled with glassmorphism to be elegant and non-intrusive.
 */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  // Track whether we've ever been offline so we don't flash "reconnected" on first mount
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Auto-dismiss "reconnected" after 3 seconds
        const timer = setTimeout(() => setShowReconnected(false), 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  const offline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...styles.banner,
        ...(offline ? styles.offlineColors : styles.onlineColors),
      }}
    >
      {offline ? (
        <>
          <WifiOff size={16} />
          <span>{t('offline.disconnected')}</span>
        </>
      ) : (
        <>
          <Wifi size={16} />
          <span>{t('offline.reconnected')}</span>
        </>
      )}
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: RADIUS.full,
    fontSize: '0.82rem',
    fontWeight: 600,
    zIndex: 700,
    boxShadow: SHADOWS.float,
    ...GLASS.medium,
    transition: 'all 0.3s ease',
    pointerEvents: 'none',
  },
  offlineColors: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: COLORS.danger,
    border: `1px solid rgba(239, 68, 68, 0.25)`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  onlineColors: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: COLORS.success,
    border: `1px solid rgba(16, 185, 129, 0.25)`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
};
