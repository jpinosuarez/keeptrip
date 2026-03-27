import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const emptyStyles = {
  container: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.xl,
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    textAlign: 'center',
    boxShadow: SHADOWS.sm,
    width: '100%',
    minHeight: '320px',
    position: 'relative',
    overflow: 'hidden',
  },

  artWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    height: '100px',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderRadius: '50%',
    marginBottom: '8px',
  },

  sparkleContainer: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: COLORS.surface,
    borderRadius: '50%',
    padding: '8px',
    display: 'flex',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },

  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-0.01em',
  },

  text: {
    margin: 0,
    fontSize: '1rem',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    maxWidth: '320px',
    fontWeight: '500',
  },

  cta: {
    marginTop: '8px',
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '14px 32px',
    fontSize: '1rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 8px 20px ${COLORS.atomicTangerine}40, inset 0 -2px 0 rgba(0,0,0,0.1)`,
    minHeight: '56px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
