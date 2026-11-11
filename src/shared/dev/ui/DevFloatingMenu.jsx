import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe2, LoaderCircle, RefreshCw, Rocket, Sprout, X, Zap } from 'lucide-react';
import { ENABLE_DEV_TOOLS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import { auth } from '@shared/firebase';
import { ensureDevSession } from '@shared/dev/ensureDevSession';
import { clearDevData } from '@shared/dev/seedDevData';
import {
  DEV_OVERRIDE_EVENT,
  isDevGodModeEnabled,
  setDevGodMode,
} from '@shared/dev/devGamificationOverride';

/**
 * DevFloatingMenu — in-app DEV control panel (Phase D).
 *
 * Mounted by AppScaffold behind `ENABLE_DEV_TOOLS`, so it is unreachable in
 * production builds. Exposes the session-scoped Gamification God Mode, DEV
 * persona quick-switching and a real-data reset — all without touching
 * Firestore analytics or the gamification engines (the toggle event re-renders
 * `useAchievements` in memory).
 */

const PERSONAS = [
  { scenario: 'mateo', Icon: Rocket },
  { scenario: 'rich', Icon: Globe2 },
  { scenario: 'empty', Icon: Sprout },
];

export default function DevFloatingMenu({ onClose }) {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const [godMode, setGodMode] = useState(() => isDevGodModeEnabled());
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Sync the God Mode visual status with any other DEV surface.
  useEffect(() => {
    const sync = () => setGodMode(isDevGodModeEnabled());
    window.addEventListener(DEV_OVERRIDE_EVENT, sync);
    return () => window.removeEventListener(DEV_OVERRIDE_EVENT, sync);
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const close = useCallback(() => onClose?.(), [onClose]);

  const launchPersona = useCallback(
    async (scenario) => {
      if (busy) return;
      setBusy(scenario);
      setFeedback(null);
      try {
        const result = await ensureDevSession(scenario);
        if (!result?.success) throw new Error('dev-seed-failed');
        setFeedback('seeded');
        navigate('/dashboard');
      } catch (error) {
        console.error('[DevFloatingMenu] Failed to launch DEV persona', { scenario, error });
        setFeedback('error');
      } finally {
        setBusy(null);
      }
    },
    [busy, navigate],
  );

  const resetRealData = useCallback(async () => {
    if (busy) return;
    setBusy('reset');
    setFeedback(null);
    try {
      const uid = auth?.currentUser?.uid;
      if (uid) await clearDevData(uid);
      setDevGodMode(false);
      setFeedback('reset');
      navigate('/dashboard');
    } catch (error) {
      console.error('[DevFloatingMenu] Failed to reset DEV data', { error });
      setFeedback('error');
    } finally {
      setBusy(null);
    }
  }, [busy, navigate]);

  if (!ENABLE_DEV_TOOLS) return null;

  const isBusy = Boolean(busy);

  return (
    <>
      <div
        className="fixed inset-0 z-[99998] bg-slate-950/40 backdrop-blur-xs"
        aria-hidden="true"
        onClick={close}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('devDock.panel.title', 'Panel de Desarrollo')}
        data-testid="dev-floating-menu"
        className={cn(
          'fixed z-[99999] left-4 w-80 max-w-[calc(100vw-32px)]',
          'bottom-[calc(64px+max(16px,env(safe-area-inset-bottom,0px)))] md:bottom-20',
          'rounded-3xl bg-slate-900/95 backdrop-blur-md text-white p-5 shadow-2xl border border-slate-700/80',
          'flex flex-col gap-3',
        )}
      >
        <header className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-slate-300">
            🛠️ {t('devDock.panel.title', 'Panel de Desarrollo')}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('devDock.panel.close', 'Cerrar panel')}
            className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            data-testid="dev-floating-menu-close"
          >
            <X size={16} />
          </button>
        </header>

        <button
          type="button"
          role="switch"
          aria-checked={godMode}
          aria-label={t('devDock.godMode.label', 'Gamification God Mode')}
          onClick={() => setDevGodMode(!isDevGodModeEnabled())}
          className={cn(
            'min-h-[44px] w-full px-3 py-2 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
            godMode ? 'bg-[#FF6B35]/15 border-[#FF6B35]/50' : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800',
          )}
          data-testid="dev-floating-god-mode"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Zap size={14} className={cn('shrink-0', godMode ? 'text-[#FF6B35]' : 'text-slate-400')} />
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-tight">
                ⚡ {t('devDock.godMode.label', 'Gamification God Mode')}
              </span>
              <span className="block text-[0.62rem] font-medium text-slate-400 leading-tight">
                {t('devDock.godMode.hint', 'Desbloquea los 250 emblemas y todas las insignias')}
              </span>
            </span>
          </span>
          <span className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full font-mono text-[0.58rem] font-bold uppercase tracking-wider',
                godMode ? 'bg-[#FF6B35]/20 text-[#FF6B35]' : 'bg-slate-700/70 text-slate-300',
              )}
              data-testid="dev-floating-god-mode-status"
            >
              {godMode
                ? t('devDock.panel.statusOn', 'Activado')
                : t('devDock.panel.statusOff', 'Desactivado')}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors',
                godMode ? 'bg-[#FF6B35]' : 'bg-slate-600',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all',
                  godMode ? 'left-[18px]' : 'left-0.5',
                )}
              />
            </span>
          </span>
        </button>

        <div className="space-y-2">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.6px] text-slate-400">
            {t('devDock.panel.quickSwitch', 'Cambiar demo')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PERSONAS.map(({ scenario, Icon }) => (
              <button
                key={scenario}
                type="button"
                onClick={() => launchPersona(scenario)}
                disabled={isBusy}
                className="min-h-[44px] px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[0.66rem] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid={`dev-floating-persona-${scenario}`}
              >
                {busy === scenario
                  ? <LoaderCircle size={14} className="animate-spin" />
                  : React.createElement(Icon, { size: 14 })}
                <span className="leading-tight text-center">
                  {busy === scenario
                    ? t('devDock.seeding', 'Sembrando...')
                    : t(`devDock.scenarios.${scenario}`, scenario)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={resetRealData}
          disabled={isBusy}
          className="min-h-[44px] w-full px-3 rounded-xl border border-slate-700 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          data-testid="dev-floating-reset"
        >
          {busy === 'reset' ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>
            {busy === 'reset'
              ? t('devDock.panel.resetBusy', 'Restableciendo...')
              : t('devDock.panel.reset', 'Restablecer datos reales')}
          </span>
        </button>

        {feedback && (
          <p
            className={cn(
              'text-[0.62rem] font-medium text-center',
              feedback === 'error' ? 'text-rose-300' : 'text-[#45B0A8]',
            )}
            role="status"
            data-testid="dev-floating-feedback"
          >
            {feedback === 'error'
              ? t('devDock.panel.error', 'No se pudo completar la acción.')
              : feedback === 'reset'
                ? t('devDock.panel.resetDone', 'Datos restablecidos.')
                : t('devDock.panel.seeded', 'Demo cargada. Abriendo el panel de viajes...')}
          </p>
        )}

        <p className="text-[0.58rem] font-mono uppercase tracking-wider text-slate-500 text-center">
          {t('devDock.panel.onlyDev', 'Solo entorno DEV')}
        </p>

      </section>
    </>
  );
}
