import React, { memo, useEffect } from 'react';
import { motion as Motion, useMotionValue, animate } from 'framer-motion';
import { COLORS } from '@shared/config';
import { styles, mediaQueries } from './TravelStatsWidget.styles';

/**
 * Flexible stats widget used across dashboard, hub, etc.
 * Props:
 *   stats: array of { value, label, icon? }
 *   ariaLabel: string
 *   variant: 'compact' | 'full'  // compact shows first two stats only
 */
const TravelStatsWidget = ({ stats = [], ariaLabel, variant = 'full' }) => {
  if (stats.length === 0) return null;

  const displayed = variant === 'compact' ? stats.slice(0, 2) : stats;

  return (
    <>
      <style>{mediaQueries}</style>
      <div
        role="region"
        aria-label={ariaLabel}
        style={styles.container}
      >
        {displayed.map((stat) => (
          <StatPill key={stat.label} stat={stat} />
        ))}
      </div>
    </>
  );
};

const StatPill = memo(({ stat }) => {
  // motion value for animated counter
  const count = useMotionValue(stat.value);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const prev = React.useRef(stat.value);

  useEffect(() => {
    if (prev.current !== stat.value) {
      animate(count, stat.value, { duration: 0.8 });
      prev.current = stat.value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stat.value]);

  return (
    <Motion.div
      className="travel-stats-pill"
      style={styles.pill}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span style={styles.icon}>{stat.icon || null}</span>
      <Motion.span className="travel-stats-value" style={styles.value}>{rounded}</Motion.span>
      <span className="travel-stats-label" style={styles.label}>{stat.label}</span>
    </Motion.div>
  );
});

export default memo(TravelStatsWidget);
