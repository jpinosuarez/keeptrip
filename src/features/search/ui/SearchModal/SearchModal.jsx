import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Plus, TrendingUp, Globe } from "lucide-react";
import { COLORS, RADIUS } from '@shared/config';
import { styles } from "./SearchModal.styles";
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useDebounce } from '../../model/useDebounce';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
  const { isMobile } = useWindowSize(768);
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
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedQuery)}.json?types=country,place,locality&language=${i18n.language}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Mapbox geocoding failed with status ${res.status}`);
        }
        const data = await res.json();
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
  }, [debouncedQuery, onSearchError, onNoResults, i18n.language]);

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
        style={styles.modalOverlay(isMobile)}
        onClick={onClose}
      >
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          style={styles.modalContent(isMobile)}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h3 style={styles.title}>{t('search:title')}</h3>
            <button type="button" onClick={onClose} style={{ ...styles.clearButton, background: 'none' }} aria-label={t('search:close')}>
              <X size={20} color={COLORS.charcoalBlue} />
            </button>
          </div>

          <div style={styles.searchBox}>
            <Search size={18} color={COLORS.atomicTangerine} />
            <input
              ref={inputRef}
              autoFocus
              placeholder={t('search:inputPlaceholder')}
              style={styles.inputStyle}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('search:inputAria')}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} style={styles.clearButton} aria-label={t('search:clear')}>
                <X size={18} />
              </button>
            )}
          </div>

          <div style={styles.listaContainer(isMobile)} className="custom-scroll">
            {/* Popular destinations — no query */}
            {!query && (
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: "700", color: COLORS.mutedTeal, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                  <TrendingUp size={14} /> {t('search:popularTitle')}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <button key={dest.key} onClick={() => handleSelectPopular(dest)} style={styles.tagBtn}>
                      <img
                        src={`https://flagcdn.com/w32/${dest.code.toLowerCase()}.png`}
                        alt=""
                        style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: RADIUS.full, verticalAlign: 'middle', flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {t(`search:popular.${dest.key}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Minimum characters hint */}
            {query && query.length < 3 && !loading && (
              <div style={{
                textAlign: 'center',
                padding: '24px 20px',
                color: COLORS.textSecondary,
                fontSize: '0.88rem',
                fontWeight: 500,
              }}>
                {t('search:minChars')}
              </div>
            )}

            {/* Skeleton loading state */}
            {loading && (
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      height: '52px',
                      borderRadius: RADIUS.md,
                      background: `linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%)`,
                      backgroundSize: '200% 100%',
                      animation: `shimmer 1.5s ease infinite`,
                    }}
                  />
                ))}
                <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && query && query.length >= 3 && !loading && (
              <div style={styles.emptyState}>
                <Search size={44} style={styles.emptyIcon} />
                <div style={styles.emptyText}>{t('search:noResults', { term: query })}</div>
                <div style={{ fontSize: '0.9rem', color: COLORS.textSecondary }}>{t('search:emptyHelp')}</div>
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
                  style={styles.resultItem}
                  onClick={() => handleSelect(item)}
                  onKeyDown={(e) => handleResultKeyDown(e, item)}
                  className="result-item-hover"
                >
                  <div style={styles.iconBox(item.type === "country")}> 
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt=""
                        style={{
                          width: '28px',
                          height: '28px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                        }}
                      />
                    ) : item.type === "country" ? (
                      <Globe size={18} />
                    ) : (
                      <MapPin size={18} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.countryName}>{item.name}</span>
                    <span style={styles.subtext}>{item.type === "country" ? t('search:country') : item.countryName}</span>
                  </div>
                  <div className="add-label" style={styles.addLabel}>
                    <Plus size={14} /> {t('search:add')}
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
