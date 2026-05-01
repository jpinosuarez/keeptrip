import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

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
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        if (reconnectTimerRef.current) {
          window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(() => {
          setShowReconnected(false);
          reconnectTimerRef.current = null;
        }, 3000);
      }
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  const offline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-3 left-1/2 -translate-x-1/2",
        "flex items-center gap-2 p-2 px-4 rounded-full",
        "text-[0.82rem] font-semibold z-toast shadow-float",
        "backdrop-blur-md transition-all duration-300 pointer-events-none border",
        offline 
          ? "bg-danger/10 text-danger border-danger/25" 
          : "bg-success/10 text-success border-success/25"
      )}
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
