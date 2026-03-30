import { COLORS, RADIUS, SHADOWS, TRANSITIONS, SPACING, ANIMATION_DELAYS } from '@shared/config';

// Hardening: text overflow + i18n support
export const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  heroContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: COLORS.textSecondary,
    opacity: 0.7,
    margin: 0,
  },
  heroValue: {
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    fontWeight: 900,
    color: COLORS.atomicTangerine,
    lineHeight: 0.9,
    letterSpacing: '-0.04em',
    margin: 0,
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 12vw, 140px), 1fr))',
    gap: '12px 16px',
    width: '100%',
  },
  secondaryStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    minWidth: 0, /* /harden: allow shrinking below content in flex */
    minHeight: 0,
  },
  value: {
    fontSize: 'clamp(1.3rem, 1.8vw, 1.6rem)',
    fontWeight: 900,
    color: COLORS.charcoalBlue,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: COLORS.textSecondary,
    letterSpacing: '0.04em',
    margin: 0,
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto',
  },
  compactContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '24px',
    width: '100%',
  },

  // HOME VARIANT: Horizontal layout with hero on left, secondary on right
  homeShell: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? SPACING.sm : SPACING.lg,
    width: '100%',
    justifyContent: isMobile ? 'flex-start' : 'space-between',
  }),
  homeHeroContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    flexShrink: 0,
    /* PHASE 1: Visual hierarchy via subtle divider (no card) */
    borderRight: `1px solid ${COLORS.border}`,
    paddingRight: SPACING.lg,
    marginRight: SPACING.lg,
  },
  homeHeroLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: COLORS.textSecondary,
    opacity: 0.65,
    margin: 0,
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  homeHeroValue: {
    /* PHASE 2: Reduce clamp floor for mobile fit (was 1.5rem, now 1.25rem) */
    fontSize: 'clamp(1.25rem, 4vw, 3rem)',
    fontWeight: 900,
    color: COLORS.atomicTangerine,
    lineHeight: 0.85,
    letterSpacing: '-0.05em',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  homeSecondaryGrid: (isMobile) => ({
    display: 'grid',
    /* PHASE 2: Tighter mobile grid to ensure all 4 stats visible without scroll */
    gridTemplateColumns: isMobile
      ? 'repeat(2, 1fr)'
      : 'repeat(auto-fit, minmax(clamp(80px, 20vw, 120px), 1fr))',
    gap: isMobile ? SPACING.xs : `${SPACING.md} ${SPACING.lg}`,
    alignItems: 'start',
    flex: 1,
    width: '100%',
  }),
  homeSecondaryStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    minWidth: 0, /* /harden: prevent overflow from overflowing flex container */
    width: '100%',
  },

  // TRIPS VARIANT: Compact for TripCommandBar header
  tripsShell: {
    display: 'grid',
    gridTemplateColumns: '1fr repeat(3, 1fr)',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
  },
  tripsHeroContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    /* PHASE 1: Subtle divider on trips variant too */
    borderRight: `1px solid ${COLORS.border}`,
    paddingRight: SPACING.md,
  },
  tripsHeroLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: COLORS.textSecondary,
    opacity: 0.6,
    margin: 0,
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  tripsHeroValue: {
    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
    fontWeight: 900,
    color: COLORS.atomicTangerine,
    lineHeight: 0.85,
    letterSpacing: '-0.04em',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  tripsSecondaryGrid: {
    /* PHASE 2: Removed display:contents for cross-browser compatibility */
    /* Using grid layout directly on parent (tripsShell) instead */
    display: 'contents',
  },
  tripsSecondaryStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    minWidth: 0,
    minHeight: 0,
  },
  tripsValue: {
    fontSize: 'clamp(1.4rem, 2.2vw, 1.8rem)',
    fontWeight: 900,
    color: COLORS.charcoalBlue,
    lineHeight: 0.9,
    letterSpacing: '-0.02em',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  tripsLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: COLORS.textSecondary,
    letterSpacing: '0.04em',
    margin: 0,
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto',
  },

  /* /harden: wrapper for stat display to handle overflow */
  statDisplayWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
    minWidth: 0,
    width: '100%',
  },

  /* PHASE 3: Aspirational Empty State */
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
    minHeight: '120px',
  },
  emptyStateLabel: {
    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
    fontWeight: 600,
    color: COLORS.textSecondary,
    opacity: 0.75,
    letterSpacing: '0.03em',
    margin: 0,
  },
  emptyStateMessage: {
    fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
    fontWeight: 400,
    color: COLORS.textSecondary,
    opacity: 0.6,
    lineHeight: 1.5,
    letterSpacing: '0.02em',
    margin: 0,
    maxWidth: '280px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
};