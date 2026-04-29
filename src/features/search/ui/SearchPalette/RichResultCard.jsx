import React from 'react';
import { Globe, MapPin, Calendar, Plus, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';
import { formatDateRange } from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

/**
 * Rich Result Card for SearchPalette.
 * Displays: Thumbnail (flag/image) | Metadata (title, date) | Quick action badge
 * Supports both Mapbox results and local trip results.
 */
const RichResultCard = ({ 
  item, 
  isSelected = false, 
  type = 'place', // 'place' | 'trip'
  onClick 
}) => {
  const { t } = useTranslation(['search', 'common']);
  const isTrip = type === 'trip';
  
  // Mapbox place: { name, fullName, countryCode, type, ... }
  // Trip: { titulo, nombreEspanol, banderas, fechaInicio, fechaFin, foto, ... }
  
  const title = isTrip ? item.titulo : item.name;
  const subtitle = isTrip 
    ? formatDateRange(item.fechaInicio, item.fechaFin)
    : (item.countryName || item.fullName);
  
  const year = isTrip && item.fechaInicio 
    ? new Date(item.fechaInicio).getFullYear()
    : null;
  
  // Thumbnail: Trip cover photo or flag
  const thumbnailUrl = isTrip 
    ? item.foto 
    : (item.countryCode ? getFlagUrl(item.countryCode) : null);
  
  const badgeLabel = isTrip ? t('common:open') : t('common:add');
  const badgeIcon = isTrip ? <ArrowRight size={14} /> : <Plus size={14} />;
  
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderRadius: RADIUS.md,
      cursor: 'pointer',
      transition: TRANSITIONS.fast,
      backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
      borderLeft: isSelected ? `3px solid ${COLORS.atomicTangerine}` : '3px solid transparent',
      paddingLeft: '9px',
      '&:hover': {
        backgroundColor: 'rgba(255, 107, 53, 0.04)',
      },
    },
    thumbnail: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: COLORS.charcoalBlue,
      flexShrink: 0,
      boxShadow: SHADOWS.sm,
      border: 'none',
    },
    defaultIcon: {
      width: '56px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.charcoalBlue,
      color: COLORS.atomicTangerine,
      flexShrink: 0,
    },
    contentWrapper: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '2px',
    },
    title: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: COLORS.charcoalBlue,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    year: {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: COLORS.textSecondary,
      letterSpacing: '0.5px',
      flexShrink: 0,
    },
    subtitle: {
      fontSize: '0.8rem',
      color: COLORS.textSecondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    badgeContainer: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.75rem',
      fontWeight: '700',
      color: COLORS.atomicTangerine,
      padding: '6px 12px',
      borderRadius: RADIUS.full,
      backgroundColor: 'transparent',
      border: `1.5px solid ${COLORS.atomicTangerine}`,
      flexShrink: 0,
      letterSpacing: '0.3px',
      cursor: 'pointer',
      transition: TRANSITIONS.fast,
    },
  };

  return (
    <div
      data-testid={`search-result-${type}-${isTrip ? item._tripId : item.id}`}
      style={styles.container}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={title} 
          style={styles.thumbnail}
          loading="lazy"
        />
      ) : (
        <div style={styles.defaultIcon}>
          {isTrip ? <Calendar size={24} /> : <Globe size={24} />}
        </div>
      )}

      {/* Content */}
      <div style={styles.contentWrapper}>
        <div style={styles.titleRow}>
          <span style={styles.title}>{title}</span>
          {year && <span style={styles.year}>{year}</span>}
        </div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>

      {/* Badge */}
      <div
        style={styles.badgeContainer}
        role="button"
        aria-label={isTrip ? t('common:open') : t('common:add')}
      >
        {badgeIcon} {badgeLabel}
      </div>
    </div>
  );
};

export default RichResultCard;
