import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Globe2, Heart, Home, ArrowLeft } from 'lucide-react';
import { CountryFlag } from '@shared/ui/components/CountryFlag';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

export const OnboardingStep4 = ({ onboarding }) => {
  const { t, i18n } = useTranslation('common');

  const currentBirthCountryName = getLocalizedCountryName(onboarding.birthCountry, i18n.language) || onboarding.birthCountry;
  const effectiveResidenceCountry = onboarding.residenceMode === 'different_country'
    ? onboarding.residenceCountry
    : onboarding.birthCountry;
  const currentResidenceCountryName = getLocalizedCountryName(effectiveResidenceCountry, i18n.language) || effectiveResidenceCountry;

  const effectiveBirthCityName = onboarding.birthCity?.name || onboarding.birthCityQuery || '';
  const effectiveBaseCityName = onboarding.residenceMode === 'same_city'
    ? effectiveBirthCityName
    : (onboarding.baseCity?.name || onboarding.baseCityQuery || '');

  return (
    <div className="flex flex-col items-center w-full text-center flex-1">
      {/* XP Badge with Glow */}
      <div className="relative mb-3 flex justify-center">
        <div
          className="absolute inset-0 rounded-full blur-xl bg-[#FF6B35]/40"
          style={{ boxShadow: '0 0 24px rgba(255, 107, 53, 0.4)' }}
        />
        <div className="relative w-18 h-18 rounded-full bg-[#FF6B35] text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.3)] border-2 border-white">
          <Sparkles size={22} className="mb-0.5 animate-pulse" />
          <span className="font-mono text-xs font-black tracking-tight leading-none">
            +50 XP
          </span>
        </div>
      </div>

      <h2 className="w-full text-center text-2xl md:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight leading-tight mb-2">
        {t('onboarding.step4Title', '¡Tu perfil está listo!')}
      </h2>
      <p className="w-full max-w-full px-2 text-center text-slate-600 text-sm md:text-base leading-relaxed whitespace-normal break-normal mb-5">
        {t('onboarding.step4Subtitle', 'Has configurado tu origen y residencia. Tu mapa interactivo está listo para empezar a registrar tus recuerdos.')}
      </p>

      {/* Full-width Responsive Summary Box */}
      <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 mb-6 text-left flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
          <span className="text-slate-500 font-semibold">{t('onboarding.summaryTraveler', 'Explorador')}:</span>
          <span className="font-black text-slate-800 font-heading text-sm">
            {onboarding.displayName || 'Explorer'}
          </span>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Roots summary card */}
          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-heading">
              <Heart size={12} className="text-[#FF6B35]" />
              <span>{t('onboarding.roots', 'Lugar de origen')}</span>
            </span>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <CountryFlag code={onboarding.birthCountry} size="sm" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#2C3E50] font-heading truncate">
                  {currentBirthCountryName}
                </span>
                {effectiveBirthCityName && (
                  <span className="text-[11px] text-slate-500 font-sans truncate">
                    {effectiveBirthCityName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Base summary card */}
          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-heading">
              <Home size={12} className="text-[#45B0A8]" />
              <span>{t('onboarding.base', 'Residencia actual')}</span>
            </span>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <CountryFlag code={effectiveResidenceCountry} size="sm" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#45B0A8] font-heading truncate">
                  {currentResidenceCountryName}
                </span>
                {effectiveBaseCityName && (
                  <span className="text-[11px] text-slate-500 font-sans truncate">
                    {effectiveBaseCityName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual CTA */}
      <div className="flex flex-col w-full gap-2.5 mt-auto">
        <Motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={onboarding.isSubmitting}
          onClick={() => onboarding.completeOnboarding({ navigateToNew: true })}
          className="w-full min-w-[240px] min-h-[48px] py-3.5 px-6 rounded-full bg-[#FF6B35] text-white font-extrabold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={18} />
          {t('onboarding.registerFirstTrip', 'Crear mi primer viaje')}
        </Motion.button>

        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onboarding.prevStep}
            className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors min-h-[44px] flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} /> {t('common:back', 'Anterior')}
          </button>

          <Motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={onboarding.isSubmitting}
            onClick={() => onboarding.completeOnboarding({ navigateToNew: false })}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Globe2 size={15} />
            {t('onboarding.goToMapFirst', 'Ver mi mapa')}
          </Motion.button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep4;
