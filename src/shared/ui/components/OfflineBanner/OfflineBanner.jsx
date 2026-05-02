import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';
import { Wifi, WifiOff } from 'lucide-react';

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
      }, 3000);
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
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-center py-3 px-4 transition-all duration-500 ease-in-out transform shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
        isOffline 
          ? "bg-slate-900 text-white translate-y-0" 
          : "bg-emerald-500 text-white translate-y-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        {isOffline ? (
          <WifiOff size={18} className="text-white/80 animate-pulse" />
        ) : (
          <Wifi size={18} className="text-white/80" />
        )}
        <span className="text-[0.9rem] font-bold tracking-tight font-heading">
          {isOffline
            ? t('offline.message')
            : t('offline.reconnected')}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;

