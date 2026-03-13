/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { SHADOWS, RADIUS, Z_INDEX } from '@shared/config';

const ToastContext = createContext(null);

const TOAST_COLORS = {
  success: { bg: '#0f766e', border: '#14b8a6', icon: CheckCircle2 },
  error: { bg: '#991b1b', border: '#ef4444', icon: CircleAlert },
  info: { bg: '#1e3a8a', border: '#60a5fa', icon: Info }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast = { id, message, type };

    setToasts((prev) => [...prev, nextToast]);

    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div style={styles.viewport} role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const palette = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
            const Icon = palette.icon;
            return (
              <Motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                style={{
                  ...styles.toast,
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.border}`
                }}
              >
                <Icon size={18} />
                <span style={styles.message}>{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  style={styles.closeBtn}
                  aria-label="Cerrar notificacion"
                >
                  <X size={14} />
                </button>
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
    pointerEvents: 'auto'
  },
  message: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: 1.3,
    flex: 1
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
    flexShrink: 0
  }
};
