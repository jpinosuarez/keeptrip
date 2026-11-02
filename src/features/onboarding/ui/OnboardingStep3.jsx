import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Home, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { CountrySearchSelect } from '@shared/ui/components/CountrySearchSelect';
import { CityAutocompleteInput } from '@shared/ui/components/CityAutocompleteInput';
import { CountryFlag } from '@shared/ui/components/CountryFlag';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

const springTransition = { type: 'spring', stiffness: 100, damping: 20 };

export const OnboardingStep3 = ({ onboarding }) => {
  const { t, i18n } = useTranslation('common');
  const birthCountryName = getLocalizedCountryName(onboarding.birthCountry, i18n.language) || onboarding.birthCountry;

  return (
    <Motion.div
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#45B0A8]/10 flex items-center justify-center text-[#45B0A8] mb-4">
        <Home size={24} />
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight leading-tight mb-2">
        {t('onboarding.step3ResidenceTitle', '¿Dónde vives actualmente?')}
      </h2>
      <p className="text-sm md:text-base text-slate-600 font-sans mb-6">
        {t('onboarding.step3ResidenceSubtitle', 'Usaremos tu ubicación actual para centrar tu mapa y calcular tus estadísticas.')}
      </p>

      {/* 3 Pill Options */}
      <div className="flex flex-col gap-2.5 mb-6">
        {[
          {
            id: 'same_city',
            label: t('onboarding.modeSameCity', 'Vivo en mi misma ciudad natal'),
            desc: onboarding.birthCity?.name
              ? `${onboarding.birthCity.name}, ${birthCountryName}`
              : birthCountryName,
          },
          {
            id: 'same_country',
            label: t('onboarding.modeSameCountryDynamic', 'Vivo en otra ciudad de {{country}}', { country: birthCountryName }),
            desc: t('onboarding.modeSameCountryDesc', 'En el mismo país pero distinta ciudad'),
          },
          {
            id: 'different_country',
            label: t('onboarding.modeDifferentCountry', 'Vivo en otro país'),
            desc: t('onboarding.modeDifferentCountryDesc', 'Te mudaste al extranjero'),
          },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onboarding.setResidenceMode(option.id)}
            className={cn(
              "w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer min-h-[52px]",
              onboarding.residenceMode === option.id
                ? "border-[#45B0A8] bg-[#45B0A8]/5 ring-2 ring-[#45B0A8]/20 shadow-xs"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className={cn("text-sm font-bold font-heading", onboarding.residenceMode === option.id ? "text-[#45B0A8]" : "text-slate-800")}>
                {option.label}
              </span>
              <span className="text-xs text-slate-500 font-sans truncate">
                {option.desc}
              </span>
            </div>
            {onboarding.residenceMode === option.id && (
              <div className="w-6 h-6 rounded-full bg-[#45B0A8] text-white flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Conditional Inputs */}
      <AnimatePresence mode="wait">
        {onboarding.residenceMode === 'same_city' && (
          <Motion.div
            key="same_city_confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springTransition}
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 flex items-center gap-2.5"
          >
            <CountryFlag code={onboarding.birthCountry} size="sm" />
            <div className="flex-1 truncate text-xs font-semibold text-slate-700 font-sans">
              <span>{t('onboarding.confirmedSameCity', 'Tu residencia se registrará igual que tu origen:')} </span>
              <strong className="text-slate-900 font-heading">
                {onboarding.birthCity?.name ? `${onboarding.birthCity.name}, ` : ''}{birthCountryName}
              </strong>
            </div>
          </Motion.div>
        )}

        {onboarding.residenceMode === 'same_country' && (
          <Motion.div
            key="same_country_input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="flex flex-col gap-2 mb-6 overflow-visible"
          >
            <CityAutocompleteInput
              label={t('onboarding.baseCityLabel', 'Ciudad donde vives actualmente')}
              value={onboarding.baseCity}
              countryCode={onboarding.birthCountry}
              onChange={(city) => {
                onboarding.setBaseCity(city);
                if (city?.name) onboarding.setBaseCityQuery(city.name);
              }}
              placeholder={t('onboarding.baseCityPlaceholder', 'Ej: Madrid, Barcelona, Valencia...')}
            />
          </Motion.div>
        )}

        {onboarding.residenceMode === 'different_country' && (
          <Motion.div
            key="different_country_inputs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="flex flex-col gap-4 mb-6 overflow-visible"
          >
            <CountrySearchSelect
              label={t('onboarding.residenceCountryLabel', 'País donde vives actualmente')}
              value={onboarding.residenceCountry}
              onChange={(code) => onboarding.setResidenceCountry(code)}
              placeholder={t('common:selectCountry', 'Seleccionar país...')}
            />

            <CityAutocompleteInput
              label={t('onboarding.baseCityLabel', 'Ciudad donde vives actualmente')}
              value={onboarding.baseCity}
              countryCode={onboarding.residenceCountry}
              onChange={(city) => {
                onboarding.setBaseCity(city);
                if (city?.name) onboarding.setBaseCityQuery(city.name);
              }}
              placeholder={t('onboarding.baseCityPlaceholder', 'Ej: Berlín, Londres, Tokio...')}
            />
          </Motion.div>
        )}
      </AnimatePresence>

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

export default OnboardingStep3;


