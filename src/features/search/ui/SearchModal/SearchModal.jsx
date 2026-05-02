import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Plus, TrendingUp, Globe } from "lucide-react";
import { cn } from '@shared/lib/utils/cn';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useDebounce } from '../../model/useDebounce';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';

/**
 * Static popular destinations — names resolved via i18n t() hook.
 * Only codes, coords, and structural data are stored here.
 */
const POPULAR_DESTINATIONS = [
  { key: "japan", code: "JP" },
  { key: "italy", code: "IT" },
  { key: "france", code: "FR" },
  { key: "mexico", code: "MX" },
  { key: "argentina", code: "AR" },
  { key: "newYork", code: "US", isCity: true, coords: [-74.006, 40.712] },
];

const SearchModal = ({
  isOpen,
  onClose,
  query,
  setQuery,
  selectPlace,
  onSearchError,
  onNoResults
}) => {
  const { t, i18n } = useTranslation(['search', 'common']);
  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isSearchPaused = operationalLevel >= 1;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const lastNoResult = useRef("");
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      abortControllerRef.current?.abort();
      setResults([]);
      lastNoResult.current = "";
    }
  }, [isOpen]);

  useDebounce(query, 300, setDebouncedQuery);

  useEffect(() => {
    if (isSearchPaused) {
      abortControllerRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    if (!debouncedQuery) {
      abortControllerRef.current?.abort();
      setResults([]);
      lastNoResult.current = "";
      return;
    }
    if (debouncedQuery.length < 3) return;
    setLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      try {
        const data = await fetchGeocoding({
          query: debouncedQuery,
          language: i18n.language,
          signal: controller.signal,
        });
        
        if (controller.signal.aborted) return;
        const processed = (data.features || []).map((feat) => {
          const countryContext =
            feat.context?.find((c) => c.id.startsWith("country")) ||
            (feat.place_type.includes("country") ? feat : null);
          const countryCode = (
            countryContext?.short_code ||
            countryContext?.properties?.short_code ||
            feat.properties?.short_code ||
            feat.short_code
          )?.toUpperCase();
          return {
            id: feat.id,
            name: feat.text,
            fullName: feat.place_name,
            type: feat.place_type[0],
            coordinates: feat.center,
            countryCode,
            countryName: countryContext?.text || (feat.place_type.includes("country") ? feat.text : "")
          };
        });
        setResults(processed);
        if (
          processed.length === 0 &&
          debouncedQuery.trim().length >= 3 &&
          lastNoResult.current !== debouncedQuery.trim().toLowerCase()
        ) {
          lastNoResult.current = debouncedQuery.trim().toLowerCase();
          onNoResults?.(debouncedQuery.trim());
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        onSearchError?.();
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery, isSearchPaused, onSearchError, onNoResults, i18n.language]);

  const handleSelectPopular = (dest) => {
    const name = t(`search:popular.${dest.key}`);
    if (dest.isCity) {
      selectPlace({
        isCountry: false,
        name,
        coordinates: dest.coords,
        countryCode: dest.code,
        countryName: t('search:popular.unitedStates'),
      });
      return;
    }
    selectPlace({
      isCountry: true,
      name,
      code: dest.code,
      coordinates: [0, 0]
    });
  };

  const handleSelect = (item) => {
    selectPlace({
      isCountry: item.type === "country",
      name: item.name,
      coordinates: item.coordinates,
      countryName: item.countryName,
      countryCode: item.countryCode,
      code: item.countryCode
    });
  };

  const handleResultKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(item);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-sm flex justify-center items-stretch md:items-start md:pt-[100px] md:p-4"
        onClick={onClose}
      >
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white w-full max-w-full overflow-hidden shadow-2xl flex flex-col h-screen md:h-auto md:max-h-[80vh] md:w-[min(500px,100%)] md:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 flex justify-between items-center">
            <h3 className="m-0 text-[1.1rem] text-charcoalBlue font-black font-heading">{t('search:title')}</h3>
            <button type="button" onClick={onClose} className="w-11 h-11 p-0 flex items-center justify-center border-none bg-none cursor-pointer text-charcoalBlue" aria-label={t('search:close')}>
              <X size={20} />
            </button>
          </div>

          <div className="mx-5 mb-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 focus-within:border-atomicTangerine focus-within:ring-1 focus-within:ring-atomicTangerine transition-all">
            <Search size={18} className="text-atomicTangerine shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              placeholder={t('search:inputPlaceholder')}
              className="w-full min-h-[44px] bg-transparent border-none outline-none text-base font-medium text-charcoalBlue placeholder:text-text-secondary/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('search:inputAria')}
              disabled={isSearchPaused}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="w-11 h-11 p-0 flex items-center justify-center border-none bg-none cursor-pointer text-text-secondary" aria-label={t('search:clear')}>
                <X size={18} />
              </button>
            )}
          </div>

          <div className="custom-scroll max-h-none md:max-h-[400px] overflow-y-auto flex-1">
            {isSearchPaused && (
              <div className="mx-5 my-4 p-3.5 rounded-xl border border-slate-200 bg-atomicTangerine/10 text-charcoalBlue text-[0.9rem] font-semibold text-center">
                {t(
                  'search:pausedMessage',
                  'Search temporarily paused while we stabilize map services. Your saved trips remain available.'
                )}
              </div>
            )}

            {/* Popular destinations — no query */}
            {!query && (
              <div className="p-5">
                <p className="text-[0.75rem] font-bold text-mutedTeal mb-3 flex items-center gap-1.5 tracking-wider uppercase">
                  <TrendingUp size={14} /> {t('search:popularTitle')}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <button key={dest.key} onClick={() => handleSelectPopular(dest)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-full text-[0.9rem] font-bold text-charcoalBlue hover:bg-slate-50 transition-all">
                      <img
                        src={`https://flagcdn.com/w32/${dest.code.toLowerCase()}.png`}
                        alt=""
                        className="w-6 h-6 object-cover rounded-full shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {t(`search:popular.${dest.key}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Minimum characters hint */}
            {query && query.length < 3 && !loading && !isSearchPaused && (
              <div className="text-center p-6 text-text-secondary text-[0.88rem] font-medium">
                {t('search:minChars')}
              </div>
            )}

            {/* Skeleton loading state */}
            {loading && !isSearchPaused && (
              <div className="p-5 flex flex-col gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-[52px] rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && query && query.length >= 3 && !loading && !isSearchPaused && (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-text-secondary">
                <Search size={44} className="text-mutedTeal" />
                <div className="text-base font-semibold text-center text-mutedTeal">{t('search:noResults', { term: query })}</div>
                <div className="text-[0.9rem] text-text-secondary">{t('search:emptyHelp')}</div>
              </div>
            )}

            {/* Search results */}
            {results.map((item, itemIdx) => {
              const flagUrl = getFlagUrl(item.countryCode);
              return (
                <div
                  key={item.id || `search-result-${itemIdx}`}
                  role="button"
                  tabIndex={0}
                  className="relative flex items-center gap-3.5 px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors group"
                  onClick={() => handleSelect(item)}
                  onKeyDown={(e) => handleResultKeyDown(e, item)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    item.type === "country" ? "bg-atomicTangerine/15 text-atomicTangerine" : "bg-mutedTeal/15 text-mutedTeal"
                  )}> 
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt=""
                        className="w-[28px] h-[28px] object-cover rounded-full"
                      />
                    ) : item.type === "country" ? (
                      <Globe size={18} />
                    ) : (
                      <MapPin size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="block font-bold text-charcoalBlue">{item.name}</span>
                    <span className="block text-[0.8rem] text-text-secondary">{item.type === "country" ? t('search:country') : item.countryName}</span>
                  </div>
                  <div
                    className="absolute right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-atomicTangerine text-atomicTangerine text-[0.75rem] font-bold transition-all"
                    role="button"
                    aria-label={t('common:add')}
                  >
                    <Plus size={14} /> {t('common:add')}
                  </div>
                </div>
              );
            })}
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default SearchModal;

