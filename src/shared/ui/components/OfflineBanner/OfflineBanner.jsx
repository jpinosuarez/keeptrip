import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './OfflineBanner.styles';

/**
 * OfflineBanner (Dumb Component)
 * Shows a sticky banner when the app is offline.
 * Mobile-First, accessible, animated.
 */
const OfflineBanner = () => {
  const { t } = useTranslation('common');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    let reconnectTimer;

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(true);
      reconnectTimer = window.setTimeout(() => {
        setShowBanner(false);
      }, 2000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      style={{
        ...styles.banner,
        ...(isOffline ? styles.bannerOffline : styles.bannerOnline),
        ...styles.slideIn,
      }}
      role="status"
      aria-live="polite"
    >
      <span style={styles.text}>
        {isOffline
          ? t('offline.message')
          : t('offline.reconnected')}
      </span>
    </div>
  );
};

export default OfflineBanner;
