import { COLORS, RADIUS, SHADOWS, GLASS } from '@shared/config';

export const routeMapStyles = {
  container: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    border: `1px solid ${COLORS.border}`,
    position: 'relative',
  },
  activeLabel: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    ...GLASS.dark,
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full,
    padding: '8px 18px',
    fontSize: '0.85rem',
    fontWeight: '700',
    boxShadow: SHADOWS.lg,
    pointerEvents: 'none',
    zIndex: 3,
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100% - 32px)',
    textAlign: 'center',
  },
  // Estilos específicos para la versión modal (mobile fullscreen)
  modalContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
};
