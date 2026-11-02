import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Compass, Heart, Home, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { CountryFlag } from '@shared/ui/components/CountryFlag';
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
  const effectiveResidenceCountry = onboarding.residenceMode === 'different_country'
    ? onboarding.residenceCountry
    : onboarding.birthCountry;
  const currentResidenceCountryName = getLocalizedCountryName(effectiveResidenceCountry, i18n.language);

  const effectiveBaseCityName = onboarding.residenceMode === 'same_city'
    ? (onboarding.birthCity?.name || onboarding.birthCityQuery)
    : (onboarding.baseCity?.name || onboarding.baseCityQuery);

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
      <p className="text-xs md:text-sm text-slate-600 mb-4">
        {t('onboarding.step2Subtitle', 'Configura tu mapa global. Tu lugar de origen y tu base actual tendrán una presencia especial en tus mapas.')}
      </p>

      {/* ── SECCIÓN 1: TUS RAÍCES ── */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 mb-4 flex flex-col gap-3">
        <div className="text-xs font-black text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <Heart size={14} className="text-[#FF6B35]" />
          <span>{t('onboarding.rootsSectionTitle', 'Tus Raíces (Origen)')}</span>
        </div>

        {/* Birth Country */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            {t('onboarding.birthCountryLabel', '¿Dónde naciste o creciste?')}
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 z-10 pointer-events-none">
              <CountryFlag code={onboarding.birthCountry} size="sm" />
            </div>
            <select
              value={onboarding.birthCountry}
              onChange={(e) => onboarding.setBirthCountry(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all appearance-none cursor-pointer min-h-[44px]"
            >
              {sortedCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.localizedName}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        </div>

        {/* Birth City Autocomplete */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>{t('onboarding.birthCityLabel', 'Ciudad Natal')}</span>
            <span className="text-[10px] text-slate-400 lowercase">{t('common.optional', 'opcional')}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={onboarding.birthCityQuery}
              onChange={(e) => {
                onboarding.setBirthCityQuery(e.target.value);
                onboarding.setBirthCity(null);
              }}
              placeholder={t('onboarding.birthCityPlaceholder', 'Ej: Buenos Aires, Rosario, Córdoba...')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all min-h-[44px]"
            />
            {onboarding.isLoadingBirthCities && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse font-mono">
                ...
              </div>
            )}
          </div>

          {onboarding.birthCitySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
              {onboarding.birthCitySuggestions.map((sug, idx) => (
                <button
                  key={`${sug.name}-${idx}`}
                  type="button"
                  onClick={() => onboarding.selectBirthCitySuggestion(sug)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-b-0 text-xs font-medium text-slate-700 min-h-[40px]"
                >
                  <MapPin size={12} className="text-[#FF6B35] shrink-0" />
                  <span className="truncate">{sug.fullName || sug.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 2: TU BASE ACTUAL ── */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 mb-4 flex flex-col gap-3">
        <div className="text-xs font-black text-[#45B0A8] uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <Home size={14} className="text-[#45B0A8]" />
          <span>{t('onboarding.baseSectionTitle', 'Tu Base Actual')}</span>
        </div>

        {/* 3-Option Residence Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-700">
            {t('onboarding.residenceQuestion', '¿Dónde vives actualmente?')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {[
              { id: 'same_city', label: t('onboarding.modeSameCity', 'Misma ciudad natal') },
              { id: 'same_country', label: t('onboarding.modeSameCountry', 'Otra ciudad del país') },
              { id: 'different_country', label: t('onboarding.modeDifferentCountry', 'En otro país') },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onboarding.setResidenceMode(option.id)}
                className={cn(
                  "py-2.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all min-h-[44px] text-center",
                  onboarding.residenceMode === option.id
                    ? "bg-[#45B0A8] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {onboarding.residenceMode === option.id && <Check size={12} className="shrink-0" />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* If different country: reveal residence country selector */}
        <AnimatePresence>
          {onboarding.residenceMode === 'different_country' && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springTransition}
              className="flex flex-col gap-1 overflow-hidden pt-1"
            >
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {t('onboarding.residenceCountryLabel', 'País de Residencia')}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 z-10 pointer-events-none">
                  <CountryFlag code={onboarding.residenceCountry} size="sm" />
                </div>
                <select
                  value={onboarding.residenceCountry}
                  onChange={(e) => onboarding.setResidenceCountry(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all appearance-none cursor-pointer min-h-[44px]"
                >
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.localizedName}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* If same_country or different_country: reveal base city input */}
        <AnimatePresence>
          {onboarding.residenceMode !== 'same_city' && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springTransition}
              className="flex flex-col gap-1 relative overflow-hidden pt-1"
            >
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>{t('onboarding.baseCityLabel', 'Ciudad Base actual')}</span>
                <span className="text-[10px] text-slate-400 lowercase">{t('common.optional', 'opcional')}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={onboarding.baseCityQuery}
                  onChange={(e) => {
                    onboarding.setBaseCityQuery(e.target.value);
                    onboarding.setBaseCity(null);
                  }}
                  placeholder={t('onboarding.baseCityPlaceholder', 'Ej: Madrid, Barcelona, Valencia...')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all min-h-[44px]"
                />
                {onboarding.isLoadingBaseCities && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse font-mono">
                    ...
                  </div>
                )}
              </div>

              {onboarding.baseCitySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                  {onboarding.baseCitySuggestions.map((sug, idx) => (
                    <button
                      key={`${sug.name}-${idx}`}
                      type="button"
                      onClick={() => onboarding.selectBaseCitySuggestion(sug)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-b-0 text-xs font-medium text-slate-700 min-h-[40px]"
                    >
                      <MapPin size={12} className="text-[#FF6B35] shrink-0" />
                      <span className="truncate">{sug.fullName || sug.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Identity Badges Preview */}
      <div className="flex items-center gap-2 mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#2C3E50] text-white flex items-center justify-center shrink-0">
            <Heart size={14} />
          </span>
          <div className="truncate">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('onboarding.roots', 'Raíces')}
            </div>
            <div className="text-xs font-extrabold text-[#2C3E50] truncate font-heading flex items-center gap-1.5">
              <CountryFlag code={onboarding.birthCountry} size="xs" />
              <span className="truncate">
                {onboarding.birthCityQuery ? `${onboarding.birthCityQuery}, ` : ''}{currentBirthCountryName}
              </span>
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
            <div className="text-xs font-extrabold text-[#45B0A8] truncate font-heading flex items-center gap-1.5">
              <CountryFlag code={effectiveResidenceCountry} size="xs" />
              <span className="truncate">
                {effectiveBaseCityName ? `${effectiveBaseCityName}, ` : ''}{currentResidenceCountryName}
              </span>
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
