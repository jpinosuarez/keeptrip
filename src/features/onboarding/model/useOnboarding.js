import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryCentroid } from '@shared/lib/utils/countryUtils';

export const useOnboarding = ({ onClose, onComplete } = {}) => {
  const { i18n } = useTranslation();
  const { userProfile, user, updateUserProfile } = useAuth() || {};

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || user?.displayName || ''
  );
  const [language, setLanguage] = useState(i18n.language || 'es');
  const [birthCountry, setBirthCountry] = useState(
    userProfile?.birthCountry || 'ES'
  );
  const [birthCity, setBirthCity] = useState(userProfile?.birthCity || null);
  const [birthCityQuery, setBirthCityQuery] = useState(userProfile?.birthCity?.name || '');

  // Residence mode: 'same_city' | 'same_country' | 'different_country'
  const [residenceMode, setResidenceMode] = useState(() => {
    if (userProfile?.residenceCountry && userProfile.birthCountry && userProfile.residenceCountry !== userProfile.birthCountry) {
      return 'different_country';
    }
    if (userProfile?.baseCity && userProfile?.birthCity && userProfile.baseCity.name !== userProfile.birthCity.name) {
      return 'same_country';
    }
    return 'same_city';
  });

  const [residenceCountry, setResidenceCountry] = useState(
    userProfile?.residenceCountry || userProfile?.birthCountry || 'ES'
  );
  const [baseCity, setBaseCity] = useState(userProfile?.baseCity || null);
  const [baseCityQuery, setBaseCityQuery] = useState(userProfile?.baseCity?.name || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backward-compatible sameAsBirth getter and setter
  const sameAsBirth = residenceMode === 'same_city' || residenceMode === 'same_country';
  const setSameAsBirth = useCallback((val) => {
    setResidenceMode(val ? 'same_city' : 'different_country');
  }, []);

  // Keep residenceCountry aligned with birthCountry while in same_city / same_country mode.
  // Render-time adjustment (React's recommended pattern) instead of a cascading effect.
  if (residenceMode !== 'different_country' && residenceCountry !== birthCountry) {
    setResidenceCountry(birthCountry);
  }

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const selectBirthCitySuggestion = useCallback((suggestion) => {
    setBirthCity(suggestion);
    setBirthCityQuery(suggestion.name);
  }, []);

  const selectBaseCitySuggestion = useCallback((suggestion) => {
    setBaseCity(suggestion);
    setBaseCityQuery(suggestion.name);
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('keeptrip_onboarding_skipped', 'true');
      }
    } catch {
      // Ignore sessionStorage errors
    }
    if (onClose) onClose();
  }, [onClose]);

  const completeOnboarding = useCallback(async ({ navigateToNew = false } = {}) => {
    setIsSubmitting(true);

    const fallbackBirthCoords = getCountryCentroid(birthCountry) || [0, 20];
    const finalBirthCity = birthCity || (birthCityQuery.trim() ? {
      name: birthCityQuery.trim(),
      coordinates: fallbackBirthCoords,
      countryCode: birthCountry,
    } : null);

    let finalResidenceCountry = birthCountry;
    let finalBaseCity = null;

    if (residenceMode === 'same_city') {
      finalResidenceCountry = birthCountry;
      finalBaseCity = finalBirthCity;
    } else if (residenceMode === 'same_country') {
      finalResidenceCountry = birthCountry;
      const fallbackBaseCoords = getCountryCentroid(birthCountry) || [0, 20];
      finalBaseCity = baseCity || (baseCityQuery.trim() ? {
        name: baseCityQuery.trim(),
        coordinates: fallbackBaseCoords,
        countryCode: birthCountry,
      } : null);
    } else {
      finalResidenceCountry = residenceCountry || birthCountry;
      const fallbackBaseCoords = getCountryCentroid(finalResidenceCountry) || [0, 20];
      finalBaseCity = baseCity || (baseCityQuery.trim() ? {
        name: baseCityQuery.trim(),
        coordinates: fallbackBaseCoords,
        countryCode: finalResidenceCountry,
      } : null);
    }

    const payload = {
      displayName: displayName.trim() || userProfile?.displayName || 'Explorer',
      birthCountry: birthCountry || null,
      birthCity: finalBirthCity || null,
      residenceCountry: finalResidenceCountry || null,
      baseCity: finalBaseCity || null,
      hasCompletedOnboarding: true,
    };

    if (updateUserProfile) {
      await updateUserProfile(payload);
    }

    setIsSubmitting(false);

    if (onComplete) {
      onComplete({ navigateToNew, payload });
    } else if (onClose) {
      onClose();
    }
  }, [
    birthCountry,
    birthCity,
    birthCityQuery,
    residenceMode,
    residenceCountry,
    baseCity,
    baseCityQuery,
    displayName,
    userProfile,
    updateUserProfile,
    onComplete,
    onClose,
  ]);

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    displayName,
    setDisplayName,
    language,
    handleLanguageChange,
    birthCountry,
    setBirthCountry,
    birthCity,
    setBirthCity,
    birthCityQuery,
    setBirthCityQuery,
    selectBirthCitySuggestion,
    residenceMode,
    setResidenceMode,
    sameAsBirth,
    setSameAsBirth,
    residenceCountry,
    setResidenceCountry,
    baseCity,
    setBaseCity,
    baseCityQuery,
    setBaseCityQuery,
    selectBaseCitySuggestion,
    isSubmitting,
    skipOnboarding,
    completeOnboarding,
    // Alias kept for backwards compatibility with any existing components
    setCityQuery: setBaseCityQuery,
  };
};

export default useOnboarding;
