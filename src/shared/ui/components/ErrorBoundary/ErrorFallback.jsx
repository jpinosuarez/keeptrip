import React from 'react';
import { AlertTriangle, Compass, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './ErrorFallback.styles';

/**
 * ErrorFallback (Dumb Component)
 * Pure UI for error display, no business logic.
 */
const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const { t } = useTranslation('common');
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={styles.container} role="alert" aria-live="assertive" aria-atomic="true">
      <div style={styles.card} aria-labelledby="error-fallback-title" aria-describedby="error-fallback-description">
        <div style={styles.iconContainer}>
          <AlertTriangle size={48} color={styles.colors.danger} />
        </div>
        <h1 id="error-fallback-title" style={styles.title}>{t('error.title')}</h1>
        <p id="error-fallback-description" style={styles.description}>{t('error.description')}</p>

        {!isDevelopment && (
          <p style={styles.hintText}>{t('error.hint')}</p>
        )}

        {isDevelopment && error && (
          <div style={styles.errorDetails}>
            <p style={styles.errorTitle}>{t('error.detailsTitle')}</p>
            <pre style={styles.errorMessage}>{error.toString()}</pre>
            {errorInfo?.componentStack && (
              <details style={styles.stackTrace}>
                <summary style={styles.stackSummary}>{t('error.stackTrace')}</summary>
                <pre style={styles.stackCode}>{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        )}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onReset}
            style={styles.primaryButton}
            aria-label={t('error.retry')}
          >
            <RefreshCcw size={18} />
            {t('error.retry')}
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            style={styles.secondaryButton}
            aria-label={t('error.goHome')}
          >
            <Compass size={18} />
            {t('error.goHome')}
          </button>
        </div>
        {!isDevelopment && (
          <p style={styles.supportText}>{t('error.support')}</p>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
