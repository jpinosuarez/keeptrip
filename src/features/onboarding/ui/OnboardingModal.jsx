import React, { useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../model/useOnboarding';
import { COUNTRIES_DATA } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';

const springTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
};

const OnboardingModal = ({ isOpen = true, onClose, onComplete }) => {
  const { t, i18n } = useTranslation('common');
  const onboarding = useOnboarding({ isOpen, onClose, onComplete });

  const sortedCountries = useMemo(() => {
    return [...COUNTRIES_DATA].map((c) => ({
      ...c,
      localizedName: getLocalizedCountryName(c.code, i18n.language) || c.name,
    })).sort((a, b) => a.localizedName.localeCompare(b.localizedName));
  }, [i18n.language]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={springTransition}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full max-w-[500px] max-h-[90dvh] overflow-y-auto overflow-x-hidden",
            "bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8",
            "shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col"
          )}
          style={{ width: 'min(calc(100vw - 32px), 500px)' }}
        >
          {/* Header & Step Dots */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    onboarding.step === s
                      ? "w-8 bg-[#FF6B35]"
                      : onboarding.step > s
                      ? "w-2 bg-[#45B0A8]"
                      : "w-2 bg-slate-200"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onboarding.skipOnboarding}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('onboarding.skip', 'Saltar por ahora')}
            >
              {t('onboarding.skip', 'Saltar')}
            </button>
          </div>

          {onboarding.step === 1 && <OnboardingStep1 onboarding={onboarding} />}
          {onboarding.step === 2 && (
            <OnboardingStep2 onboarding={onboarding} sortedCountries={sortedCountries} />
          )}
          {onboarding.step === 3 && <OnboardingStep3 onboarding={onboarding} />}
        </Motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
