import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { COLORS, SHADOWS, RADIUS, FONTS, Z_INDEX } from '@shared/config';
import { TIER_COLORS } from '@features/gamification';
import { useTranslation } from 'react-i18next';

const fireConfetti = (color) => {
  if (typeof window === 'undefined') return;
  const end = Date.now() + 2500;
  const colors = [color || COLORS.atomicTangerine, '#FFD700', '#FF6B35', '#10B981'];

  confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors });

  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

const LevelUpCard = ({ level, onNext, isLast, t }) => (
  <Motion.div
    initial={{ scale: 0.5, opacity: 0, y: 30 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
    onClick={(e) => e.stopPropagation()}
    style={cardStyles.card}
  >
    <div style={{ fontSize: '4rem', marginBottom: '12px', lineHeight: 1 }}>
      {level.icon}
    </div>
    <h2 style={cardStyles.title}>{t('hub:levelup.title')}</h2>
    <p style={{ ...cardStyles.highlight, color: level.color }}>{level.label}</p>
    <p style={cardStyles.body}>
      {t('hub:levelup.message')}
    </p>
    <button type="button" onClick={onNext} style={{ ...cardStyles.btn, background: level.color, boxShadow: `0 4px 14px ${level.color}40` }}>
      {isLast ? t('hub:celebration.great') : t('hub:celebration.next')}
    </button>
  </Motion.div>
);

const AchievementUnlockCard = ({ achievement, onNext, isLast, t }) => {
  const tierColor = TIER_COLORS[achievement.tier] || COLORS.atomicTangerine;
  return (
    <Motion.div
      initial={{ scale: 0.5, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      onClick={(e) => e.stopPropagation()}
      style={cardStyles.card}
    >
      <Motion.div
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ fontSize: '3.5rem', marginBottom: '12px', lineHeight: 1 }}
      >
        {achievement.icon}
      </Motion.div>
      <h2 style={cardStyles.title}>{t('hub:achievements.unlocked')}</h2>
      <p style={{ ...cardStyles.highlight, color: tierColor }}>{achievement.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
      <div style={{ ...cardStyles.tierBadge, background: `${tierColor}18`, border: `1px solid ${tierColor}40`, color: tierColor }}>
        {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
      </div>
      <button type="button" onClick={onNext} style={{ ...cardStyles.btn, background: tierColor, boxShadow: `0 4px 14px ${tierColor}40` }}>
        {isLast ? t('hub:celebration.great') : t('hub:celebration.next')}
      </button>
    </Motion.div>
  );
};

const SummaryCard = ({ celebrations, onDismiss, t }) => (
  <Motion.div
    initial={{ scale: 0.5, opacity: 0, y: 30 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
    onClick={(e) => e.stopPropagation()}
    style={{ ...cardStyles.card, padding: '32px 36px' }}
  >
    <div style={{ fontSize: '2.5rem', marginBottom: '8px', lineHeight: 1 }}>🏆</div>
    <h2 style={cardStyles.title}>{t('hub:achievements.summaryTitle')}</h2>
    <p style={{ ...cardStyles.body, marginBottom: '16px' }}>
      {t('hub:achievements.summaryBody', { count: celebrations.length })}
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '20px' }}>
      {celebrations.map((c, i) => {
        const isLevel = c.type === 'level-up';
        const color = isLevel ? c.data.color : TIER_COLORS[c.data.tier] || COLORS.atomicTangerine;
        const icon = c.data.icon;
        const label = isLevel ? t('hub:celebration.levelPrefix', { label: c.data.label }) : c.data.id.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
        return (
          <div
            key={`${c.type}-${i}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: RADIUS.md,
              background: `${color}10`, border: `1px solid ${color}30`,
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <span style={{ fontWeight: '700', color: COLORS.charcoalBlue, fontSize: '0.9rem', fontFamily: FONTS.heading }}>{label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: '700', color, textTransform: 'uppercase' }}>
              {isLevel ? t('hub:celebration.level') : c.data.tier}
            </span>
          </div>
        );
      })}
    </div>
    <button type="button" onClick={onDismiss} style={{ ...cardStyles.btn, background: COLORS.atomicTangerine, boxShadow: SHADOWS.glow }}>
      {t('hub:celebration.amazing')}
    </button>
  </Motion.div>
);

/**
 * CelebrationQueue — replaces the old LevelUpModal.
 * Renders one celebration at a time, or a summary if 3+ are queued.
 */
const CelebrationQueue = ({ celebrations, onDismiss, onDismissAll }) => {
  const { t } = useTranslation('hub');
  const current = celebrations[0];
  const isLast = celebrations.length === 1;
  const showSummary = celebrations.length >= 3;

  useEffect(() => {
    if (current) {
      const color = current.type === 'level-up'
        ? current.data.color
        : TIER_COLORS[current.data.tier];
      fireConfetti(color);
    }
  }, [current]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={showSummary ? onDismissAll : onDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: Z_INDEX.celebration,
          cursor: 'pointer',
        }}
      >
        {showSummary ? (
          <SummaryCard celebrations={celebrations} onDismiss={onDismissAll} t={t} />
        ) : current.type === 'level-up' ? (
          <LevelUpCard level={current.data} onNext={onDismiss} isLast={isLast} t={t} />
        ) : (
          <AchievementUnlockCard achievement={current.data} onNext={onDismiss} isLast={isLast} t={t} />
        )}
      </Motion.div>
    </AnimatePresence>
  );
};

const cardStyles = {
  card: {
    background: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: '40px 48px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    boxShadow: SHADOWS.float,
    border: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONTS.heading, fontWeight: '900',
    fontSize: '1.5rem', color: COLORS.charcoalBlue, margin: '0 0 8px 0',
  },
  highlight: {
    fontFamily: FONTS.heading, fontWeight: '700',
    fontSize: '1.15rem', margin: '0 0 16px 0',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: '0.9rem', color: COLORS.textSecondary, margin: '0 0 24px 0', lineHeight: 1.5,
  },
  btn: {
    border: 'none', borderRadius: RADIUS.md,
    padding: '10px 24px',
    color: 'white',
    fontWeight: '800', fontSize: '0.9rem',
    fontFamily: FONTS.heading,
    cursor: 'pointer',
  },
  tierBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: RADIUS.full,
    fontSize: '0.75rem',
    fontWeight: '800',
    fontFamily: FONTS.heading,
    marginBottom: '20px',
  },
};

export default CelebrationQueue;
