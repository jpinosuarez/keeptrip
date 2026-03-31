import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLORS, RADIUS } from '@shared/config';
import DocumentaryFlagHero from '@shared/ui/components/DocumentaryFlagHero';
import { FOTO_DEFAULT_URL } from '@shared/lib/utils/viajeUtils';

/**
 * TripRosterItem — Compact trip row for the Map Command Center roster.
 *
 * Layout: 64px horizontal row with thumbnail, title, date, flags.
 * Active state: atomicTangerine left-border accent + background tint.
 */
const TripRosterItem = ({ trip, isActive = false, onSelect, index = 0 }) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { search } = useLocation();

  const flags = trip.banderas || trip.flags || (trip.flag ? [trip.flag] : []);
  const coverUrl = trip.foto || '';
  const isDefaultPhoto = !coverUrl || coverUrl === FOTO_DEFAULT_URL;
  const title = trip.titulo || trip.nombreEspanol || trip.nameSpanish || t('countryFallback');
  const dateLabel = trip.fechaInicio || trip.startDate || '';

  const openTripEditor = (e) => {
    e.stopPropagation();
    const params = new URLSearchParams(search);
    params.set('editing', trip.id);
    navigate({ pathname: '/trips', search: params.toString() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(trip);
    }
  };

  return (
    <Motion.div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(trip)}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22, delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 12px',
        minHeight: '64px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: RADIUS.md,
        textAlign: 'left',
        transition: 'background 0.2s ease',
        background: isActive ? 'rgba(255, 107, 53, 0.12)' : 'rgba(0, 0, 0, 0.02)',
        borderLeft: isActive ? `3px solid ${COLORS.atomicTangerine}` : '3px solid transparent',
        outline: 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: COLORS.border,
      }}>
        {!isDefaultPhoto ? (
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DocumentaryFlagHero banderas={flags} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: '0.88rem',
          fontWeight: 700,
          color: COLORS.charcoalBlue,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {title}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '3px',
        }}>
          {dateLabel && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.72rem',
              color: COLORS.textSecondary,
              fontWeight: 600,
            }}>
              <Calendar size={10} />
              {dateLabel}
            </span>
          )}
          {trip.ciudades && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.72rem',
              color: COLORS.textSecondary,
              fontWeight: 600,
            }}>
              <MapPin size={10} />
              {trip.ciudades.split(',')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Flags + Open action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {flags.slice(0, 2).map((flag, idx) => (
          <img
            key={idx}
            src={flag}
            alt=""
            style={{
              width: 22,
              height: 16,
              borderRadius: '2px',
              objectFit: 'cover',
              marginLeft: idx > 0 ? '-6px' : 0,
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          />
        ))}
        {isActive && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <button
              type="button"
              onClick={openTripEditor}
              aria-label={t('map.roster.openLog', 'Open Log')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: RADIUS.full,
                border: 'none',
                background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${COLORS.atomicTangerine}40`,
                marginLeft: '4px',
              }}
            >
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </Motion.div>
        )}
      </div>
    </Motion.div>
  );
};

export default React.memo(TripRosterItem);
