import { FONTS, COLORS, RADIUS } from '@shared/config';

export const styles = {
  nav: (isMobile) => ({
    padding: isMobile ? '20px 24px' : '28px 48px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  }),

  logo: {
    fontSize: '1.6rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-1.2px',
  },

  loginBtn: {
    padding: '12px 28px',
    borderRadius: RADIUS['2xl'] || '99px',
    border: `2px solid ${COLORS.atomicTangerine}`,
    background: 'transparent',
    color: COLORS.atomicTangerine,
    fontWeight: '800',
    cursor: 'pointer',
    minHeight: '48px',
    minWidth: '48px', // Mobile touch target
    fontFamily: FONTS.heading,
    fontSize: '0.95rem',
  },
};
