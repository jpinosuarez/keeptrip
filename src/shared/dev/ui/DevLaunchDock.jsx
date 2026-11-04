import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe2, LoaderCircle, Rocket, Sprout } from 'lucide-react';
import { useToast } from '@app/providers/ToastContext';
import { ENABLE_DEV_TOOLS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import { ensureDevSession } from '@shared/dev/ensureDevSession';

/**
 * DevLaunchDock — floating DEV-only persona launcher (Phase B).
 *
 * Lives on the public Landing Page so mock data can be loaded WITHOUT signing
 * in first: it provisions/signs into the emulator test account, seeds the
 * selected persona and lands on /dashboard through the SPA router (no hard
 * reload, so the emulator session is never dropped).
 *
 * Rendered exclusively when `import.meta.env.DEV` is true (see LandingPage).
 */

const DEV_ACTIONS = [
  { scenario: 'mateo', Icon: Rocket, tone: 'bg-[#FF6B35] text-white hover:bg-[#e85a26]' },
  { scenario: 'rich', Icon: Globe2, tone: 'bg-[#2C3E50] text-white hover:bg-[#243544]' },
  { scenario: 'empty', Icon: Sprout, tone: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
];

const DevLaunchDock = () => {
  const { t } = useTranslation('landing');
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [pendingScenario, setPendingScenario] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const launch = useCallback(
    async (scenario) => {
      if (pendingScenario) return;
      setPendingScenario(scenario);

      try {
        const result = await ensureDevSession(scenario);
        if (!result.success) throw new Error(`dev-seed-failed:${scenario}`);

        pushToast(
          t('devDock.toast.success', {
            scenario: t(`devDock.scenarios.${result.scenario}`),
            count: result.count,
          }),
          'success'
        );
        navigate('/dashboard');
      } catch (error) {
        console.error('[DevLaunchDock] Failed to launch dev persona', { scenario, error });
        pushToast(t('devDock.toast.error'), 'error');
      } finally {
        if (isMountedRef.current) setPendingScenario(null);
      }
    },
    [pendingScenario, pushToast, t, navigate]
  );

  if (!ENABLE_DEV_TOOLS) return null;

  const isBusy = Boolean(pendingScenario);

  return (
    <div className="fixed bottom-4 right-4 z-[9997] max-w-[calc(100vw-32px)]">
      <div className="bg-white/95 border border-dashed border-slate-300 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.6px] text-slate-500">
            {t('devDock.title', 'Datos de prueba')}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[0.62rem] font-extrabold tracking-wider">
            DEV
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {DEV_ACTIONS.map(({ scenario, Icon, tone }) => (
            <button
              key={scenario}
              type="button"
              onClick={() => launch(scenario)}
              disabled={isBusy}
              className={cn(
                'min-h-[44px] w-full px-4 py-2.5 rounded-xl text-xs font-bold',
                'flex items-center justify-center gap-2 transition-colors cursor-pointer',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                tone
              )}
            >
              {pendingScenario === scenario ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                Icon && <Icon size={14} />
              )}
              <span>
                {pendingScenario === scenario
                  ? t('devDock.seeding', 'Sembrando...')
                  : t(`devDock.scenarios.${scenario}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevLaunchDock;
