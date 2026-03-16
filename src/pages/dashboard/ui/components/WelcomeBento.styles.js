import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const welcomeStyles = {
  card: (isMobile) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: isMobile ? '20px' : '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: RADIUS.xl,
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)`,
    position: 'relative',
    overflow: 'hidden',
  }),

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
    gap: '8px',
  },

  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  subtitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },

  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: RADIUS.full,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid rgba(44, 62, 80, 0.05)',
    marginTop: '4px',
  },

  badgeLevelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255, 255, 255, 0.92)',
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
    fontSize: '0.75rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
    opacity: 0.8,
  },

  statsWrapper: {
    marginTop: '8px',
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
