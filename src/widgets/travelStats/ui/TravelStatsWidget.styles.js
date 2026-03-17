import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';

export const mediaQueries = `
  @media (max-width: 768px) {
    .travel-stats-pill {
      min-height: 44px !important;
      min-width: 90px !important;
      padding: 6px 12px !important;
    }
    .travel-stats-value {
      font-size: 1.2rem !important;
    }
    .travel-stats-label {
      font-size: 0.65rem !important;
      margin-top: 2px !important;
    }
  }
`;

export const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: '8px',
    overflowX: 'auto',
    padding: '12px 0',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  pill: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '56px',
    minWidth: '112px',
    padding: '10px 16px',
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: `1px solid rgba(44,62,80,0.08)`,
    boxShadow: SHADOWS.md,
    position: 'relative',
    flexShrink: 0,
    transition: TRANSITIONS.normal,
  },
  iconWrap: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '8px',
  },
  iconCircle: {
    width: '34px',
    height: '34px',
    borderRadius: RADIUS.full,
    background: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 14px rgba(0,0,0,0.08)`,
    color: COLORS.atomicTangerine,
  },
  value: {
    fontSize: '1.8rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '5px',
  },
};
