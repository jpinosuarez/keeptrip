import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const welcomeStyles = {
  card: (isMobile) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: isMobile ? '16px' : '18px',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    border: `1px solid ${COLORS.border}`,
    boxShadow: SHADOWS.sm,
    position: 'relative',
    overflow: 'hidden',
  }),

  decorLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },

  decorOrbA: {
    position: 'absolute',
    width: '140px',
    height: '140px',
    right: '-44px',
    top: '-56px',
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(255,107,53,0.16) 0%, rgba(255,107,53,0) 72%)',
  },

  decorOrbB: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    left: '-38px',
    bottom: '-60px',
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(69,176,168,0.14) 0%, rgba(69,176,168,0) 74%)',
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
  },

  identityGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative',
    zIndex: 1,
  },

  title: {
    margin: 0,
    fontSize: 'clamp(1.3rem, 2.3vw, 1.7rem)',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  subtitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 1.35,
  },

  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 10px',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.full,
    boxShadow: 'none',
    border: `1px solid ${COLORS.border}`,
    marginTop: '2px',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },

  badgeLevelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: RADIUS.full,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    cursor: 'pointer',
    color: COLORS.charcoalBlue,
    fontWeight: 800,
    fontSize: '0.875rem',
  },

  badgeLevel: {
    fontSize: '0.875rem',
    fontWeight: '800',
    color: COLORS.atomicTangerine,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  badgeProgress: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
    opacity: 0.9,
    whiteSpace: 'nowrap',
  },

  statsWrapper: {
    marginTop: '4px',
    position: 'relative',
    zIndex: 1,
  },
  
  ctaDesktop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '12px 24px',
    fontSize: '0.95rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 8px 16px ${COLORS.atomicTangerine}40, inset 0 -2px 0 rgba(0,0,0,0.1)`,
    minHeight: '56px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    letterSpacing: '-0.01em',
    transformOrigin: 'center',
  },
};
