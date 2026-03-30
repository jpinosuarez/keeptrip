import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ANIMATION_DELAYS } from '@shared/config';
import { styles } from './TravelStatsWidget.styles';

// Format large numbers with thousands separator
const formatStat = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const TravelStatsWidget = ({ logStats = null, ariaLabel, variant = 'home', isMobile = false }) => {
  const { t } = useTranslation('dashboard');

  // Ensure safe numeric values with fallback to 0
  const safeValue = (val) => (typeof val === 'number' && !Number.isNaN(val) ? val : 0);

  // 5 metrics: Hero (Trips) + 4 Secondary (Days, Cities, % World, Continents)
  // Compute memoized values to prevent animation jank on re-renders
  // ⚠️ CRITICAL: Must be BEFORE conditional returns to follow React Hooks Rules
  const metrics = useMemo(() => {
    // Return metrics even if logStats is null/empty (will show in empty state)
    if (!logStats) {
      return {
        hero: { value: 0, label: t('stats.tripsCompleted'), displayValue: '0' },
        secondary: [],
      };
    }

    return {
      hero: {
        value: safeValue(logStats.tripCount),
        label: t('stats.tripsCompleted'),
        displayValue: formatStat(safeValue(logStats.tripCount)),
      },
      secondary: [
        {
          value: safeValue(logStats.totalDays),
          label: t('stats.totalDays'),
          hint: t('stats.totalDaysHint') || 'Days across all trips',
          displayValue: formatStat(safeValue(logStats.totalDays)),
        },
        {
          value: safeValue(logStats.totalCities),
          label: t('stats.registeredCities'),
          hint: t('stats.citiesHint') || 'Unique cities visited',
          displayValue: formatStat(safeValue(logStats.totalCities)),
        },
        {
          value: safeValue(logStats.percentOfWorld),
          label: t('stats.percentOfWorld') || '% of World',
          hint: t('stats.percentHint') || 'Of global 195 countries',
          displayValue: `${Math.round(safeValue(logStats.percentOfWorld) * 10) / 10}%`,
        },
        {
          value: safeValue(logStats.continents),
          label: t('stats.continents'),
          hint: t('stats.continentsHint') || 'Continents explored',
          displayValue: formatStat(safeValue(logStats.continents)),
        },
      ],
    };
  }, [logStats, t]);

  const heroMetric = metrics.hero;
  const secondaryMetrics = metrics.secondary;

  /* PHASE 3: Aspirational Empty State — if no trips or no data, render beautiful placeholder */
  if (!logStats || safeValue(logStats.tripCount) === 0) {
    return (
      <section role="region" aria-label={ariaLabel} style={styles.homeShell(isMobile)}>
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.5 }}
          style={styles.emptyStateContainer}
        >
          <span style={styles.emptyStateLabel}>{t('stats.emptyStateHint') || '✨ Your passport awaits'}</span>
          <span style={styles.emptyStateMessage}>
            {t('stats.emptyStateMessage') || 'Start your first adventure to see your travel story unfold'}
          </span>
        </Motion.div>
      </section>
    );
  }

  if (variant === 'home') {
    // Horizontal layout: Hero on left, secondary grid on right (always visible now)
    return (
      <section role="region" aria-label={ariaLabel} className="travel-stats-home" style={styles.homeShell(isMobile)}>
        {/* PHASE 4: Fast staggered entry animation — fade-in + slide up on mount ONLY */}
        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
          style={styles.homeHeroContainer}
        >
          <span style={styles.homeHeroLabel} title={t('stats.tripsCompleted')}>{heroMetric.label}</span>
          <span style={styles.homeHeroValue}>{heroMetric.displayValue}</span>
        </Motion.div>

        {/* Secondary metrics: Always render (unhidden mobile) */}
        <div 
          className="travel-stats-home-secondary" 
          style={styles.homeSecondaryGrid(isMobile)}
          role="group"
          aria-label={t('stats.additionalMetrics') || 'Additional travel metrics'}
        >
          {secondaryMetrics.map((stat, idx) => (
            <Motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              /* PHASE 4: Faster stagger, total sequence < 0.6s */
              transition={{ delay: 0.15 + idx * 0.08, duration: 0.35 }}
              style={styles.homeSecondaryStat}
              role="doc-subtitle"
              aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
              title={stat.hint}
            >
              <StatDisplay stat={stat} />
            </Motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === 'trips') {
    // Compact layout: Hero scaled down on left with border, 4 secondary in compact grid
    return (
      <section role="region" aria-label={ariaLabel} className="travel-stats-trips" style={styles.tripsShell}>
        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
          style={styles.tripsHeroContainer}
        >
          <span style={styles.tripsHeroLabel}>{heroMetric.label}</span>
          <span style={styles.tripsHeroValue}>{heroMetric.displayValue}</span>
        </Motion.div>

        <div 
          className="travel-stats-trips-secondary" 
          style={styles.tripsSecondaryGrid}
          role="group"
          aria-label={t('stats.additionalMetrics') || 'Additional travel metrics'}
        >
          {secondaryMetrics.map((stat, idx) => (
            <Motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              /* PHASE 4: Faster stagger */
              transition={{ delay: 0.15 + idx * 0.08, duration: 0.35 }}
              style={styles.tripsSecondaryStat}
              role="doc-subtitle"
              aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
              title={stat.hint}
            >
              <StatDisplay stat={stat} variant="trips" />
            </Motion.div>
          ))}
        </div>
      </section>
    );
  }

  return null;
};

const StatDisplay = ({ stat, variant = 'default' }) => {
  const valueStyle = variant === 'trips' ? styles.tripsValue : styles.value;
  const labelStyle = variant === 'trips' ? styles.tripsLabel : styles.label;

  return (
    <div style={styles.statDisplayWrapper} title={stat.hint}>
      <span style={valueStyle} role="doc-pagebreak">{stat.displayValue}</span>
      <span style={labelStyle}>{stat.label}</span>
    </div>
  );
};

export default TravelStatsWidget;