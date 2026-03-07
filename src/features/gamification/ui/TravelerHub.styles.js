import { COLORS, SHADOWS, RADIUS, FONTS, TRANSITIONS } from '@shared/config';

export const styles = {
  container: (isMobile) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '0 0 14px 0' : '0 20px 20px 0',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }),

  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '6px',
    paddingBottom: '40px',
  },

  // ── Hero Card ──
  heroCard: (levelColor) => ({
    background: `linear-gradient(135deg, ${COLORS.charcoalBlue} 0%, ${levelColor}30 100%)`,
    borderRadius: RADIUS.xl,
    padding: '28px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
    flexWrap: 'wrap',
  }),
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 1,
  },
  heroIcon: {
    fontSize: '3rem',
    lineHeight: 1,
  },
  heroLabel: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '900',
    fontFamily: FONTS.heading,
    color: 'white',
  },
  heroSublabel: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.body,
  },
  heroProgressOuter: {
    width: '200px',
    maxWidth: '100%',
    height: '8px',
    borderRadius: RADIUS.full,
    background: 'rgba(255,255,255,0.15)',
    marginTop: '4px',
    overflow: 'hidden',
  },
  heroProgressInner: (color) => ({
    height: '100%',
    borderRadius: RADIUS.full,
    background: color,
    transition: 'width 0.6s ease',
  }),
  heroRight: {
    display: 'flex',
    gap: '12px',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  heroStat: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
    backdropFilter: 'blur(4px)',
  },
  heroStatValue: {
    fontSize: '1.3rem',
    fontWeight: '900',
    fontFamily: FONTS.heading,
    color: 'white',
    lineHeight: 1,
  },
  heroStatLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    fontFamily: FONTS.heading,
    marginTop: '4px',
  },

  // ── Section header ──
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
    fontFamily: FONTS.heading,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
  },
  sectionMeta: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ── Achievement grid ──
  achievementsGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile
      ? 'repeat(2, 1fr)'
      : 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: isMobile ? '10px' : '14px',
    marginBottom: '24px',
  }),

  // ── Next Goals card ──
  goalsCard: {
    background: `linear-gradient(145deg, ${COLORS.linen} 0%, ${COLORS.surface} 60%)`,
    borderRadius: RADIUS.xl,
    border: `1px solid ${COLORS.border}`,
    boxShadow: SHADOWS.sm,
    padding: '20px 24px',
    marginBottom: '24px',
  },
  goalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  goalRowLast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
  },
  goalIcon: {
    fontSize: '1.4rem',
    filter: 'grayscale(0.6)',
  },
  goalText: {
    flex: 1,
    fontSize: '0.85rem',
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    margin: 0,
  },
  goalProgress: {
    fontSize: '0.75rem',
    fontWeight: '800',
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
  },

  // ── Decorative ring behind hero card ──
  heroRing: (color) => ({
    position: 'absolute',
    right: '-60px',
    top: '-40px',
    width: '200px',
    height: '200px',
    borderRadius: RADIUS.full,
    border: `3px solid ${color}30`,
    pointerEvents: 'none',
  }),
  heroRing2: (color) => ({
    position: 'absolute',
    right: '-30px',
    top: '-10px',
    width: '140px',
    height: '140px',
    borderRadius: RADIUS.full,
    border: `2px solid ${color}20`,
    pointerEvents: 'none',
  }),
};
