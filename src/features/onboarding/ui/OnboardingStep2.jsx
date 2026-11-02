import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { CountrySearchSelect } from '@shared/ui/components/CountrySearchSelect';
import { CityAutocompleteInput } from '@shared/ui/components/CityAutocompleteInput';

export const OnboardingStep2 = ({ onboarding }) => {
  const { t } = useTranslation('common');

  return (
    <Motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#2C3E50]/10 flex items-center justify-center text-[#2C3E50] mb-4">
        <Heart size={24} className="text-[#FF6B35]" />
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight leading-tight mb-2">
        {t('onboarding.step2Title', '¿Dónde naciste?')}
      </h2>
      <p className="text-sm md:text-base text-slate-600 font-sans mb-6">
        {t('onboarding.step2Subtitle', 'Marcaremos tu país y ciudad de origen en tu mapa personal.')}
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <CountrySearchSelect
          label={t('onboarding.birthCountryLabel', 'País de nacimiento')}
          value={onboarding.birthCountry}
          onChange={(code) => onboarding.setBirthCountry(code)}
          placeholder={t('common:selectCountry', 'Seleccionar país...')}
        />

        <CityAutocompleteInput
          label={t('onboarding.birthCityLabel', 'Ciudad natal')}
          value={onboarding.birthCity}
          countryCode={onboarding.birthCountry}
          onChange={(city) => {
            onboarding.setBirthCity(city);
            if (city?.name) onboarding.setBirthCityQuery(city.name);
          }}
          placeholder={t('onboarding.birthCityPlaceholder', 'Ej: Buenos Aires, Rosario, Córdoba...')}
        />
      </div>

      <div className="mt-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onboarding.prevStep}
          className="px-5 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors min-h-[48px] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} /> {t('common:back', 'Anterior')}
        </button>
        <Motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onboarding.nextStep}
          className="flex-1 min-w-[200px] min-h-[48px] py-3.5 px-6 rounded-full bg-[#FF6B35] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md cursor-pointer"
        >
          {t('onboarding.continue', 'Continuar')} <ArrowRight size={18} />
        </Motion.button>
      </div>
    </Motion.div>
  );
};

export default OnboardingStep2;
