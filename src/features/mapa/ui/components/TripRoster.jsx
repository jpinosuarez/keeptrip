import React, { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Globe2 } from 'lucide-react';
import { useAuth } from '@app/providers';
import { getTravelerLevel } from '@features/gamification';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@shared/config';
import TripRosterItem from './TripRosterItem';

/**
 * TripRoster — The flight deck's trip mission control.
 *
 * Desktop: Floating glassmorphic drawer anchored bottom-left.
 *          Semi-expanded by default (badge + trip list). Collapsible via chevron.
 * Mobile:  Fixed bottom panel with peek state + expand gesture.
 *
 * Absorbs TravelerHud data (name, level, stats) in the header.
 */

/* ── Glass tokens (Map overlay — only place glassmorphism is permitted) ── */
const GLASS_PANEL = {
  background: 'rgba(248, 250, 252, 0.82)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(226, 232, 240, 0.5)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
};

/* ── Roster Header (Traveler Identity Badge) ─────────────────────────── */
const RosterHeader = ({ paises, trips, tripData, isMobile, onToggle, isExpanded }) => {
  const { t } = useTranslation('dashboard');
  const { usuario } = useAuth();
  const stats = useLogStats(trips, tripData);
  const level = getTravelerLevel(paises.length);
  const name = usuario?.displayName?.split(' ')[0] || t('fallbackName', 'Explorer');

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: isMobile ? '14px 16px' : '14px 18px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* Level icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: RADIUS.full,
        background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
        boxShadow: `0 4px 12px ${COLORS.atomicTangerine}30`,
      }}>
        {level.icon}
      </div>

      {/* Identity + stats */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
        }}>
          <span style={{ color: COLORS.atomicTangerine, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {level.label}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          {paises.length} {paises.length === 1 ? t('hud.countrySingular', 'country') : t('hud.countryPlural', 'countries')}
          <span style={{ opacity: 0.4 }}>·</span>
          {stats.continents} <Globe2 size={10} />
        </p>
      </div>

      {/* Collapse/Expand chevron */}
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
          ? <ChevronUp size={14} color={COLORS.textSecondary} />
          : <ChevronDown size={14} color={COLORS.textSecondary} />}
      </div>
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
  const [isExpanded, setIsExpanded] = useState(true); // Default: semi-expanded

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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.2 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 15,
          pointerEvents: 'auto',
          ...GLASS_PANEL,
          borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
          borderBottom: 'none',
          maxHeight: isExpanded ? '55dvh' : '80px',
          transition: 'max-height 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div
          onClick={toggleExpand}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 0 2px',
            cursor: 'pointer',
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
