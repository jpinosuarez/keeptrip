import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS, FONTS, TRANSITIONS } from '../../../theme';
import { TIER_COLORS } from '../model/achievementDefinitions';
import { useTranslation } from 'react-i18next';

/**
 * Individual achievement badge with locked/unlocked states.
 * Locked achievements show progress + silhouette to invoke curiosity.
 */
const AchievementCard = ({ achievement, isMobile = false }) => {
  const { icon, tier, progress, current, unlocked, criteria } = achievement;
  const tierColor = TIER_COLORS[tier] || COLORS.textSecondary;
  const { t } = useTranslation('hub');

  const name = t(`achievements.${achievement.id}`, achievement.id);
  const description = t(`achievements.${achievement.id}_desc`, '');
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const progressPct = Math.round(progress * 100);

  return (
    <Motion.div
      whileHover={unlocked ? { scale: 1.04, y: -2 } : { scale: 1.01 }}
      transition={{ duration: 0.2 }}
      style={{
        ...styles.card,
        borderColor: unlocked ? `${tierColor}50` : COLORS.border,
        background: unlocked
          ? `linear-gradient(145deg, ${COLORS.surface} 0%, ${tierColor}08 100%)`
          : COLORS.surface,
        cursor: unlocked ? 'default' : 'default',
      }}
    >
      {/* Icon area */}
      <div style={{
        ...styles.iconArea,
        background: unlocked ? `${tierColor}15` : `${COLORS.textSecondary}08`,
      }}>
        {unlocked ? (
          <span style={{ fontSize: isMobile ? '1.8rem' : '2.2rem' }}>{icon}</span>
        ) : (
          <div style={styles.lockedIcon}>
            <span style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', filter: 'grayscale(1) opacity(0.3)' }}>
              {icon}
            </span>
            <Lock size={14} color={COLORS.textSecondary} style={styles.lockBadge} />
          </div>
        )}
      </div>

      {/* Name + tier */}
      <h4 style={{
        ...styles.name,
        color: unlocked ? COLORS.charcoalBlue : COLORS.textSecondary,
      }}>
        {name}
      </h4>

      {unlocked ? (
        <span style={{ ...styles.tierTag, background: `${tierColor}18`, color: tierColor, borderColor: `${tierColor}30` }}>
          {tierLabel}
        </span>
      ) : (
        <>
          <p style={styles.description}>{description}</p>
          {/* Progress bar */}
          <div style={styles.progressContainer}>
            <div style={styles.progressTrack}>
              <Motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ ...styles.progressFill, background: tierColor }}
              />
            </div>
            <span style={styles.progressLabel}>
              {current}/{criteria.threshold}
            </span>
          </div>
        </>
      )}
    </Motion.div>
  );
};

const styles = {
  card: {
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.border}`,
    boxShadow: SHADOWS.sm,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    transition: TRANSITIONS.normal,
    minWidth: 0,
  },
  iconArea: {
    width: '56px',
    height: '56px',
    borderRadius: RADIUS.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: '-4px',
    right: '-8px',
  },
  name: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '800',
    fontFamily: FONTS.heading,
    lineHeight: 1.2,
  },
  description: {
    margin: 0,
    fontSize: '0.72rem',
    color: COLORS.textSecondary,
    lineHeight: 1.3,
    fontFamily: FONTS.body,
  },
  tierTag: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: RADIUS.full,
    fontSize: '0.65rem',
    fontWeight: '800',
    fontFamily: FONTS.heading,
    textTransform: 'uppercase',
    border: '1px solid',
  },
  progressContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  progressTrack: {
    flex: 1,
    height: '4px',
    borderRadius: RADIUS.full,
    background: COLORS.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    whiteSpace: 'nowrap',
  },
};

export default AchievementCard;
