import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

export const OnboardingStep1 = ({ onboarding }) => {
  const { t } = useTranslation('common');

  return (
    <Motion.div
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35] mb-4">
        <Sparkles size={24} />
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight leading-tight mb-2">
        {t('onboarding.step1Title', '¡Hola, Explorador!')}
      </h2>
      <p className="text-sm md:text-base text-slate-600 font-sans mb-6">
        {t('onboarding.step1Subtitle', 'Keeptrip es tu archivo digital para revivir y conectar cada aventura. Comencemos definiendo tu identidad de viaje.')}
      </p>

      {/* Display Name Input */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
          {t('onboarding.nameLabel', '¿Cómo te llamamos en tus viajes?')}
        </label>
        <input
          type="text"
          value={onboarding.displayName}
          onChange={(e) => onboarding.setDisplayName(e.target.value)}
          placeholder={t('onboarding.namePlaceholder', 'Tu nombre o apodo viajero')}
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-base focus:bg-white focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all min-h-[48px]"
        />
      </div>

      {/* Language Switcher */}
      <div className="flex flex-col gap-2 mb-8">
        <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
          {t('onboarding.langLabel', 'Idioma preferido')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onboarding.handleLanguageChange('es')}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm min-h-[44px] transition-all",
              onboarding.language === 'es'
                ? "border-[#45B0A8] bg-[#45B0A8]/10 text-[#45B0A8] shadow-sm"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <span>🇪🇸</span> Español
          </button>
          <button
            type="button"
            onClick={() => onboarding.handleLanguageChange('en')}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm min-h-[44px] transition-all",
              onboarding.language === 'en'
                ? "border-[#45B0A8] bg-[#45B0A8]/10 text-[#45B0A8] shadow-sm"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <span>🇬🇧</span> English
          </button>
        </div>
      </div>

      {/* Primary CTA */}
      <Motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onboarding.nextStep}
        className="mt-auto w-full min-w-[240px] min-h-[48px] py-3.5 px-6 rounded-full bg-[#FF6B35] text-white font-extrabold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md"
      >
        {t('onboarding.continue', 'Continuar')} <ArrowRight size={18} />
      </Motion.button>
    </Motion.div>
  );
};

export default OnboardingStep1;
