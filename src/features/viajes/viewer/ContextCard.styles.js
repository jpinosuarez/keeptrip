import { COLORS, RADIUS, SHADOWS, GLASS, TRANSITIONS } from '@shared/config';

export const contextCardStyles = {
  card: {
    ...GLASS.light,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.lg,
    padding: '16px',
    boxShadow: SHADOWS.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: TRANSITIONS.fast,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: COLORS.mutedTeal,
  },
  value: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 1.4,
  },
  childrenWrapper: {
    marginTop: '4px',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
};
