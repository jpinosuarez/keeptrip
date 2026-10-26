import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Compass, Heart, Home, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCountryFlagEmoji } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

const springTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
};

export const OnboardingStep2 = ({ onboarding, sortedCountries }) => {
  const { t, i18n } = useTranslation('common');

  const currentBirthCountryName = getLocalizedCountryName(onboarding.birthCountry, i18n.language);
  const currentResidenceCountryName = getLocalizedCountryName(
    onboarding.sameAsBirth ? onboarding.birthCountry : onboarding.residenceCountry,
    i18n.language
  );

  return (
    <Motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-xl bg-[#2C3E50]/10 flex items-center justify-center text-[#2C3E50]">
          <Compass size={18} />
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1E293B] font-heading tracking-tight">
          {t('onboarding.step2Title', 'Tus Raíces y Tu Base')}
        </h2>
      </div>
      <p className="text-xs md:text-sm text-slate-600 mb-5">
        {t('onboarding.step2Subtitle', 'Configura tu mapa global. Tu país de origen y tu residencia actual tendrán una presencia especial en tus mapas.')}
      </p>

      {/* Birth Country Selector */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
          <Heart size={14} className="text-[#FF6B35]" />
          {t('onboarding.birthCountryLabel', '¿Dónde naciste o creciste? (Tus Raíces)')}
        </label>
        <div className="relative">
          <select
            value={onboarding.birthCountry}
            onChange={(e) => onboarding.setBirthCountry(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all appearance-none cursor-pointer min-h-[44px]"
          >
            {sortedCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {getCountryFlagEmoji(c.code)} {c.localizedName}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* Same As Birth Toggle */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          {t('onboarding.sameCountryQuestion', '¿Vives actualmente allí?')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onboarding.setSameAsBirth(true)}
            className={cn(
              "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px]",
              onboarding.sameAsBirth
                ? "bg-[#45B0A8] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            {onboarding.sameAsBirth && <Check size={14} />}
            {t('onboarding.sameYes', 'Sí, sigo viviendo allí')}
          </button>
          <button
            type="button"
            onClick={() => onboarding.setSameAsBirth(false)}
            className={cn(
              "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px]",
              !onboarding.sameAsBirth
                ? "bg-[#45B0A8] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            {!onboarding.sameAsBirth && <Check size={14} />}
            {t('onboarding.sameNo', 'No, vivo en otro país')}
          </button>
        </div>
      </div>

      {/* Residence Country (if not same) */}
      <AnimatePresence>
        {!onboarding.sameAsBirth && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="flex flex-col gap-1.5 mb-4 overflow-hidden"
          >
            <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
              <Home size={14} className="text-[#45B0A8]" />
              {t('onboarding.residenceCountryLabel', 'País de Residencia Actual (Tu Base)')}
            </label>
            <div className="relative">
              <select
                value={onboarding.residenceCountry}
                onChange={(e) => onboarding.setResidenceCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all appearance-none cursor-pointer min-h-[44px]"
              >
                {sortedCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {getCountryFlagEmoji(c.code)} {c.localizedName}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Base City Input (Optional with Autocomplete) */}
      <div className="flex flex-col gap-1.5 mb-4 relative">
        <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[#FF6B35]" />
            {t('onboarding.baseCityLabel', 'Ciudad Base actual (opcional)')}
          </span>
          <span className="text-[10px] text-slate-400 lowercase">{t('common.optional', 'opcional')}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={onboarding.cityQuery}
            onChange={(e) => {
              onboarding.setCityQuery(e.target.value);
              onboarding.setBaseCity(null);
            }}
            placeholder={t('onboarding.cityPlaceholder', 'Ej: Buenos Aires, Madrid, Berlín...')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all min-h-[44px]"
          />
          {onboarding.isLoadingCities && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse font-mono">
              ...
            </div>
          )}
        </div>

        {/* City Autocomplete Dropdown */}
        {onboarding.citySuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
            {onboarding.citySuggestions.map((sug, idx) => (
              <button
                key={`${sug.name}-${idx}`}
                type="button"
                onClick={() => onboarding.selectCitySuggestion(sug)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-b-0 text-xs font-medium text-slate-700 min-h-[44px]"
              >
                <MapPin size={12} className="text-[#FF6B35] shrink-0" />
                <span className="truncate">{sug.fullName || sug.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual Identity Badges Preview */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#2C3E50] text-white flex items-center justify-center shrink-0">
            <Heart size={14} />
          </span>
          <div className="truncate">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('onboarding.roots', 'Raíces')}
            </div>
            <div className="text-xs font-extrabold text-[#2C3E50] truncate font-heading">
              {getCountryFlagEmoji(onboarding.birthCountry)} {currentBirthCountryName}
            </div>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-slate-200 shrink-0" />

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#45B0A8] text-white flex items-center justify-center shrink-0">
            <Home size={14} />
          </span>
          <div className="truncate">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('onboarding.base', 'Base')}
            </div>
            <div className="text-xs font-extrabold text-[#45B0A8] truncate font-heading">
              {getCountryFlagEmoji(onboarding.sameAsBirth ? onboarding.birthCountry : onboarding.residenceCountry)}{' '}
              {onboarding.cityQuery ? `${onboarding.cityQuery}, ` : ''}{currentResidenceCountryName}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onboarding.prevStep}
          className="px-4 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors min-h-[44px] flex items-center gap-1.5"
        >
          <ArrowLeft size={16} /> {t('common.back', 'Atrás')}
        </button>
        <Motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onboarding.nextStep}
          className="flex-1 min-w-[200px] min-h-[44px] py-3.5 px-6 rounded-full bg-[#FF6B35] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md"
        >
          {t('onboarding.continue', 'Continuar')} <ArrowRight size={18} />
        </Motion.button>
      </div>
    </Motion.div>
  );
};

export default OnboardingStep2;
