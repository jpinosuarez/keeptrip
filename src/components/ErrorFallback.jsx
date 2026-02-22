import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS, TRANSITIONS } from '../theme';

/**
 * Componente de fallback mostrado cuando ErrorBoundary captura un error
 * UI amigable con opciones de recuperación
 */
export function ErrorFallback({ error, errorInfo, onReset }) {
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <AlertTriangle size={48} color={COLORS.danger} />
        </div>

        <h1 style={styles.title}>¡Ups! Algo salió mal</h1>
        
        <p style={styles.description}>
          Lo sentimos, hemos encontrado un problema inesperado. 
          No te preocupes, tus datos están seguros.
        </p>

        {isDevelopment && error && (
          <div style={styles.errorDetails}>
            <p style={styles.errorTitle}>Detalles técnicos:</p>
            <pre style={styles.errorMessage}>
              {error.toString()}
            </pre>
            {errorInfo?.componentStack && (
              <details style={styles.stackTrace}>
                <summary style={styles.stackSummary}>Ver stack trace</summary>
                <pre style={styles.stackCode}>
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div style={styles.actions}>
          <button 
            onClick={onReset} 
            style={styles.primaryButton}
          >
            <RefreshCcw size={18} />
            Reintentar
          </button>
          
          <button 
            onClick={handleGoHome} 
            style={styles.secondaryButton}
          >
            <Home size={18} />
            Ir al inicio
          </button>
        </div>

        {!isDevelopment && (
          <p style={styles.supportText}>
            Si el problema persiste, por favor contacta al soporte.
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: '20px',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.lg,
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: '12px',
  },
  description: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  errorDetails: {
    backgroundColor: '#FEF2F2',
    border: `1px solid ${COLORS.danger}20`,
    borderRadius: RADIUS.sm,
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  errorTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.danger,
    marginBottom: '8px',
  },
  errorMessage: {
    fontSize: '13px',
    color: '#991B1B',
    fontFamily: 'monospace',
    overflow: 'auto',
    margin: 0,
    padding: '8px',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
  },
  stackTrace: {
    marginTop: '12px',
  },
  stackSummary: {
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: '8px',
  },
  stackCode: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '200px',
    margin: '8px 0 0',
    padding: '8px',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: TRANSITIONS.fast,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: COLORS.textPrimary,
    border: `2px solid ${COLORS.border}`,
    borderRadius: RADIUS.full,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: TRANSITIONS.fast,
  },
  supportText: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    marginTop: '24px',
    fontStyle: 'italic',
  },
};
