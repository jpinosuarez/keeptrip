import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe2, LoaderCircle, Rocket, Sprout, Wrench } from 'lucide-react';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { ENABLE_DEV_TOOLS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import { clearDevData, seedDevData } from '@shared/dev/seedDevData';

/**
 * DevSeedControls — in-app quick reset card (Phase C), mounted by SettingsPage.
 *
 * Re-seeds the CURRENT signed-in account with any DEV persona and wipes the
 * archive behind a confirmation modal. All side effects (toasts + SPA
 * navigation) live here; `seedDevData` / `clearDevData` stay pure.
 *
 * Rendered exclusively when `import.meta.env.DEV` is true (see SettingsPage).
 */

const SCENARIO_ACTIONS = [
  { scenario: 'mateo', Icon: Rocket },
  { scenario: 'rich', Icon: Globe2 },
  { scenario: 'empty', Icon: Sprout },
];

const ONBOARDED_FLAG_PREFIX = 'keeptrip_onboarded_';

/** Keeps the onboarding modal in sync with the freshly seeded persona. */
const syncOnboardedFlag = (uid, scenario) => {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const key = `${ONBOARDED_FLAG_PREFIX}${uid}`;
    if (scenario === 'empty') {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, 'true');
    }
  } catch {
    // Ignore storage access issues.
  }
};

const DevSeedControls = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [pendingScenario, setPendingScenario] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const uid = usuario?.uid;
  const isBusy = Boolean(pendingScenario) || isClearing;

  const handleSeed = useCallback(
    async (scenario) => {
      if (!uid || isBusy) return;
      setPendingScenario(scenario);

      try {
        const result = await seedDevData(uid, scenario);
        if (!result.success) throw new Error(`dev-seed-failed:${scenario}`);

        syncOnboardedFlag(uid, result.scenario);
        pushToast(
          t('settings:devTools.seedSuccess', {
            scenario: t(`settings:devTools.scenarios.${result.scenario}`),
            count: result.count,
          }),
          'success'
        );
        navigate('/dashboard');
      } catch (error) {
        console.error('[DevSeedControls] Failed to seed scenario', { scenario, error });
        pushToast(t('settings:devTools.seedError'), 'error');
      } finally {
        setPendingScenario(null);
      }
    },
    [uid, isBusy, pushToast, t, navigate]
  );

  const handleClear = useCallback(async () => {
    if (!uid || isBusy) return;
    setIsClearing(true);

    try {
      const result = await clearDevData(uid);
      if (!result.success) throw new Error('dev-clear-failed');

      syncOnboardedFlag(uid, 'empty');
      pushToast(
        t('settings:devTools.clearSuccess', { count: result.deletedCount }),
        'success'
      );
      setShowClearConfirm(false);
    } catch (error) {
      console.error('[DevSeedControls] Failed to wipe trips', error);
      pushToast(t('settings:devTools.clearError'), 'error');
    } finally {
      setIsClearing(false);
    }
  }, [uid, isBusy, pushToast, t]);

  if (!ENABLE_DEV_TOOLS) return null;

  return (
    <>
      <div className="p-6 bg-slate-100/80 rounded-2xl border border-dashed border-slate-300">
        <div className="flex items-center gap-2 mb-2">
          <Wrench size={16} className="text-slate-600" />
          <span className="text-sm font-bold text-slate-800">
            {t('settings:devTools.title', 'Herramientas de Desarrollo (DEV)')}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {t(
            'settings:devTools.description',
            'Gestiona datos simulados en emuladores locales sin alterar cuentas reales.'
          )}
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.6px] text-slate-500">
            {t('settings:devTools.scenariosLabel', 'Escenario')}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {SCENARIO_ACTIONS.map(({ scenario, Icon }) => (
              <button
                key={scenario}
                type="button"
                onClick={() => handleSeed(scenario)}
                disabled={isBusy}
                className={cn(
                  'min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold',
                  'flex items-center justify-center gap-2 transition-colors cursor-pointer',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  scenario === 'mateo'
                    ? 'bg-[#FF6B35] text-white hover:bg-[#e85a26] shadow-xs'
                    : 'bg-white text-charcoalBlue border border-black/10 hover:bg-slate-50'
                )}
              >
                {pendingScenario === scenario ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  Icon && <Icon size={14} />
                )}
                <span>{t(`settings:devTools.scenarios.${scenario}`)}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={isBusy}
            className={cn(
              'mt-2 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold self-start',
              'flex items-center justify-center gap-2 transition-colors cursor-pointer',
              'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isClearing ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <span aria-hidden="true">🧹</span>
            )}
            <span>{t('settings:devTools.clear', 'Vaciar Todos Mis Viajes')}</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title={t('settings:devTools.clearConfirmTitle', 'Vaciar todos mis viajes')}
        message={t(
          'settings:devTools.clearConfirmMessage',
          'Se eliminarán todos los viajes y paradas de esta cuenta y volverás al estado inicial de onboarding.'
        )}
        confirmText={t('settings:devTools.clearConfirmAction', 'Vaciar viajes')}
        cancelText={t('common:cancel', 'Cancelar')}
        onConfirm={handleClear}
        onClose={() => setShowClearConfirm(false)}
        isLoading={isClearing}
      />
    </>
  );
};

export default DevSeedControls;
