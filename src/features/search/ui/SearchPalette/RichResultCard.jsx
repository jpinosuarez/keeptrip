import React from 'react';
import { Globe, MapPin, Calendar, Plus, ArrowRight, Bookmark, Check } from 'lucide-react';
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
  onClick,
  showWishlistActions = false,
  isSaved = false,
  onAddToWishlist,
  onCreateTrip,
}) => {
  const { t } = useTranslation(['search', 'common']);
  const isTrip = type === 'trip';
  
  // Mapbox place: { name, fullName, countryCode, type, ... }
  // Trip: { titulo, nombreEspanol, banderas, fechaInicio, fechaFin, foto, ... }
  
  const title = isTrip ? item.titulo : item.name;
  const typeLabel = isTrip ? null : (item.isCountry ? t('search:country', 'País') : t('search:city', 'Ciudad'));
  const placeSubtitle = item.subtitle
    || [item.regionName, item.countryName].filter(Boolean).join(', ')
    || item.fullName
    || item.countryName
    || '';
  const subtitle = isTrip
    ? formatDateRange(item.fechaInicio, item.fechaFin)
    : placeSubtitle;
  
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
      flexWrap: 'wrap',
      rowGap: '8px',
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
    subtitleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      minWidth: 0,
    },
    subtitle: {
      fontSize: '0.8rem',
      color: COLORS.textSecondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
    },
    typeBadge: {
      flexShrink: 0,
      fontSize: '0.62rem',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: COLORS.mutedTeal,
      backgroundColor: 'rgba(69, 176, 168, 0.12)',
      border: '1px solid rgba(69, 176, 168, 0.3)',
      borderRadius: RADIUS.full,
      padding: '1px 7px',
      lineHeight: 1.6,
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
    actionsGroup: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '8px',
      flexWrap: 'wrap',
      flexShrink: 0,
    },
    primaryAction: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: RADIUS.full,
      border: 'none',
      backgroundColor: COLORS.atomicTangerine,
      color: '#fff',
      fontSize: '0.74rem',
      fontWeight: '700',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: TRANSITIONS.fast,
    },
    wishlistAction: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: RADIUS.full,
      border: `1.5px solid ${COLORS.mutedTeal}`,
      backgroundColor: 'rgba(69, 176, 168, 0.12)',
      color: COLORS.mutedTeal,
      fontSize: '0.74rem',
      fontWeight: '700',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: TRANSITIONS.fast,
    },
    savedAction: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: RADIUS.full,
      border: `1.5px solid ${COLORS.mutedTeal}`,
      backgroundColor: 'rgba(69, 176, 168, 0.2)',
      color: COLORS.mutedTeal,
      fontSize: '0.74rem',
      fontWeight: '700',
      cursor: 'default',
      whiteSpace: 'nowrap',
      opacity: 0.85,
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
        <div style={styles.subtitleRow}>
          {typeLabel && <span style={styles.typeBadge}>{typeLabel}</span>}
          <span style={styles.subtitle}>{subtitle}</span>
        </div>
      </div>

      {/* Actions: trips → single open badge; place results → dual Create / Wishlist */}
      {showWishlistActions && !isTrip ? (
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              (onCreateTrip || onClick)?.();
            }}
            aria-label={t('search:createTrip', 'Crear viaje')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35]"
            data-testid={`create-trip-${item.id}`}
          >
            <Plus size={13} />
            <span>{t('search:createTrip', 'Crear viaje')}</span>
          </button>
          <button
            type="button"
            disabled={isSaved}
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist?.(item);
            }}
            aria-label={
              isSaved
                ? t('search:savedToWishlist', 'Guardado')
                : t('search:addToWishlist', 'A la Wishlist')
            }
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              isSaved
                ? 'bg-slate-100 text-slate-400 border-slate-200/60 cursor-default font-medium'
                : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-[#45B0A8] hover:text-white hover:border-[#45B0A8] cursor-pointer'
            }`}
            data-testid={`add-wishlist-${item.id}`}
          >
            {isSaved ? <Check className="text-[#45B0A8]" size={13} /> : <Bookmark size={13} />}
            <span>
              {isSaved
                ? t('search:savedToWishlist', 'Guardado')
                : t('search:addToWishlist', 'A la Wishlist')}
            </span>
          </button>
        </div>
      ) : (
        <div
          style={styles.badgeContainer}
          role="button"
          aria-label={isTrip ? t('common:open') : t('common:add')}
        >
          {badgeIcon} {badgeLabel}
        </div>
      )}
    </div>
  );
};

export default RichResultCard;
