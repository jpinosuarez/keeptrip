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
          displayValue: `${safeValue(logStats.percentOfWorld)}%`,
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
    const percentMetric = secondaryMetrics[2]; // % of World
    const experienceMetrics = [heroMetric, secondaryMetrics[0]]; // Trips, Days
    const explorationMetrics = [secondaryMetrics[1], secondaryMetrics[3]]; // Cities, Continents

    // MOBILE: Compact 2-col grid — Hero % spans full width, then 2×2 grid of stats below
    if (isMobile) {
      const allSecondary = [heroMetric, secondaryMetrics[0], secondaryMetrics[1], secondaryMetrics[3]];
      return (
        <section role="region" aria-label={ariaLabel} className="travel-stats-home" style={styles.mobileCompactShell}>
          {/* Hero: % of World — full width accent row */}
          <Motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
            style={styles.mobileHeroRow}
          >
            <span style={styles.mobileHeroValue}>{percentMetric.displayValue}</span>
            <span style={styles.mobileHeroLabel}>{percentMetric.label}</span>
          </Motion.div>

          {/* 2×2 grid: Trips, Days, Cities, Continents */}
          <div style={styles.mobileStatsGrid}>
            {allSecondary.map((stat, idx) => (
              <Motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.05, duration: 0.3 }}
                style={styles.mobileStatCell}
                title={stat.hint}
              >
                <span style={styles.mobileStatValue}>{stat.displayValue}</span>
                <span style={styles.mobileStatLabel}>{stat.label}</span>
              </Motion.div>
            ))}
          </div>
        </section>
      );
    }

    // DESKTOP: Full Biography Layout — Hero % on left + Experience/Exploration groups on right
    return (
      <section role="region" aria-label={ariaLabel} className="travel-stats-home" style={styles.homeShell(false)}>
        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
          style={styles.biographyHeroContainer}
        >
          <span style={styles.biographyHeroLabel} title={percentMetric.hint}>{percentMetric.label}</span>
          <span style={styles.biographyHeroValue}>{percentMetric.displayValue}</span>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          style={styles.biographySection(false)}
          role="group"
          aria-label={t('stats.additionalMetrics') || 'Additional travel metrics'}
        >
          <div style={styles.biographyGroup}>
            <div style={styles.groupTitle}>{t('stats.experience') || 'Experience'}</div>
            <div style={styles.groupStats}>
              {experienceMetrics.map((stat, idx) => (
                <Motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08, duration: 0.35 }}
                  role="doc-subtitle"
                  aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
                  title={stat.hint}
                >
                  <StatDisplay stat={stat} variant="biography" />
                </Motion.div>
              ))}
            </div>
          </div>
          <div style={styles.groupDivider}>•</div>
          <div style={styles.biographyGroup}>
            <div style={styles.groupTitle}>{t('stats.exploration') || 'Exploration'}</div>
            <div style={styles.groupStats}>
              {explorationMetrics.map((stat, idx) => (
                <Motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + idx * 0.08, duration: 0.35 }}
                  role="doc-subtitle"
                  aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
                  title={stat.hint}
                >
                  <StatDisplay stat={stat} variant="biography" />
                </Motion.div>
              ))}
            </div>
          </div>
        </Motion.div>
      </section>
    );
  }

  if (variant === 'trips') {
    const percentMetric = secondaryMetrics[2]; // % of World
    const experienceMetrics = [heroMetric, secondaryMetrics[0]]; // Trips, Days
    const explorationMetrics = [secondaryMetrics[1], secondaryMetrics[3]]; // Cities, Continents

    // MOBILE: Same compact 2-col grid as home variant
    if (isMobile) {
      const allSecondary = [heroMetric, secondaryMetrics[0], secondaryMetrics[1], secondaryMetrics[3]];
      return (
        <section role="region" aria-label={ariaLabel} className="travel-stats-trips" style={styles.mobileCompactShell}>
          <Motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
            style={styles.mobileHeroRow}
          >
            <span style={styles.mobileHeroValue}>{percentMetric.displayValue}</span>
            <span style={styles.mobileHeroLabel}>{percentMetric.label}</span>
          </Motion.div>
          <div style={styles.mobileStatsGrid}>
            {allSecondary.map((stat, idx) => (
              <Motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.05, duration: 0.3 }}
                style={styles.mobileStatCell}
                title={stat.hint}
              >
                <span style={styles.mobileStatValue}>{stat.displayValue}</span>
                <span style={styles.mobileStatLabel}>{stat.label}</span>
              </Motion.div>
            ))}
          </div>
        </section>
      );
    }

    // DESKTOP: Full Biography layout on Trips page
    return (
      <section role="region" aria-label={ariaLabel} className="travel-stats-trips" style={styles.homeShell(false)}>
        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.fast, duration: 0.4 }}
          style={styles.biographyHeroContainer}
        >
          <span style={styles.biographyHeroLabel} title={percentMetric.hint}>{percentMetric.label}</span>
          <span style={styles.biographyHeroValue}>{percentMetric.displayValue}</span>
        </Motion.div>
        <Motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          style={styles.biographySection(false)}
          role="group"
          aria-label={t('stats.additionalMetrics') || 'Additional travel metrics'}
        >
          <div style={styles.biographyGroup}>
            <div style={styles.groupTitle}>{t('stats.experience') || 'Experience'}</div>
            <div style={styles.groupStats}>
              {experienceMetrics.map((stat, idx) => (
                <Motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08, duration: 0.35 }}
                  role="doc-subtitle"
                  aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
                  title={stat.hint}
                >
                  <StatDisplay stat={stat} variant="biography" />
                </Motion.div>
              ))}
            </div>
          </div>
          <div style={styles.groupDivider}>•</div>
          <div style={styles.biographyGroup}>
            <div style={styles.groupTitle}>{t('stats.exploration') || 'Exploration'}</div>
            <div style={styles.groupStats}>
              {explorationMetrics.map((stat, idx) => (
                <Motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + idx * 0.08, duration: 0.35 }}
                  role="doc-subtitle"
                  aria-label={`${stat.label}: ${stat.displayValue}. ${stat.hint}`}
                  title={stat.hint}
                >
                  <StatDisplay stat={stat} variant="biography" />
                </Motion.div>
              ))}
            </div>
          </div>
        </Motion.div>
      </section>
    );
  }

  return null;
};

const StatDisplay = ({ stat, variant = 'default' }) => {
  let valueStyle;
  let labelStyle;
  let wrapperStyle = styles.statDisplayWrapper;

  if (variant === 'trips') {
    valueStyle = styles.tripsValue;
    labelStyle = styles.tripsLabel;
  } else if (variant === 'biography') {
    valueStyle = styles.biographyStatValue;
    labelStyle = styles.biographyStatLabel;
    wrapperStyle = styles.biographyStat;
  } else {
    valueStyle = styles.value;
    labelStyle = styles.label;
  }

  return (
    <div style={wrapperStyle} title={stat.hint}>
      <span style={valueStyle} role="doc-pagebreak">{stat.displayValue}</span>
      <span style={labelStyle}>{stat.label}</span>
    </div>
  );
};

export default TravelStatsWidget;