import React from 'react';
import { motion as Motion } from 'framer-motion';
import { COLORS, RADIUS, FONTS, SHADOWS } from '@shared/config';
import { TIER_COLORS, TIER_GLOW } from '../model/achievementDefinitions';
import { useTranslation } from 'react-i18next';

/**
 * Prestige Achievement Token (2026 Redesign)
 *
 * Unlocked: Convex hexagon shell with tier radial glow + emoji center.
 *           Spring bounce on mount. Shimmer sweep CSS animation.
 * Locked:   Same shell but greyscale + SVG circular progress ring.
 *           Silhouette visible to keep curiosity alive.
 */

// SVG Progress Ring — Apple Fitness style
const ProgressRing = ({ progress, color, size = 72, stroke = 5 }) => {
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={stroke}
      />
      {/* Fill */}
      <Motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  );
};

const AchievementCard = ({ achievement, isMobile = false }) => {
  const { icon, tier, progress, current, unlocked, criteria } = achievement;
  const tierColor  = TIER_COLORS[tier] || COLORS.textSecondary;
  const tierGlow   = TIER_GLOW[tier]   || 'rgba(0,0,0,0.1)';
  const { t } = useTranslation('hub');

  const name        = t(`achievements.${achievement.id}`, achievement.id);
  const description = t(`achievements.${achievement.id}_desc`, '');
  const tierLabel   = tier.charAt(0).toUpperCase() + tier.slice(1);
  const progressPct = Math.round(progress * 100);
  const tokenSize   = isMobile ? 60 : 72;

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-10px' }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      whileHover={unlocked ? { scale: 1.06, y: -3 } : { scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      style={styles.card(unlocked, tierColor)}
    >
      {/* ── Prestige Token ── */}
      <div style={{ position: 'relative', width: tokenSize, height: tokenSize, flexShrink: 0 }}>
        {/* SVG Ring (locked only) */}
        {!unlocked && (
          <ProgressRing
            progress={progress}
            color={tierColor}
            size={tokenSize}
            stroke={isMobile ? 4 : 5}
          />
        )}

        {/* Hexagonal token shell */}
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: RADIUS.xl,
            background: unlocked
              ? `radial-gradient(circle at 35% 35%, ${tierColor}CC, ${tierColor}88)`
              : `rgba(0, 0, 0, 0.05)`,
            boxShadow: unlocked
              ? `0 4px 20px ${tierGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer sweep (unlocked only) */}
          {unlocked && (
            <div style={styles.shimmer} aria-hidden="true" />
          )}

          <span
            style={{
              fontSize: isMobile ? '1.6rem' : '2rem',
              filter: unlocked ? 'none' : 'grayscale(1) opacity(0.25)',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1,
            }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* ── Text content ── */}
      <div style={styles.textBlock}>
        <h4 style={{ ...styles.name, color: unlocked ? COLORS.charcoalBlue : COLORS.textSecondary }}>
          {name}
        </h4>

        {unlocked ? (
          <>
            <span style={{ ...styles.tierTag, background: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}40` }}>
              {tierLabel}
            </span>
            <span style={styles.criteriaLabel}>
              {t('achievements.criteriaMet', {
                count: criteria.threshold,
                unit:
                  criteria.type === 'countries'
                    ? t('goals.units.countries_other')
                    : criteria.type === 'trips'
                    ? t('goals.units.trips_other')
                    : criteria.type === 'continents'
                    ? t('goals.units.continents_other')
                    : criteria.type === 'detailed_trips'
                    ? t('goals.units.detailed_trips_other')
                    : criteria.type,
              })}
            </span>
          </>
        ) : (
          <>
            {description ? (
              <p style={styles.description}>{description}</p>
            ) : null}
            <div style={styles.progressRow}>
              <div style={styles.progressTrack}>
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ ...styles.progressFill, background: tierColor }}
                />
              </div>
              <span style={{ ...styles.progressLabel, color: tierColor }}>
                {progressPct}%
              </span>
            </div>
            {criteria.threshold > 1 && (
              <span style={styles.countLabel}>{current} / {criteria.threshold}</span>
            )}
          </>
        )}
      </div>
    </Motion.div>
  );
};

const styles = {
  card: (unlocked, tierColor) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    borderRadius: RADIUS.xl,
    border: `1px solid ${unlocked ? `${tierColor}40` : 'rgba(0,0,0,0.06)'}`,
    padding: '14px 16px',
    background: unlocked
      ? `linear-gradient(145deg, #fff 0%, ${tierColor}08 100%)`
      : '#fafafa',
    boxShadow: unlocked ? SHADOWS.sm : 'none',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  }),

  shimmer: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)',
    animation: 'shimmerSweep 2.4s ease-in-out infinite',
    zIndex: 0,
  },

  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    minWidth: 0,
    flex: 1,
  },

  name: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: '800',
    fontFamily: FONTS.heading,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    width: '100%',
  },

  description: {
    margin: 0,
    fontSize: '0.7rem',
    color: COLORS.charcoalBlue,
    lineHeight: 1.3,
    fontFamily: FONTS.body,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  tierTag: {
    display: 'inline-flex',
    padding: '8px 12px',
    borderRadius: RADIUS.full,
    fontSize: '0.65rem',
    fontWeight: '800',
    fontFamily: FONTS.heading,
    textTransform: 'uppercase',
    border: '1px solid',
    width: 'fit-content',
    minHeight: '32px',
    alignItems: 'center',
  },

  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  progressTrack: {
    flex: 1,
    height: '4px',
    borderRadius: RADIUS.full,
    background: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  progressLabel: {
    fontSize: '0.68rem',
    fontWeight: '800',
    fontFamily: FONTS.mono,
    whiteSpace: 'nowrap',
  },

  countLabel: {
    fontSize: '0.65rem',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
};

export default AchievementCard;
