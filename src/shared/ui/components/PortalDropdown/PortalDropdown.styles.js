import { RADIUS, COLORS } from '@shared/config';

export const styles = {
  menuContainer: {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: RADIUS.xl,
    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
    padding: '8px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid rgba(0,0,0,0.05)'
  }
};
