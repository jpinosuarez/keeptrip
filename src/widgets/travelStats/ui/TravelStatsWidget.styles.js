import { COLORS, RADIUS, SHADOWS, SPACING } from '@shared/config';

const cardBase = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: '8px',
  borderRadius: RADIUS.xl,
  padding: '12px',
  minWidth: 0,
  minHeight: 0,
  background: 'rgba(255, 255, 255, 0.78)',
  border: `1px solid rgba(15, 23, 42, 0.08)`,
  boxShadow: SHADOWS.sm,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export const styles = {
  shell: {
    width: '100%',
    height: '100%',
  },
  heroGridMobile: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gridAutoRows: 'auto',
    alignItems: 'stretch',
    width: '100%',
  },
  heroGridDesktop: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'minmax(0, 1.15fr) repeat(2, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, min-content)',
    alignItems: 'stretch',
    width: '100%',
    height: '100%',
  },
  compactGridMobile: {
    display: 'grid',
    gap: SPACING.sm,
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gridAutoRows: 'minmax(92px, auto)',
    alignItems: 'stretch',
    width: '100%',
  },
  compactGridDesktop: {
    display: 'grid',
    gap: SPACING.sm,
    gridTemplateColumns: 'repeat(5, minmax(max-content, 1fr))',
    alignItems: 'center',
    justifyItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  card: cardBase,
  compactCard: {
    padding: '8px 16px', // Uses 8px/16px spacing system for horizontal pill shape
    gap: '0px',
    borderRadius: '9999px', // Perfect pill border radius
  },
  secondaryCard: {
    justifyContent: 'center',
  },
  heroCard: {
    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.16), rgba(69, 176, 168, 0.12))',
    minHeight: 'auto',
    padding: '20px 20px',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
    border: '1px solid rgba(255, 107, 53, 0.14)',
  },
  compactHeroCard: {
    minHeight: 'auto',
    boxShadow: SHADOWS.sm,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  heroCardBody: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    height: '100%',
    gap: '8px',
  },
  secondaryCardBody: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '8px',
    height: '100%',
    width: '100%',
  },
  secondaryTextLayout: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0px',
    minWidth: 0,
    flex: 1,
  },
  // ----- NEW RULES FOR TRIPS PAGE ------
  compactSecondaryCardBody: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
    width: '100%',
  },
  compactSecondaryTextLayout: {
    alignItems: 'center',
    textAlign: 'center',
    flex: '0 1 auto',
  },
  secondaryIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '12px', // Squircle instead of exact circle
    backgroundColor: 'rgba(69, 176, 168, 0.12)', // Subtle teal for contrast against the orange hero
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  secondaryIcon: {
    color: COLORS.mutedTeal, // Changed from tangerine to teal for variety
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 'clamp(1.1rem, 1.4vw, 1.35rem)',
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: COLORS.charcoalBlue,
    margin: 0,
    minWidth: 0,
  },
  heroValue: {
    fontSize: 'clamp(2rem, 3vw, 2.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: COLORS.atomicTangerine,
    lineHeight: 1,
  },
  compactValue: {
    fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
  },
  compactHeroValue: {
    fontSize: 'clamp(1.5rem, 2.8vw, 1.9rem)',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    margin: 0,
    lineHeight: 1.2,
  },
  secondaryLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    color: '#64748b', // Slate 500 for better secondary contrast
    margin: 0,
    lineHeight: 1.2,
  },
  hint: {
    fontSize: '0.62rem',
    lineHeight: 1.2,
    color: COLORS.textSecondary,
    opacity: 0.68,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    background: 'rgba(255, 255, 255, 0.65)',
    border: `1px dashed rgba(15, 23, 42, 0.12)`,
  },
  emptyStateTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: COLORS.charcoalBlue,
  },
  emptyStateMessage: {
    fontSize: '0.8rem',
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
  heroPositionMobile: {
    gridColumn: '1 / -1',
    gridRow: '1',
  },
  uniqueCountriesPositionMobile: {
    gridColumn: '1',
    gridRow: '2',
  },
  completedTripsPositionMobile: {
    gridColumn: '2',
    gridRow: '2',
  },
  totalDaysPositionMobile: {
    gridColumn: '1',
    gridRow: '3',
  },
  totalStopsPositionMobile: {
    gridColumn: '2',
    gridRow: '3',
  },
  heroPositionDesktop: {
    gridColumn: '1',
    gridRow: '1 / span 2',
    minHeight: '100%',
  },
  uniqueCountriesPositionDesktop: {
    gridColumn: '2',
    gridRow: '1',
  },
  completedTripsPositionDesktop: {
    gridColumn: '3',
    gridRow: '1',
  },
  totalDaysPositionDesktop: {
    gridColumn: '2',
    gridRow: '2',
  },
  totalStopsPositionDesktop: {
    gridColumn: '3',
    gridRow: '2',
  },
  compactHeroPositionDesktop: {
    flex: '0 0 auto',
  },
  compactUniqueCountriesPositionDesktop: {
    flex: '0 0 auto',
  },
  compactCompletedTripsPositionDesktop: {
    flex: '0 0 auto',
  },
  compactTotalDaysPositionDesktop: {
    flex: '0 0 auto',
  },
  compactTotalStopsPositionDesktop: {
    flex: '0 0 auto',
  },
  compactHeroPositionMobile: {
    gridColumn: '1 / -1',
    gridRow: '1',
  },
  compactUniqueCountriesPositionMobile: {
    gridColumn: '1',
    gridRow: '2',
  },
  compactCompletedTripsPositionMobile: {
    gridColumn: '2',
    gridRow: '2',
  },
  compactTotalDaysPositionMobile: {
    gridColumn: '1',
    gridRow: '3',
  },
  compactTotalStopsPositionMobile: {
    gridColumn: '2',
    gridRow: '3',
  },
};