import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Globe2 } from 'lucide-react';
import { getCountryFlagEmoji } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

export const OnboardingStep3 = ({ onboarding }) => {
  const { t, i18n } = useTranslation('common');

  const currentBirthCountryName = getLocalizedCountryName(onboarding.birthCountry, i18n.language);
  const currentResidenceCountryName = getLocalizedCountryName(
    onboarding.sameAsBirth ? onboarding.birthCountry : onboarding.residenceCountry,
    i18n.language
  );

  return (
    <Motion.div
      key="step-3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center text-center flex-1"
    >
      {/* XP Badge with Glow */}
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-full blur-xl bg-[#FF6B35]/40"
          style={{ boxShadow: '0 0 24px rgba(255, 107, 53, 0.4)' }}
        />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
          <Sparkles size={24} className="mb-0.5 animate-pulse" />
          <span className="font-mono text-sm font-black tracking-tight leading-none">
            +50 XP
          </span>
        </div>
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight leading-tight mb-2">
        {t('onboarding.step3Title', '¡Identidad de Explorador Activada!')}
      </h2>
      <p className="text-sm text-slate-600 font-sans max-w-sm mb-6">
        {t('onboarding.step3Subtitle', 'Has configurado tus raíces y tu base. Tu mapa interactivo está listo para empezar a registrar tus recuerdos.')}
      </p>

      {/* Summary Card */}
      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-8 text-left flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">{t('onboarding.summaryTraveler', 'Explorador')}:</span>
          <span className="font-bold text-slate-800 font-heading">
            {onboarding.displayName || 'Explorer'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">{t('onboarding.roots', 'Tus Raíces')}:</span>
          <span className="font-bold text-[#2C3E50] font-heading">
            {getCountryFlagEmoji(onboarding.birthCountry)} {currentBirthCountryName}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">{t('onboarding.base', 'Tu Base')}:</span>
          <span className="font-bold text-[#45B0A8] font-heading">
            {getCountryFlagEmoji(onboarding.sameAsBirth ? onboarding.birthCountry : onboarding.residenceCountry)}{' '}
            {onboarding.cityQuery ? `${onboarding.cityQuery}, ` : ''}{currentResidenceCountryName}
          </span>
        </div>
      </div>

      {/* Dual CTA */}
      <div className="flex flex-col w-full gap-3 mt-auto">
        <Motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={onboarding.isSubmitting}
          onClick={() => onboarding.completeOnboarding({ navigateToNew: true })}
          className="w-full min-w-[240px] min-h-[48px] py-3.5 px-6 rounded-full bg-[#FF6B35] text-white font-extrabold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md disabled:opacity-50"
        >
          <Sparkles size={18} />
          {t('onboarding.registerFirstTrip', 'Registrar mi primer viaje')}
        </Motion.button>

        <Motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={onboarding.isSubmitting}
          onClick={() => onboarding.completeOnboarding({ navigateToNew: false })}
          className="w-full min-h-[44px] py-2.5 px-6 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Globe2 size={16} />
          {t('onboarding.goToMapFirst', 'Ir a mi mapa primero')}
        </Motion.button>
      </div>
    </Motion.div>
  );
};

export default OnboardingStep3;
