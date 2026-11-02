import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X, CheckCircle2 } from 'lucide-react';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';
import { getCountryCentroid, normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { CountryFlag } from './CountryFlag';
import { cn } from '@shared/lib/utils/cn';

export const CityAutocompleteInput = ({
  value,
  onChange,
  countryCode = '',
  placeholder = 'Escribe tu ciudad...',
  label,
  className = '',
}) => {
  const { t, i18n } = useTranslation('common');
  const [query, setQuery] = useState(value?.name || '');
  const [lastExternalName, setLastExternalName] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState({ forQuery: null, items: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const externalName = value?.name || '';

  // Adjust the typed text when the parent value changes (derived-state pattern)
  if (externalName !== lastExternalName) {
    setLastExternalName(externalName);
    setQuery(externalName);
  }

  const trimmedQuery = (query || '').trim();
  const normalizedCountry = (countryCode || '').toUpperCase();
  const isSelectedQuery = Boolean(externalName) && trimmedQuery === externalName.trim();

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setIsOpen(false);
      inputRef.current?.blur?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Keep the suggestion list inside the modal viewport (scrollable parents clip it).
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (container && typeof container.scrollIntoView === 'function') {
      container.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isOpen]);

  // Debounced Mapbox geocoding (fires from 2 characters)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmedQuery.length < 2 || isSelectedQuery) return undefined;

    debounceRef.current = setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);

      try {
        const lang = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
        const res = await fetchGeocoding({
          query: trimmedQuery,
          language: lang,
          types: 'place,locality',
          minLength: 2,
          country: normalizedCountry || undefined,
        });

        if (requestIdRef.current !== requestId) return;

        const items = (res?.features || []).map((f) => ({
          name: f.text || f.place_name,
          fullName: f.place_name,
          coordinates: f.center, // [lng, lat]
          countryCode: (normalizeCountryCode(
            f.context?.find((c) => c.id?.startsWith('country'))?.short_code
          ) || normalizedCountry || '').toUpperCase(),
        }));

        setSuggestions({ forQuery: trimmedQuery, items });
        setIsOpen(items.length > 0);
      } catch {
        if (requestIdRef.current !== requestId) return;
        setSuggestions({ forQuery: trimmedQuery, items: [] });
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery, isSelectedQuery, normalizedCountry, i18n.language, i18n.resolvedLanguage]);

  const visibleSuggestions = suggestions.forQuery === trimmedQuery ? suggestions.items : [];

  const handleChangeText = (nextValue) => {
    setQuery(nextValue);
    setIsLoading(false);
    if (nextValue.trim().length < 2) setSuggestions({ forQuery: null, items: [] });
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setSuggestions({ forQuery: null, items: [] });
    setIsOpen(false);
    onChange?.({
      name: item.name,
      coordinates: item.coordinates,
      countryCode: item.countryCode || normalizedCountry,
    });
  };

  const handleBlur = () => {
    if (!trimmedQuery || value?.name === trimmedQuery) return;
    const fallback = getCountryCentroid(normalizedCountry) || [0, 20];
    onChange?.({
      name: trimmedQuery,
      coordinates: fallback,
      countryCode: normalizedCountry || 'ES',
    });
  };

  const hasLinkedCoords = Boolean(value?.coordinates && value.name === trimmedQuery);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1 w-full", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
            {label}
          </label>
          {hasLinkedCoords && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#45B0A8] font-heading">
              <CheckCircle2 size={12} />
              <span>{t('common:coordsLinked', 'Ubicación vinculada')}</span>
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <MapPin size={16} className={cn("absolute left-3.5 pointer-events-none transition-colors", hasLinkedCoords ? "text-[#45B0A8]" : "text-slate-400")} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChangeText(e.target.value)}
          onFocus={() => { if (visibleSuggestions.length > 0) setIsOpen(true); }}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm",
            "focus:border-[#45B0A8] focus:ring-2 focus:ring-[#45B0A8]/20 outline-none transition-all min-h-[44px]",
            hasLinkedCoords && "border-[#45B0A8]/50 bg-[#45B0A8]/5"
          )}
        />
        {isLoading && (
          <span className="absolute right-9 h-3.5 w-3.5 rounded-full border-2 border-slate-200 border-t-[#45B0A8] animate-spin" aria-hidden="true" />
        )}
        {query && (
          <button
            type="button"
            onClick={() => { handleChangeText(''); setIsOpen(false); onChange?.(null); }}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && visibleSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[200px] overflow-y-auto overscroll-contain touch-pan-y custom-scroll p-1">
          {visibleSuggestions.map((item, idx) => (
            <button
              key={`${item.fullName}-${idx}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
            >
              <MapPin size={13} className="text-[#FF6B35] shrink-0" />
              <div className="flex-1 min-w-0 truncate">
                <span className="font-bold text-slate-800">{item.name}</span>
                {item.fullName && item.fullName !== item.name && (
                  <span className="text-slate-400 ml-1.5 text-[11px]">{item.fullName}</span>
                )}
              </div>
              {item.countryCode && <CountryFlag code={item.countryCode} size="xs" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteInput;
