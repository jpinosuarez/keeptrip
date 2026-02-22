import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '../../theme';

export const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    ...GLASS.overlay,
    zIndex: 12000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.md,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden'
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: COLORS.danger,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    margin: 0,
    color: COLORS.charcoalBlue,
    fontSize: '1.2rem',
    lineHeight: 1.25
  },
  message: {
    margin: 0,
    color: COLORS.textSecondary,
    lineHeight: 1.6
  },
  footer: {
    borderTop: `1px solid ${COLORS.border}`,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  cancelBtn: (disabled = false) => ({
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    borderRadius: RADIUS.full,
    fontWeight: 700,
    padding: '10px 18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    transition: TRANSITIONS.fast
  }),
  confirmBtn: (disabled = false) => ({
    border: 'none',
    backgroundColor: COLORS.danger,
    color: 'white',
    borderRadius: RADIUS.full,
    fontWeight: 700,
    padding: '10px 18px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: SHADOWS.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.8 : 1,
    transition: TRANSITIONS.fast
  })
};
