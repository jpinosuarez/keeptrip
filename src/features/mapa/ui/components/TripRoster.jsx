import React, { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Globe2, MapPin, Plus } from 'lucide-react';
import { useAuth } from '@app/providers';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import TripRosterItem from './TripRosterItem';
import CountryFlag from '@shared/ui/components/CountryFlag';
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

/* ── Map Layer Toggle: Visitados | Wishlist | Todo (Block 2.5) ───────── */
const LAYER_OPTIONS = [
  { id: 'visitados', labelKey: 'wishlist.layerVisited', fallback: 'Visitados' },
  { id: 'wishlist', labelKey: 'wishlist.layerWishlist', fallback: 'Wishlist' },
  { id: 'todo', labelKey: 'wishlist.layerAll', fallback: 'Todo' },
];

const MapLayerToggle = ({ value = 'todo', onChange }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div
      className="flex items-center gap-1 px-3 py-2"
      role="tablist"
      aria-label={t('wishlist.layerAll', 'Todo')}
    >
      {LAYER_OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.id)}
            className={cn(
              'flex-1 inline-flex items-center justify-center min-h-[44px] px-2 rounded-full text-[0.72rem] font-bold border transition-colors cursor-pointer',
              active
                ? 'bg-[#45B0A8]/15 border-[#45B0A8] text-[#2C3E50]'
                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
            )}
          >
            {t(opt.labelKey, opt.fallback)}
          </button>
        );
      })}
    </div>
  );
};

/* ── Wishlist destination row (Explorer with 0 completed trips — Block 3.0) ── */
const WishlistRow = ({ item, onSelect, onCreateTrip }) => {
  const { t } = useTranslation('dashboard');
  const label = item?.nombre || item?.paisNombre || item?.paisCodigo || '';

  return (
    <div className="flex items-center gap-1.5 rounded-xl px-2 hover:bg-[#45B0A8]/5 transition-colors">
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className="flex flex-1 min-w-0 items-center gap-2 min-h-[44px] text-left cursor-pointer bg-transparent border-none"
      >
        <CountryFlag code={item?.paisCodigo} size="xs" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.82rem] font-bold text-[#2C3E50]">{label}</span>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-[#45B0A8]/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#45B0A8]">
            {t('wishlist.layerWishlist', 'Wishlist')}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onCreateTrip?.(item)}
        aria-label={`${t('wishlist.createTrip', 'Crear viaje')}: ${label}`}
        title={t('wishlist.createTrip', 'Crear viaje')}
        className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2.5 shrink-0 rounded-full border border-[#FF6B35]/30 text-[0.62rem] font-bold text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors cursor-pointer bg-transparent"
      >
        <Plus size={12} />
        {t('wishlist.createTrip', 'Crear viaje')}
      </button>
    </div>
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
  wishlistFilter = 'todo',
  onWishlistFilterChange = null,
  wishlistItems = [],
  onWishlistItemFly = null,
  onCreateTripFromWishlist = null,
}) => {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(!isMobile); // Mobile: collapsed by default, desktop: expanded

  // Block 3.0 — show wishlist destinations in the Explorer whenever the active
  // map layer includes them ("wishlist" or "todo") and the wishlist is not empty.
  const showWishlistRows = wishlistFilter !== 'visitados' && wishlistItems.length > 0;

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

        <MapLayerToggle value={wishlistFilter} onChange={onWishlistFilterChange} />

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
              {showWishlistRows && (
                <div className="mt-1 border-t border-black/5 pt-1">
                  <p className="mx-3 mt-1 mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#64748B]">
                    {t('wishlist.explorerTitle', 'Destinos en tu Wishlist')}
                  </p>
                  {wishlistItems.map((item) => (
                    <WishlistRow
                      key={item.id}
                      item={item}
                      onSelect={onWishlistItemFly}
                      onCreateTrip={onCreateTripFromWishlist}
                    />
                  ))}
                </div>
              )}
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

      <MapLayerToggle value={wishlistFilter} onChange={onWishlistFilterChange} />

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
            {showWishlistRows && (
              <div className="mt-1 border-t border-black/5 pt-1">
                <p className="mx-3 mt-1 mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#64748B]">
                  {t('wishlist.explorerTitle', 'Destinos en tu Wishlist')}
                </p>
                {wishlistItems.map((item) => (
                  <WishlistRow
                    key={item.id}
                    item={item}
                    onSelect={onWishlistItemFly}
                    onCreateTrip={onCreateTripFromWishlist}
                  />
                ))}
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
};

export default React.memo(TripRoster);
