import React, { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Globe2, MapPin } from 'lucide-react';
import { useAuth } from '@app/providers';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';
import TripRosterItem from './TripRosterItem';
import { COUNTRIES_DB } from '../../../../assets/sellos';

/**
 * TripRoster — The flight deck's trip mission control.
 *
 * Desktop: Floating glassmorphic drawer anchored top-left.
 *          Semi-expanded by default (badge + trip list). Collapsible via chevron.
 * Mobile:  Fixed bottom panel with peek state + expand gesture.
 */

/* ── Glass tokens (Map overlay — only place glassmorphism is permitted) ── */
const GLASS_PANEL = {
  background: 'rgba(248, 250, 252, 0.82)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
};

const CONTINENT_LOOKUP = new Map(COUNTRIES_DB.map((country) => [country.code, country.continente]));

const countContinents = (trips = [], tripData = {}) => {
  const continents = new Set();

  trips.forEach((trip) => {
    const details = tripData[trip.id] || trip;
    const code = details?.code || details?.paisCodigo || trip.code || trip.paisCodigo;
    const continent = CONTINENT_LOOKUP.get(code);
    if (continent) continents.add(continent);
  });

  return continents.size;
};

/* ── Roster Header (Traveler Identity Badge — no gamification) ─────────── */
const RosterHeader = ({ paises, trips, tripData, isMobile, onToggle, isExpanded }) => {
  const { t } = useTranslation('dashboard');
  const { usuario } = useAuth();
  const continentsCount = useMemo(() => countContinents(trips, tripData), [trips, tripData]);

  // Calculate unique countries and total stops securely
  const { uniqueCountries, totalStops } = useMemo(() => {
    const countries = new Set();
    let stops = 0;

    trips.forEach((trip) => {
      const details = tripData[trip.id] || trip;
      // Extract stops
      const paradas = details.paradas || details.ciudades || [];
      stops += paradas.length;

      // Extract unique countries
      paradas.forEach((p) => {
        const code = p.countryCode || p.paisCodigo;
        if (code) countries.add(code.toUpperCase());
      });

      // Fallback if no stops but has a destination country
      const fallbackCode = details.code || details.paisCodigo || details.countryCode;
      if (fallbackCode) countries.add(fallbackCode.toUpperCase());
    });

    // Directly use Set size which accurately deduplicates countries across all trips
    return {
      uniqueCountries: countries.size,
      totalStops: stops,
    };
  }, [trips, tripData, paises]);

  const name = usuario?.displayName?.split(' ')[0] || t('fallbackName', 'Explorer');

  return (
    <button
      type="button"
      onClick={isMobile ? undefined : onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: isMobile ? '0 16px' : '14px 18px', // Mobile spacing adjusted for touch target above
        background: 'transparent',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        cursor: isMobile ? 'default' : 'pointer',
        textAlign: 'left',
      }}
    >
      {/* Identity icon — clean globe, no gamification level */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: RADIUS.full,
        background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 12px ${COLORS.atomicTangerine}30`,
        color: '#fff',
      }}>
        <Globe2 size={20} strokeWidth={2} />
      </div>

      {/* Identity + stats */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? '12px' : 0 }}>
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: 800,
          color: COLORS.charcoalBlue,
          lineHeight: 1.2,
        }}>
          {name}
        </p>
        <p style={{
          margin: '2px 0 0',
          fontSize: '0.72rem',
          color: COLORS.textSecondary,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}>
          <span title={t('hud.uniqueCountries', 'Países únicos visitados')}>{uniqueCountries} {uniqueCountries === 1 ? t('hud.countrySingular', 'País') : t('hud.countryPlural', 'Países')}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span title={t('hud.continents', 'Continentes')}>{continentsCount} <Globe2 size={10} style={{ display: 'inline' }} /></span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span title={t('hud.tripsAndStops', 'Viajes / Paradas')}>{trips.length} Viajes ({totalStops} Paradas) <MapPin size={10} style={{ display: 'inline' }} /></span>
        </p>
      </div>

      {/* Collapse/Expand chevron (Hidden on Mobile) */}
      {!isMobile && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: RADIUS.full,
          background: 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          {isExpanded
            ? <ChevronDown size={14} color={COLORS.textSecondary} />
            : <ChevronUp size={14} color={COLORS.textSecondary} />}
        </div>
      )}
    </button>
  );
};

/* ── Main TripRoster Component ───────────────────────────────────────── */
const TripRoster = ({
  trips = [],
  paises = [],
  tripData = {},
  isMobile = false,
  activeTrip = null,
  onTripSelect,
}) => {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(!isMobile); // Mobile: collapsed by default, desktop: expanded

  // Sort trips by date (newest first)
  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => {
      const dateA = new Date(a.fechaInicio || a.startDate || 0);
      const dateB = new Date(b.fechaInicio || b.startDate || 0);
      return dateB - dateA;
    }),
    [trips]
  );

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // ── Mobile: Fixed bottom panel ──────────────────────────────────────
  if (isMobile) {
    return (
      <Motion.div
        initial={false}
        animate={{ 
          y: 0, 
          opacity: 1, 
          height: isExpanded ? '55dvh' : '90px' 
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y > 50 || info.velocity.y > 500) {
            setIsExpanded(false);
          } else if (info.offset.y < -50 || info.velocity.y < -500) {
            setIsExpanded(true);
          }
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 15,
          pointerEvents: 'auto',
          ...GLASS_PANEL,
          borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
          borderTop: '1px solid rgba(226, 232, 240, 0.5)',
          borderLeft: '1px solid rgba(226, 232, 240, 0.5)',
          borderRight: '1px solid rgba(226, 232, 240, 0.5)',
          borderBottom: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'none'
        }}
      >
        {/* Drag handle */}
        <div
          onClick={toggleExpand}
          style={{
            width: '100%',
            height: '44px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'grab',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: RADIUS.full,
            background: 'rgba(0, 0, 0, 0.15)',
          }} />
        </div>

        <RosterHeader
          paises={paises}
          trips={trips}
          tripData={tripData}
          isMobile={true}
          onToggle={toggleExpand}
          isExpanded={isExpanded}
        />

        {/* Trip list (internal scroll) */}
        <AnimatePresence>
          {isExpanded && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '4px 8px 16px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {sortedTrips.map((trip, idx) => (
                <TripRosterItem
                  key={trip.id}
                  trip={trip}
                  isActive={activeTrip?.id === trip.id}
                  onSelect={onTripSelect}
                  index={idx}
                />
              ))}
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    );
  }

  // ── Desktop: Floating bottom-left drawer ────────────────────────────
  return (
    <Motion.div
      initial={{ opacity: 0, y: -20, x: -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 15,
        pointerEvents: 'auto',
        ...GLASS_PANEL,
        border: '1px solid rgba(226, 232, 240, 0.5)',
        borderRadius: RADIUS.xl,
        width: '320px',
        maxHeight: isExpanded ? '50vh' : '72px',
        transition: 'max-height 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <RosterHeader
        paises={paises}
        trips={trips}
        tripData={tripData}
        isMobile={false}
        onToggle={toggleExpand}
        isExpanded={isExpanded}
      />

      {/* Trip list (internal scroll) */}
      <AnimatePresence>
        {isExpanded && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '4px 8px 8px',
            }}
            className="custom-scroll"
          >
            {/* Trip count sub-header */}
            <p style={{
              margin: '4px 12px 6px',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {t('map.roster.tripsCount', '{{count}} trips', { count: trips.length })}
            </p>

            {sortedTrips.map((trip, idx) => (
              <TripRosterItem
                key={trip.id}
                trip={trip}
                isActive={activeTrip?.id === trip.id}
                onSelect={onTripSelect}
                index={idx}
              />
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
};

export default React.memo(TripRoster);
