import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthContext';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';
import { getCountryCentroid, normalizeCountryCode } from '@shared/lib/utils/countryUtils';

export const useOnboarding = ({ isOpen = true, onClose, onComplete } = {}) => {
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
  const [sameAsBirth, setSameAsBirth] = useState(
    userProfile?.residenceCountry
      ? userProfile.residenceCountry === userProfile.birthCountry
      : true
  );
  const [residenceCountry, setResidenceCountry] = useState(
    userProfile?.residenceCountry || userProfile?.birthCountry || 'ES'
  );
  const [baseCity, setBaseCity] = useState(userProfile?.baseCity || null);
  const [cityQuery, setCityQuery] = useState(userProfile?.baseCity?.name || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef(null);

  // Sync effective residence when sameAsBirth is true
  useEffect(() => {
    if (sameAsBirth && birthCountry) {
      setResidenceCountry(birthCountry);
    }
  }, [sameAsBirth, birthCountry]);

  // Debounced geocoding search for base city
  useEffect(() => {
    if (!cityQuery || cityQuery.trim().length < 3) {
      setCitySuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingCities(true);
      try {
        const targetCountry = sameAsBirth ? birthCountry : residenceCountry;
        const res = await fetchGeocoding({
          query: cityQuery,
          language: i18n.language || 'es',
          types: 'place,locality',
        });
        const features = res?.features || [];
        const formatted = features.map((f) => {
          let cCode = targetCountry;
          const countryContext = f.context?.find((ctx) => ctx.id?.startsWith('country'));
          if (countryContext?.short_code) {
            cCode = normalizeCountryCode(countryContext.short_code) || targetCountry;
          }
          return {
            name: f.text || f.place_name,
            fullName: f.place_name,
            coordinates: f.center, // [lng, lat]
            countryCode: cCode,
          };
        });
        setCitySuggestions(formatted);
      } catch (err) {
        console.warn('[useOnboarding] City autocomplete fallback:', err?.message || err);
        setCitySuggestions([]);
      } finally {
        setIsLoadingCities(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cityQuery, sameAsBirth, birthCountry, residenceCountry, i18n.language]);

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const selectCitySuggestion = useCallback((suggestion) => {
    setBaseCity(suggestion);
    setCityQuery(suggestion.name);
    setCitySuggestions([]);
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, 3));
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
    const finalResidence = sameAsBirth ? birthCountry : (residenceCountry || birthCountry);

    let finalBaseCity = baseCity;
    if (!finalBaseCity && cityQuery.trim()) {
      const fallbackCoords = getCountryCentroid(finalResidence) || [0, 20];
      finalBaseCity = {
        name: cityQuery.trim(),
        coordinates: fallbackCoords,
        countryCode: finalResidence,
      };
    }

    const payload = {
      displayName: displayName.trim() || userProfile?.displayName || 'Explorer',
      birthCountry: birthCountry || null,
      residenceCountry: finalResidence || null,
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
    sameAsBirth,
    birthCountry,
    residenceCountry,
    baseCity,
    cityQuery,
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
    sameAsBirth,
    setSameAsBirth,
    residenceCountry,
    setResidenceCountry,
    baseCity,
    setBaseCity,
    cityQuery,
    setCityQuery,
    citySuggestions,
    isLoadingCities,
    selectCitySuggestion,
    isSubmitting,
    skipOnboarding,
    completeOnboarding,
  };
};

export default useOnboarding;
