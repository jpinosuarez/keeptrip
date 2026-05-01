import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe, Compass, Calendar, MapPin } from 'lucide-react';
import { ANIMATION_DELAYS } from '@shared/config';
import { styles } from './TravelStatsWidget.styles';

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const StatCard = ({ stat, hero = false, compact = false, style, index }) => {
  const isSecondary = !hero;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ANIMATION_DELAYS.fast + index * 0.06, duration: 0.35 }}
      style={{
        ...styles.card,
        ...(compact ? styles.compactCard : null),
        ...(hero ? styles.heroCard : styles.secondaryCard),
        ...(compact && hero ? styles.compactHeroCard : null),
        ...style,
      }}
    >
      <div
        style={{
          ...styles.cardBody,
          ...(hero ? styles.heroCardBody : styles.secondaryCardBody),
          // Apply clustered override only to secondary cards in compact view
          ...(compact && !hero ? styles.compactSecondaryCardBody : null),
        }}
      >
        {isSecondary ? (
          <>
            <div style={{
              ...styles.secondaryTextLayout,
              // Apply expansion control and zero flexibility for proper clustering
              ...(compact ? styles.compactSecondaryTextLayout : null)
            }}>
              <span
                style={{
                  ...styles.value,
                  ...(compact ? styles.compactValue : null),
                }}
              >
                {stat.displayValue}
              </span>
              <span style={styles.secondaryLabel}>{stat.label}</span>
            </div>
            <div style={styles.secondaryIconBadge} aria-hidden="true">
              <span style={styles.secondaryIcon}>{stat.icon}</span>
            </div>
          </>
        ) : (
          <>
            <span
              style={{
                ...styles.value,
                ...(compact ? styles.compactValue : null),
                ...(hero ? styles.heroValue : null),
                ...(compact && hero ? styles.compactHeroValue : null),
              }}
            >
              {stat.displayValue}
            </span>
            <span style={hero ? styles.label : styles.secondaryLabel}>{stat.label}</span>
            {hero && stat.hint ? <span style={styles.hint}>{stat.hint}</span> : null}
          </>
        )}
      </div>
    </Motion.div>
  );
};

const TravelStatsWidget = ({ logStats = null, ariaLabel, isMobile = false, variant = 'hero' }) => {
  const { t } = useTranslation('dashboard');
  const isCompact = variant === 'compact';

  const safeValue = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);
  const isDesktopLayout = !isMobile;

  const stats = React.useMemo(() => {
    if (!logStats) return null;

    const worldPercentage = Number.parseFloat(logStats.worldExploredPercentage || '0');

    return {
      worldExploredPercentage: {
        label: t('stats.worldExploredPercentage'),
        displayValue: `${Number.isNaN(worldPercentage) ? 0 : Math.round(worldPercentage)}%`,
      },
      uniqueCountries: {
        label: t('stats.uniqueCountries'),
        icon: <Globe size={24} strokeWidth={2} />,
        displayValue: (
          <span>
            {formatNumber(safeValue(logStats.uniqueCountries))}
            <span style={{ opacity: 0.7, fontSize: '0.75em', fontWeight: 500 }}>/195</span>
          </span>
        ),
      },
      completedTrips: {
        label: t('stats.completedTrips'),
        icon: <Compass size={24} strokeWidth={2} />,
        displayValue: formatNumber(safeValue(logStats.completedTrips)),
      },
      totalDays: {
        label: t('stats.totalDays'),
        icon: <Calendar size={24} strokeWidth={2} />,
        displayValue: formatNumber(safeValue(logStats.totalDays)),
      },
      totalStops: {
        label: t('stats.totalStops'),
        icon: <MapPin size={24} strokeWidth={2} />,
        displayValue: formatNumber(safeValue(logStats.totalStops)),
      },
    };
  }, [logStats, t]);

  if (!stats || safeValue(logStats?.completedTrips) === 0) {
    return (
      <section role="region" aria-label={ariaLabel} style={styles.shell} data-density={isMobile ? 'mobile' : 'desktop'}>
        <div style={styles.emptyState}>
          <span style={styles.emptyStateTitle}>{t('stats.emptyStateHint')}</span>
          <span style={styles.emptyStateMessage}>{t('stats.emptyStateMessage')}</span>
        </div>
      </section>
    );
  }

  const cards = [
    {
      key: 'worldExploredPercentage',
      hero: true,
      mobilePosition: styles.heroPositionMobile,
      desktopPosition: styles.heroPositionDesktop,
      compactMobilePosition: styles.compactHeroPositionMobile,
      compactDesktopPosition: styles.compactHeroPositionDesktop,
      stat: stats.worldExploredPercentage,
    },
    {
      key: 'uniqueCountries',
      mobilePosition: styles.uniqueCountriesPositionMobile,
      desktopPosition: styles.uniqueCountriesPositionDesktop,
      compactMobilePosition: styles.compactUniqueCountriesPositionMobile,
      compactDesktopPosition: styles.compactUniqueCountriesPositionDesktop,
      stat: stats.uniqueCountries,
    },
    {
      key: 'completedTrips',
      mobilePosition: styles.completedTripsPositionMobile,
      desktopPosition: styles.completedTripsPositionDesktop,
      compactMobilePosition: styles.compactCompletedTripsPositionMobile,
      compactDesktopPosition: styles.compactCompletedTripsPositionDesktop,
      stat: stats.completedTrips,
    },
    {
      key: 'totalDays',
      mobilePosition: styles.totalDaysPositionMobile,
      desktopPosition: styles.totalDaysPositionDesktop,
      compactMobilePosition: styles.compactTotalDaysPositionMobile,
      compactDesktopPosition: styles.compactTotalDaysPositionDesktop,
      stat: stats.totalDays,
    },
    {
      key: 'totalStops',
      mobilePosition: styles.totalStopsPositionMobile,
      desktopPosition: styles.totalStopsPositionDesktop,
      compactMobilePosition: styles.compactTotalStopsPositionMobile,
      compactDesktopPosition: styles.compactTotalStopsPositionDesktop,
      stat: stats.totalStops,
    },
  ];

  const containerClass = `travel-stats-container ${isCompact ? 'compact' : 'hero'}`;

  return (
    <section role="region" aria-label={ariaLabel} style={styles.shell} data-density={isMobile ? 'mobile' : 'desktop'}>
      <div className={containerClass}>
        {cards.map((card, index) => (
          <StatCard
            key={card.key}
            stat={card.stat}
            hero={card.hero}
            compact={isCompact}
            style={
                isDesktopLayout
                  ? (isCompact ? card.compactDesktopPosition : card.desktopPosition)
                  : (isCompact ? card.compactMobilePosition : card.mobilePosition)
            }
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default TravelStatsWidget;