import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, X, HelpCircle } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, GLASS, FONTS, TRANSITIONS } from '@shared/config';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useToast } from '@app/providers/ToastContext';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useDebounce } from '../../model/useDebounce';
import { useSearchHistory } from '../../model/useSearchHistory';
import RichResultCard from './RichResultCard';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';

const SearchPalette = ({ 
  isOpen, 
  onClose, 
  onSelectPlace, 
  onSelectTrip, 
  allTrips = [] 
}) => {
  const { t, i18n } = useTranslation(['search', 'common']);
  const { pushToast } = useToast();
  const { isMobile } = useWindowSize(768);
  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isSearchPaused = operationalLevel >= 1;
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastMapboxErrorRef = useRef(0);
  
  const [query, setQuery] = useState('');
  const [mapboxResults, setMapboxResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  
  // Lock body scroll on mobile when search overlay is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Debounced query for Mapbox API calls
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useDebounce(query, 300, (debouncedVal) => {
    setDebouncedQuery(debouncedVal);
  });

  const { localResults } = useSearchHistory(allTrips, query, i18n.language, t);

  // Fetch Mapbox results when debounced query changes
  useEffect(() => {
    if (isSearchPaused) {
      abortControllerRef.current?.abort();
      setLoading(false);
      setMapboxResults([]);
      return;
    }

    // Only run searches once the user has typed at least 3 characters.
    // This prevents the UI from flashing a "no results" state on short queries.
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setMapboxResults([]);
      return;
    }

    setLoading(true);

    // Cancel any previous request to avoid race conditions
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

        const processed = (data.features || []).map((feat) => {
          const countryContext =
            feat.context?.find((c) => c.id.startsWith('country')) ||
            (feat.place_type.includes('country') ? feat : null);
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
            countryName: getLocalizedCountryName(countryCode, i18n.language, t) || countryContext?.text || '',
            _mapbox: true,
          };
        });

        setMapboxResults(processed);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Mapbox search error:', error);
        const now = Date.now();
        if (now - lastMapboxErrorRef.current > 6000) {
          pushToast({
            type: 'warning',
            message: t('searchUnavailable', {
              ns: 'common',
              defaultValue: 'No pudimos buscar lugares en este momento. Intenta de nuevo en unos segundos.'
            })
          });
          lastMapboxErrorRef.current = now;
        }
        setMapboxResults([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, i18n.language, isSearchPaused, pushToast, t]);

  // Combine and group results
  const allResults = useMemo(() => {
    const results = [];

    // Local trips first
    if (localResults.length > 0) {
      results.push(...localResults.map((trip) => ({ ...trip, _type: 'trip', _tripId: trip.id })));
    }

    // Then Mapbox places
    if (mapboxResults.length > 0) {
      results.push(...mapboxResults.map((place) => ({ ...place, _type: 'place' })));
    }

    return results;
  }, [localResults, mapboxResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(allResults.length > 0 ? 0 : -1);
  }, [allResults.length]);

  const handleSelectResult = useCallback(
    (result) => {
      if (result._type === 'trip') {
        onSelectTrip?.(result.id);
      } else {
        onSelectPlace?.({
          isCountry: result.type === 'country',
          name: result.name,
          coordinates: result.coordinates,
          countryName: result.countryName,
          countryCode: result.countryCode,
          code: result.countryCode,
        });
      }
      setQuery('');
      onClose();
    },
    [onSelectPlace, onSelectTrip, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        return;
      }

      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectResult(allResults[selectedIndex]);
        return;
      }

      if (e.key === '?' && !showHelp) {
        e.preventDefault();
        setShowHelp(true);
      }
    },
    [allResults, selectedIndex, onClose, showHelp, handleSelectResult]
  );

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const showQueryTooShort = !isSearchPaused && trimmedQuery.length > 0 && trimmedQuery.length < 3;
  const showNoResults = !isSearchPaused && trimmedQuery.length >= 3 && !loading && allResults.length === 0;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...(isMobile ? { backgroundColor: '#F8FAFC' } : GLASS.overlay),
      zIndex: 10001,
      display: 'flex',
      alignItems: isMobile ? 'stretch' : 'flex-start',
      justifyContent: 'center',
      paddingTop: isMobile ? '0' : '80px',
      backdropFilter: isMobile ? 'none' : 'blur(8px)',
    },
    container: {
      width: isMobile ? '100%' : 'min(600px, 90vw)',
      maxHeight: isMobile ? '100%' : '70vh',
      height: isMobile ? '100%' : undefined,
      backgroundColor: isMobile ? 'transparent' : COLORS.surface,
      borderRadius: isMobile ? 0 : RADIUS.xl,
      boxShadow: isMobile ? 'none' : SHADOWS.float,
      border: isMobile ? 'none' : `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '16px',
      paddingTop: isMobile ? 'max(16px, var(--safe-area-inset-top, 16px))' : '16px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    },
    searchBox: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(0,0,0,0.03)',
      border: `1px solid ${COLORS.border}`,
    },
    input: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      fontSize: '1rem',
      fontFamily: FONTS.text,
      color: COLORS.charcoalBlue,
      '&::placeholder': {
        color: COLORS.textSecondary,
      },
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.textSecondary,
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.textSecondary,
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
    },
    body: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: COLORS.textSecondary,
    },
    pausedState: {
      textAlign: 'center',
      padding: '18px 20px',
      marginBottom: '8px',
      borderRadius: RADIUS.md,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: 'rgba(255, 107, 53, 0.07)',
      color: COLORS.charcoalBlue,
      fontWeight: 600,
    },
    resultsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    helpPanel: {
      padding: '16px',
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: RADIUS.md,
      fontSize: '0.85rem',
      color: COLORS.textSecondary,
      marginBottom: '8px',
    },
    helpKey: {
      display: 'inline-block',
      fontSize: '0.75rem',
      fontWeight: '700',
      padding: '2px 6px',
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: RADIUS.xs,
      marginRight: '4px',
      fontFamily: 'monospace',
    },
  };

  return (
    <AnimatePresence>
      <Motion.div
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <Motion.div
          style={styles.container}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.searchBox}>
              <Search size={18} color={COLORS.atomicTangerine} />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search:inputPlaceholder', 'Search places or trips...')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={!isMobile}
                style={styles.input}
                aria-label="Search"
                disabled={isSearchPaused}
              />
              {query && (
                <button
                  style={styles.closeBtn}
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              style={styles.helpBtn}
              onClick={() => setShowHelp(!showHelp)}
              title="Keyboard shortcuts"
            >
              <HelpCircle size={16} />
            </button>
            <button
              style={styles.closeBtn}
              onClick={onClose}
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={styles.body}>
            {showHelp && (
              <div style={styles.helpPanel}>
                <div>
                  <span style={styles.helpKey}>↑↓</span> Navigate results
                </div>
                <div>
                  <span style={styles.helpKey}>Enter</span> Select result
                </div>
                <div>
                  <span style={styles.helpKey}>Esc</span> Close
                </div>
              </div>
            )}

            {isSearchPaused && (
              <div style={styles.pausedState}>
                <p>
                  {t(
                    'search:pausedMessage',
                    'Search temporarily paused while we stabilize map services. Your saved trips remain available.'
                  )}
                </p>
              </div>
            )}

            {!trimmedQuery && (
              <div style={styles.emptyState}>
                <p>{t('search:inputPlaceholder', 'Start typing to search...')}</p>
              </div>
            )}

            {showQueryTooShort && (
              <div style={styles.emptyState}>
                <p>{t('search:minChars', 'Type at least 3 characters to start searching')}</p>
              </div>
            )}

            {loading && trimmedQuery && (
              <div style={styles.emptyState}>
                <p>{t('search:loading', 'Searching...')}</p>
              </div>
            )}

            {showNoResults && (
              <div style={styles.emptyState}>
                <p>{t('search:noResults', { term: trimmedQuery })}</p>
              </div>
            )}

            {!loading && allResults.length > 0 && (
              <div style={styles.resultsList}>
                {allResults.map((result, idx) => (
                  <RichResultCard
                    key={result._type === 'trip' ? (result._tripId || `trip-${idx}`) : (result.id || `result-${idx}`)}
                    item={result}
                    type={result._type}
                    isSelected={idx === selectedIndex}
                    onClick={() => handleSelectResult(result)}
                  />
                ))}
              </div>
            )}
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default SearchPalette;
