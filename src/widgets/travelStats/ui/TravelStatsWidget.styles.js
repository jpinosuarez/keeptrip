import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';

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
    gap: '6px',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
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
    gap: '4px',
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 'clamp(1.3rem, 1.8vw, 1.6rem)',
    fontWeight: 900,
    color: COLORS.charcoalBlue,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  label: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
  },
  compactContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '24px',
    width: '100%',
  },
};