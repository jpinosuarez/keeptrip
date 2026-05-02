import React from 'react';
import { AlertTriangle, Compass, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

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
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50" role="alert" aria-live="assertive" aria-atomic="true">
      <div className="w-full max-w-[500px] bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6" aria-labelledby="error-fallback-title" aria-describedby="error-fallback-description">
        <div className="w-20 h-20 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0" aria-hidden="true">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>
        
        <div className="flex flex-col gap-2">
          <h1 id="error-fallback-title" className="m-0 text-[1.75rem] font-black text-charcoalBlue leading-tight tracking-tight font-heading">
            {t('error.title')}
          </h1>
          <p id="error-fallback-description" className="m-0 text-[1.05rem] text-text-secondary leading-relaxed font-medium font-body">
            {t('error.description')}
          </p>
        </div>

        {!isDevelopment && (
          <p className="m-0 text-[0.85rem] text-text-secondary opacity-70 font-medium italic">{t('error.hint')}</p>
        )}

        {isDevelopment && error && (
          <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left flex flex-col gap-3 overflow-hidden">
            <p className="m-0 text-[0.75rem] font-black text-charcoalBlue uppercase tracking-widest leading-none">
              {t('error.detailsTitle')}
            </p>
            <pre className="m-0 text-[0.82rem] font-mono text-danger bg-danger/5 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all border border-danger/10">
              {error.toString()}
            </pre>
            {errorInfo?.componentStack && (
              <details className="group">
                <summary className="text-[0.75rem] font-bold text-slate-500 cursor-pointer hover:text-charcoalBlue transition-colors list-none flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="transition-transform group-open:rotate-90">▶</span> {t('error.stackTrace')}
                </summary>
                <pre className="mt-3 text-[0.75rem] font-mono text-slate-600 bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-atomicTangerine text-white border-none rounded-full text-[1rem] font-extrabold cursor-pointer shadow-lg shadow-atomicTangerine/30 transition-all hover:scale-[1.02] active:scale-[0.98] font-heading"
            aria-label={t('error.retry')}
          >
            <RefreshCcw size={18} strokeWidth={2.5} />
            {t('error.retry')}
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-charcoalBlue border-2 border-slate-200 rounded-full text-[1rem] font-extrabold cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] font-heading"
            aria-label={t('error.goHome')}
          >
            <Compass size={18} strokeWidth={2.5} />
            {t('error.goHome')}
          </button>
        </div>
        
        {!isDevelopment && (
          <p className="m-0 text-[0.8rem] text-text-secondary font-medium">{t('error.support')}</p>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
