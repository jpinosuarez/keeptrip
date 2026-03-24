/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS, RADIUS, Z_INDEX, TRANSITIONS } from '@shared/config';

const ToastContext = createContext(null);

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION_BY_TYPE = {
  success: 3000,
  info: 3500,
  warning: 4500,
  error: 5500,
};

const TOAST_COLORS = {
  success: {
    bg: `${COLORS.success}EE`,
    border: `${COLORS.success}55`,
    progress: COLORS.success,
    icon: CheckCircle2,
  },
  error: {
    bg: `${COLORS.danger}EE`,
    border: `${COLORS.danger}55`,
    progress: COLORS.danger,
    icon: CircleAlert,
  },
  warning: {
    bg: `${COLORS.warning}EE`,
    border: `${COLORS.warning}66`,
    progress: COLORS.warning,
    icon: AlertTriangle,
  },
  info: {
    bg: `${COLORS.mutedTeal}EE`,
    border: `${COLORS.mutedTeal}55`,
    progress: COLORS.mutedTeal,
    icon: Info,
  },
};

export const ToastProvider = ({ children }) => {
  const { t } = useTranslation('common');
  const reduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = React.useRef({});

  const visibleToasts = useMemo(() => toasts.slice(0, MAX_VISIBLE_TOASTS), [toasts]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }
  }, []);

  const pushToast = useCallback((messageOrConfig, type = 'info', duration) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const normalized =
      typeof messageOrConfig === 'object' && messageOrConfig !== null
        ? messageOrConfig
        : { message: messageOrConfig, type, duration };

    const resolvedType = normalized.type || 'info';
    const resolvedDuration =
      typeof normalized.duration === 'number'
        ? normalized.duration
        : DEFAULT_DURATION_BY_TYPE[resolvedType] || DEFAULT_DURATION_BY_TYPE.info;

    const nextToast = {
      id,
      message: normalized.message,
      type: resolvedType,
      duration: resolvedDuration,
      persistent: !!normalized.persistent,
      action: normalized.action || null,
    };

    setToasts((prev) => {
      const existingIndex = prev.findIndex(
        (toast) => toast.type === nextToast.type && toast.message === nextToast.message
      );

      if (existingIndex === -1) {
        return [...prev, nextToast];
      }

      const existing = prev[existingIndex];
      const timeoutId = timeoutsRef.current[existing.id];
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        delete timeoutsRef.current[existing.id];
      }

      const next = [...prev];
      next[existingIndex] = {
        ...existing,
        duration: nextToast.duration,
        persistent: nextToast.persistent,
        action: nextToast.action || existing.action,
        refreshedAt: Date.now(),
      };
      return next;
    });
  }, []);

  React.useEffect(() => {
    const visibleIds = new Set(visibleToasts.map((toast) => toast.id));

    visibleToasts.forEach((toast) => {
      if (toast.persistent || toast.duration <= 0 || timeoutsRef.current[toast.id]) {
        return;
      }
      const timeoutId = window.setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);
      timeoutsRef.current[toast.id] = timeoutId;
    });

    Object.entries(timeoutsRef.current).forEach(([id, timeoutId]) => {
      if (!visibleIds.has(id)) {
        window.clearTimeout(timeoutId);
        delete timeoutsRef.current[id];
      }
    });
  }, [visibleToasts, dismissToast]);

  React.useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = {};
    };
  }, []);

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div style={styles.viewport}>
        <AnimatePresence initial={false} mode="popLayout">
          {visibleToasts.map((toast) => {
            const palette = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
            const Icon = palette.icon;
            return (
              <Motion.div
                key={toast.id}
                layout
                role={toast.type === 'error' ? 'alert' : 'status'}
                aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
                aria-atomic="true"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.98 }}
                transition={
                  reduceMotion
                    ? { duration: 0.08 }
                    : { type: 'spring', damping: 20, stiffness: 220, mass: 0.8 }
                }
                whileHover={reduceMotion ? undefined : { y: -2 }}
                style={{
                  ...styles.toast,
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.border}`
                }}
              >
                <Icon size={18} />
                <span style={styles.message}>{toast.message}</span>
                {toast.action && typeof toast.action.onClick === 'function' && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action.onClick();
                      dismissToast(toast.id);
                    }}
                    style={styles.actionBtn}
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  style={styles.closeBtn}
                  aria-label={t('toast.close', { defaultValue: 'Cerrar notificacion' })}
                >
                  <X size={14} />
                </button>
                {!toast.persistent && toast.duration > 0 && (
                  <Motion.span
                    aria-hidden="true"
                    style={{ ...styles.progress, backgroundColor: palette.progress }}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : toast.duration / 1000,
                      ease: 'linear',
                    }}
                  />
                )}
              </Motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return ctx;
};

const styles = {
  viewport: {
    position: 'fixed',
    bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
    right: 'max(20px, env(safe-area-inset-right, 0px))',
    zIndex: Z_INDEX.toast,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none'
  },
  toast: {
    position: 'relative',
    minWidth: '260px',
    maxWidth: '360px',
    color: 'white',
    border: '1px solid transparent',
    borderRadius: RADIUS.md,
    padding: '12px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: SHADOWS.lg,
    pointerEvents: 'auto',
    overflow: 'hidden',
    transition: TRANSITIONS.fast,
  },
  message: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: 1.3,
    flex: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  actionBtn: {
    border: 'none',
    color: COLORS.textPrimary,
    background: 'rgba(255,255,255,0.88)',
    borderRadius: RADIUS.full,
    minHeight: '32px',
    padding: '6px 12px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  closeBtn: {
    border: 'none',
    color: 'white',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  progress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '3px',
    transformOrigin: 'left center',
  },
};
