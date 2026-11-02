import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Save, Heart, Home, MapPin, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { deriveResidenceMode, normalizeCity } from '@shared/lib/geo';
import { CountrySearchSelect } from '@shared/ui/components/CountrySearchSelect';
import { CityAutocompleteInput } from '@shared/ui/components/CityAutocompleteInput';
import { cn } from '@shared/lib/utils/cn';

import BottomSheet from '@shared/ui/components/BottomSheet';

function getInitials(name) {
  if (!name) return '';
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const { user, userProfile, updateUserProfile } = useAuth() || {};
  const { isMobile } = useWindowSize(768);

  const [name, setName] = useState(userProfile?.displayName || user?.displayName || '');
  const [photo, setPhoto] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [birthCountry, setBirthCountry] = useState(userProfile?.birthCountry || 'ES');
  // City state keeps the full record ({ name, coordinates, countryCode }) so coordinates
  // selected through the autocomplete are never lost on save.
  const [birthCity, setBirthCity] = useState(() =>
    normalizeCity(userProfile?.birthCity, userProfile?.birthCountry || 'ES')
  );
  const [residenceMode, setResidenceMode] = useState(() => {
    if (userProfile?.residenceCountry && userProfile.birthCountry && userProfile.residenceCountry !== userProfile.birthCountry) {
      return 'different_country';
    }
    if (userProfile?.baseCity && userProfile?.birthCity && userProfile.baseCity.name !== userProfile.birthCity.name) {
      return 'same_country';
    }
    return 'same_city';
  });
  const [residenceCountry, setResidenceCountry] = useState(userProfile?.residenceCountry || userProfile?.birthCountry || 'ES');
  const [baseCity, setBaseCity] = useState(() =>
    normalizeCity(
      userProfile?.baseCity,
      userProfile?.residenceCountry || userProfile?.birthCountry || 'ES'
    )
  );
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Reactive sync: profile → form ──────────────────────────────────────
  // Render-time adjustment (React's recommended pattern): the modal re-seeds when the
  // saved identity changes (onboarding, settings, other tabs) without an extra effect.
  const profileBirthCountry = userProfile?.birthCountry || null;
  const profileResidenceCountry = userProfile?.residenceCountry || null;
  const profileBirthCity = normalizeCity(userProfile?.birthCity, profileBirthCountry || 'ES');
  const profileBaseCity = normalizeCity(
    userProfile?.baseCity,
    profileResidenceCountry || profileBirthCountry || 'ES'
  );

  const identitySyncKey = [
    profileBirthCountry || '',
    profileResidenceCountry || '',
    profileBirthCity?.name || '',
    profileBirthCity?.coordinates?.[0] ?? '',
    profileBirthCity?.coordinates?.[1] ?? '',
    profileBaseCity?.name || '',
    profileBaseCity?.coordinates?.[0] ?? '',
    profileBaseCity?.coordinates?.[1] ?? '',
  ].join('|');

  const [syncedIdentityKey, setSyncedIdentityKey] = useState(identitySyncKey);

  if (identitySyncKey !== syncedIdentityKey) {
    setSyncedIdentityKey(identitySyncKey);
    setBirthCountry(profileBirthCountry || 'ES');
    setBirthCity(profileBirthCity);
    setResidenceMode(deriveResidenceMode({
      birthCountry: profileBirthCountry,
      residenceCountry: profileResidenceCountry,
      birthCity: profileBirthCity,
      baseCity: profileBaseCity,
    }));
    setResidenceCountry(profileResidenceCountry || profileBirthCountry || 'ES');
    setBaseCity(profileBaseCity);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Persist the full city record (name + real coordinates), never just the label.
    const finalBirthCity = birthCity?.name
      ? { name: birthCity.name, coordinates: birthCity.coordinates, countryCode: birthCountry }
      : null;

    let finalResidenceCountry = birthCountry;
    let finalBaseCity = null;

    if (residenceMode === 'same_city') {
      finalResidenceCountry = birthCountry;
      finalBaseCity = finalBirthCity;
    } else {
      finalResidenceCountry = residenceMode === 'same_country'
        ? birthCountry
        : (residenceCountry || birthCountry);
      finalBaseCity = baseCity?.name
        ? { name: baseCity.name, coordinates: baseCity.coordinates, countryCode: finalResidenceCountry }
        : null;
    }

    if (updateUserProfile) {
      await updateUserProfile({
        displayName: name,
        photoURL: photo,
        birthCountry,
        birthCity: finalBirthCity,
        residenceCountry: finalResidenceCountry,
        baseCity: finalBaseCity,
      });
    }

    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const avatarFallback = (
    <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center font-black text-text-secondary text-[2rem]">
      {getInitials(name) || t('profile.avatarFallback')}
    </div>
  );

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden self-center mb-2.5 border-2 border-atomicTangerine bg-white/10 flex items-center justify-center relative">
        {!photo || !imgLoaded ? avatarFallback : null}
        {photo && (
          <img
            src={photo}
            alt={t('profile.avatarAlt')}
            className="w-full h-full object-cover block"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
          />
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <label className="text-[0.8rem] font-bold text-charcoalBlue uppercase tracking-wide">{t('profile.nameLabel')}</label>
        <input
          className="w-full p-3 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-atomicTangerine/20 focus:border-atomicTangerine outline-none transition-all font-medium"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[0.8rem] font-bold text-charcoalBlue uppercase tracking-wide">{t('profile.photoLabel')}</label>
        <input
          className="w-full p-3 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-atomicTangerine/20 focus:border-atomicTangerine outline-none transition-all font-medium min-h-[44px]"
          value={photo}
          onChange={e => setPhoto(e.target.value)}
          placeholder={t('profile.photoPlaceholder')}
        />
      </div>

      {/* Origin & residence */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
        <div className="text-xs font-black text-charcoalBlue uppercase tracking-wider font-heading">
          {t('profile.rootsAndBaseTitle', 'Lugar de origen y residencia')}
        </div>

        {/* Birth Country */}
        <CountrySearchSelect
          label={t('profile.birthCountryLabel', 'País de nacimiento')}
          value={birthCountry}
          onChange={(code) => {
            setBirthCountry(code);
            // A city from a previous country must not survive a country switch.
            setBirthCity((prev) => (prev && prev.countryCode !== code ? null : prev));
          }}
          placeholder={t('common:selectCountry', 'Seleccionar país...')}
        />

        {/* Birth City */}
        <CityAutocompleteInput
          label={t('profile.birthCityLabel', 'Ciudad natal (opcional)')}
          value={birthCity}
          countryCode={birthCountry}
          onChange={(city) => setBirthCity(normalizeCity(city, birthCountry))}
          placeholder={t('profile.birthCityPlaceholder', 'Ej: Buenos Aires, Rosario...')}
        />

        {/* Residence Mode Selector */}
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60">
          <label className="text-[0.75rem] font-bold text-slate-600 flex items-center gap-1">
            <Home size={12} className="text-[#45B0A8]" />
            {t('profile.residenceModeLabel', 'Lugar de Residencia')}
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
                onClick={() => setResidenceMode(option.id)}
                className={cn(
                  "py-2 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all min-h-[38px] text-center cursor-pointer",
                  residenceMode === option.id
                    ? "bg-[#45B0A8] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {residenceMode === option.id && <Check size={11} className="shrink-0" />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* If different country: reveal residence country */}
        {residenceMode === 'different_country' && (
          <CountrySearchSelect
            label={t('profile.residenceCountryLabel', 'País de Residencia')}
            value={residenceCountry}
            onChange={(code) => {
              setResidenceCountry(code);
              // Keep the base city anchored to the country it actually belongs to.
              setBaseCity((prev) => (prev && prev.countryCode !== code ? null : prev));
            }}
            placeholder={t('common:selectCountry', 'Seleccionar país...')}
          />
        )}

        {/* If not same_city: reveal base city */}
        {residenceMode !== 'same_city' && (
          <CityAutocompleteInput
            label={t('profile.baseCityLabel', 'Ciudad Base actual (opcional)')}
            value={baseCity}
            countryCode={residenceMode === 'different_country' ? residenceCountry : birthCountry}
            onChange={(city) =>
              setBaseCity(
                normalizeCity(
                  city,
                  residenceMode === 'different_country' ? residenceCountry : birthCountry
                )
              )
            }
            placeholder={t('profile.baseCityPlaceholder', 'Ej: Madrid, Barcelona...')}
          />
        )}
      </div>

      <Motion.button 
        type="submit" 
        className="mt-1 py-3.5 bg-atomicTangerine text-white font-black rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
        disabled={loading} 
        whileTap={{ scale: 0.98 }}
      >
        <Save size={18} /> {loading ? t('profile.saving') : t('profile.save')}
      </Motion.button>
    </form>
  );

  // Mobile: BottomSheet
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={11000} disableClose={loading}>
        <div className="px-5 py-1 pb-4 max-h-[85dvh] overflow-y-auto">
          <h3 className="text-charcoalBlue font-black text-xl mb-4 font-heading">{t('profile.editTitle')}</h3>
          {formContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop: modal centrado
  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[11000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <Motion.div
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-[30px] w-[450px] max-w-[95%] max-h-[90dvh] overflow-y-auto shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="m-0 text-charcoalBlue font-black font-heading">{t('profile.editTitle')}</h3>
            <Motion.button 
              onClick={onClose} 
              className="w-11 h-11 rounded-full flex items-center justify-center border-none bg-none cursor-pointer hover:bg-slate-100 transition-colors"
              aria-label={t('profile.close')} 
              whileTap={{ scale: 0.98 }}
            > 
              <X size={20}/> 
            </Motion.button>
          </div>
          {formContent}
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default ProfileModal;
