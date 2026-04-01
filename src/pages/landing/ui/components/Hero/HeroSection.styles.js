import { COLORS, FONTS, RADIUS } from '@shared/config';

export const styles = {
  hero: (isMobile) => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '40px 24px 20px' : '90px 48px 80px',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
    gap: isMobile ? '48px' : '72px',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  }),

  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '28px',
  },

  kicker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: COLORS.mutedTeal,
    textTransform: 'uppercase',
    letterSpacing: '1.8px',
    backgroundColor: `${COLORS.mutedTeal}15`,
    padding: '10px 20px',
    borderRadius: RADIUS.full,
    border: `1.5px solid ${COLORS.mutedTeal}30`,
  },

  title: (isMobile) => ({
    fontSize: isMobile ? '3.2rem' : '4.8rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.05,
    margin: 0,
    letterSpacing: isMobile ? '-1px' : '-2.5px',
  }),

  highlight: {
    color: COLORS.atomicTangerine,
    display: 'inline-block',
  },

  subtitle: {
    fontSize: '1.15rem',
    color: COLORS.textSecondary,
    maxWidth: '520px',
    lineHeight: 1.7,
    margin: 0,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },

  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '0 40px',
    fontSize: '1.1rem',
    fontWeight: '800',
    background: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${COLORS.atomicTangerine}40`,
    minHeight: '56px', // Solid mobile-first touch target
    minWidth: '260px',
    fontFamily: FONTS.heading,
  },
};
