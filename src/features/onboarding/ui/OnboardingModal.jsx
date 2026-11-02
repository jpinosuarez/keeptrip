import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../model/useOnboarding';
import { cn } from '@shared/lib/utils/cn';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';
import OnboardingStep4 from './OnboardingStep4';

const springTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
};

const OnboardingModal = ({ isOpen = true, onClose, onComplete }) => {
  const { t } = useTranslation('common');
  const onboarding = useOnboarding({ isOpen, onClose, onComplete });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={springTransition}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full max-w-[500px] max-h-[90dvh]",
            "bg-white rounded-[24px] md:rounded-[32px] pt-6 px-6 md:pt-8 md:px-8",
            "shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col"
          )}
          style={{ width: 'min(calc(100vw - 32px), 500px)' }}
        >
          {/* Header & Step Dots */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
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

            {onboarding.step < 4 ? (
              <button
                type="button"
                onClick={onboarding.skipOnboarding}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label={t('onboarding.skip', 'Saltar por ahora')}
              >
                {t('onboarding.skip', 'Saltar')}
              </button>
            ) : <div />}
          </div>

          {/* Scrollable step body: generous bottom clearance keeps the country /
              city dropdowns fully visible inside the modal viewport. */}
          <div className="flex-1 min-h-[440px] overflow-y-auto overflow-x-hidden overscroll-contain pb-32 md:pb-36 flex flex-col custom-scroll">
            {onboarding.step === 1 && <OnboardingStep1 onboarding={onboarding} />}
            {onboarding.step === 2 && <OnboardingStep2 onboarding={onboarding} />}
            {onboarding.step === 3 && <OnboardingStep3 onboarding={onboarding} />}
            {onboarding.step === 4 && <OnboardingStep4 onboarding={onboarding} />}
          </div>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
