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
  const [birthCity, setBirthCity] = useState(userProfile?.birthCity || null);
  const [birthCityQuery, setBirthCityQuery] = useState(userProfile?.birthCity?.name || '');
  const [birthCitySuggestions, setBirthCitySuggestions] = useState([]);
  const [isLoadingBirthCities, setIsLoadingBirthCities] = useState(false);

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
  const [baseCitySuggestions, setBaseCitySuggestions] = useState([]);
  const [isLoadingBaseCities, setIsLoadingBaseCities] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceBirthTimerRef = useRef(null);
  const debounceBaseTimerRef = useRef(null);

  // Backward-compatible sameAsBirth getter and setter
  const sameAsBirth = residenceMode === 'same_city' || residenceMode === 'same_country';
  const setSameAsBirth = useCallback((val) => {
    setResidenceMode(val ? 'same_city' : 'different_country');
  }, []);

  // When birthCountry changes, if in same_city or same_country, sync residenceCountry
  useEffect(() => {
    if (residenceMode !== 'different_country') {
      setResidenceCountry(birthCountry);
    }
  }, [residenceMode, birthCountry]);

  // Debounced geocoding search for birth city
  useEffect(() => {
    if (!birthCityQuery || birthCityQuery.trim().length < 3) {
      setBirthCitySuggestions([]);
      return;
    }

    if (debounceBirthTimerRef.current) {
      clearTimeout(debounceBirthTimerRef.current);
    }

    debounceBirthTimerRef.current = setTimeout(async () => {
      setIsLoadingBirthCities(true);
      try {
        const res = await fetchGeocoding({
          query: birthCityQuery,
          language: i18n.language || 'es',
          types: 'place,locality',
        });
        const features = res?.features || [];
        const formatted = features.map((f) => {
          let cCode = birthCountry;
          const countryContext = f.context?.find((ctx) => ctx.id?.startsWith('country'));
          if (countryContext?.short_code) {
            cCode = normalizeCountryCode(countryContext.short_code) || birthCountry;
          }
          return {
            name: f.text || f.place_name,
            fullName: f.place_name,
            coordinates: f.center, // [lng, lat]
            countryCode: cCode,
          };
        });
        setBirthCitySuggestions(formatted);
      } catch (err) {
        console.warn('[useOnboarding] Birth city autocomplete fallback:', err?.message || err);
        setBirthCitySuggestions([]);
      } finally {
        setIsLoadingBirthCities(false);
      }
    }, 300);

    return () => {
      if (debounceBirthTimerRef.current) {
        clearTimeout(debounceBirthTimerRef.current);
      }
    };
  }, [birthCityQuery, birthCountry, i18n.language]);

  // Debounced geocoding search for base city
  useEffect(() => {
    if (!baseCityQuery || baseCityQuery.trim().length < 3) {
      setBaseCitySuggestions([]);
      return;
    }

    if (debounceBaseTimerRef.current) {
      clearTimeout(debounceBaseTimerRef.current);
    }

    debounceBaseTimerRef.current = setTimeout(async () => {
      setIsLoadingBaseCities(true);
      try {
        const targetCountry = residenceMode === 'different_country' ? residenceCountry : birthCountry;
        const res = await fetchGeocoding({
          query: baseCityQuery,
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
        setBaseCitySuggestions(formatted);
      } catch (err) {
        console.warn('[useOnboarding] Base city autocomplete fallback:', err?.message || err);
        setBaseCitySuggestions([]);
      } finally {
        setIsLoadingBaseCities(false);
      }
    }, 300);

    return () => {
      if (debounceBaseTimerRef.current) {
        clearTimeout(debounceBaseTimerRef.current);
      }
    };
  }, [baseCityQuery, residenceMode, residenceCountry, birthCountry, i18n.language]);

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const selectBirthCitySuggestion = useCallback((suggestion) => {
    setBirthCity(suggestion);
    setBirthCityQuery(suggestion.name);
    setBirthCitySuggestions([]);
  }, []);

  const selectBaseCitySuggestion = useCallback((suggestion) => {
    setBaseCity(suggestion);
    setBaseCityQuery(suggestion.name);
    setBaseCitySuggestions([]);
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
    birthCitySuggestions,
    isLoadingBirthCities,
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
    baseCitySuggestions,
    isLoadingBaseCities,
    selectBaseCitySuggestion,
    isSubmitting,
    skipOnboarding,
    completeOnboarding,
    // Aliases for backwards compatibility with any existing components
    cityQuery: baseCityQuery,
    setCityQuery: setBaseCityQuery,
    citySuggestions: baseCitySuggestions,
    isLoadingCities: isLoadingBaseCities,
    selectCitySuggestion: selectBaseCitySuggestion,
  };
};

export default useOnboarding;
