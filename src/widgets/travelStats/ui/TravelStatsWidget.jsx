import React, { memo, useEffect } from 'react';
import { motion as Motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { styles } from './TravelStatsWidget.styles';

/**
 * Flexible stats widget used across dashboard, hub, etc.
 * Props:
 *   heroMetric: optional { value, label }
 *   stats: array of { value, label }
 *   ariaLabel: string
 *   variant: 'compact' | 'full'  // compact shows first two stats only
 */
const TravelStatsWidget = ({ heroMetric = null, stats = [], ariaLabel, variant = 'full' }) => {
  if (stats.length === 0) return null;

  const displayed = variant === 'compact' ? stats.slice(0, 2) : stats.slice(0, 4);

  if (variant === 'compact' || !heroMetric) {
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className="travel-stats-grid travel-stats-grid-compact"
        style={styles.compactContainer}
      >
        {displayed.map((stat) => (
          <StatPill key={stat.label} stat={stat} />
        ))}
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className="travel-stats-shell"
      style={styles.shell}
    >
      <Motion.article style={styles.heroCard} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <span style={styles.heroLabel}>{heroMetric.label}</span>
        <AnimatedValue value={heroMetric.value} style={styles.heroValue} />
      </Motion.article>
      <div className="travel-stats-grid" style={styles.secondaryGrid}>
        {displayed.map((stat) => (
          <StatPill key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
};

const AnimatedValue = memo(({ value, style }) => {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value) || 0;
  const count = useMotionValue(numericValue);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const prev = React.useRef(numericValue);

  useEffect(() => {
    if (prev.current !== numericValue) {
      animate(count, numericValue, { duration: 0.8 });
      prev.current = numericValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  return <Motion.span style={style}>{typeof value === 'number' ? rounded : value}</Motion.span>;
});

const StatPill = memo(({ stat }) => {
  const numericValue = typeof stat.value === 'number' ? stat.value : Number.parseFloat(stat.value) || 0;
  // motion value for animated counter
  const count = useMotionValue(numericValue);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const prev = React.useRef(numericValue);

  useEffect(() => {
    if (prev.current !== numericValue) {
      animate(count, numericValue, { duration: 0.8 });
      prev.current = numericValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  return (
    <Motion.div
      className="travel-stats-pill"
      style={styles.pill}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Motion.span className="travel-stats-value" style={styles.value}>
        {typeof stat.value === 'number' ? rounded : stat.value}
      </Motion.span>
      <span className="travel-stats-label" style={styles.label}>{stat.label}</span>
    </Motion.div>
  );
});

export default memo(TravelStatsWidget);
