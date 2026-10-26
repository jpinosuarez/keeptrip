import React, { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Save, Heart, Home, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { COUNTRIES_DATA, getCountryCentroid, getCountryFlagEmoji } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

import BottomSheet from '@shared/ui/components/BottomSheet';

function getInitials(name) {
  if (!name) return '';
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

const ProfileModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation('common');
  const { user, userProfile, updateUserProfile } = useAuth() || {};
  const { isMobile } = useWindowSize(768);

  const [name, setName] = useState(userProfile?.displayName || user?.displayName || '');
  const [photo, setPhoto] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [birthCountry, setBirthCountry] = useState(userProfile?.birthCountry || 'ES');
  const [residenceCountry, setResidenceCountry] = useState(userProfile?.residenceCountry || 'ES');
  const [baseCityName, setBaseCityName] = useState(userProfile?.baseCity?.name || '');
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const sortedCountries = useMemo(() => {
    return [...COUNTRIES_DATA].map((c) => ({
      ...c,
      localizedName: getLocalizedCountryName(c.code, i18n.language) || c.name,
    })).sort((a, b) => a.localizedName.localeCompare(b.localizedName));
  }, [i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fallbackCoords = getCountryCentroid(residenceCountry) || [0, 20];
    const finalBaseCity = baseCityName.trim()
      ? {
          name: baseCityName.trim(),
          coordinates:
            baseCityName.trim() === userProfile?.baseCity?.name && userProfile?.baseCity?.coordinates
              ? userProfile.baseCity.coordinates
              : fallbackCoords,
          countryCode: residenceCountry,
        }
      : null;

    if (updateUserProfile) {
      await updateUserProfile({
        displayName: name,
        photoURL: photo,
        birthCountry,
        residenceCountry,
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

      {/* Tus Raíces y Tu Base */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
        <div className="text-xs font-black text-charcoalBlue uppercase tracking-wider font-heading">
          {t('profile.rootsAndBaseTitle', 'Tus Raíces y Tu Base')}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.75rem] font-bold text-slate-600 flex items-center gap-1">
            <Heart size={12} className="text-atomicTangerine" />
            {t('profile.birthCountryLabel', 'País Natal (Raíces)')}
          </label>
          <select
            className="w-full p-2.5 rounded-lg border border-border bg-white text-sm font-medium outline-none min-h-[44px]"
            value={birthCountry}
            onChange={(e) => setBirthCountry(e.target.value)}
          >
            {sortedCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {getCountryFlagEmoji(c.code)} {c.localizedName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.75rem] font-bold text-slate-600 flex items-center gap-1">
            <Home size={12} className="text-[#45B0A8]" />
            {t('profile.residenceCountryLabel', 'País de Residencia (Base)')}
          </label>
          <select
            className="w-full p-2.5 rounded-lg border border-border bg-white text-sm font-medium outline-none min-h-[44px]"
            value={residenceCountry}
            onChange={(e) => setResidenceCountry(e.target.value)}
          >
            {sortedCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {getCountryFlagEmoji(c.code)} {c.localizedName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.75rem] font-bold text-slate-600 flex items-center gap-1">
            <MapPin size={12} className="text-atomicTangerine" />
            {t('profile.baseCityLabel', 'Ciudad Base (opcional)')}
          </label>
          <input
            className="w-full p-2.5 rounded-lg border border-border bg-white text-sm font-medium outline-none min-h-[44px]"
            value={baseCityName}
            onChange={(e) => setBaseCityName(e.target.value)}
            placeholder={t('profile.baseCityPlaceholder', 'Ej: Buenos Aires, Madrid...')}
          />
        </div>
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
