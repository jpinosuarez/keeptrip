import { COLORS, SHADOWS, RADIUS, TRANSITIONS } from '@shared/config';

export const styles = {
  header: (isMobile) => ({
    minHeight: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '0 10px' : '0 30px',
    gap: isMobile ? '8px' : '16px',
    backgroundColor: 'transparent',
    zIndex: 100,
    transition: TRANSITIONS.normal
  }),
  leftSide: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  breadcrumb: { color: COLORS.textSecondary, fontSize: '0.85rem', fontWeight: '500' },
  separator: { color: COLORS.textSecondary, opacity: 0.5 },
  titulo: (isMobile) => ({
    fontSize: isMobile ? '1rem' : '1.2rem',
    color: COLORS.charcoalBlue,
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }),
  menuButton: {
    width: '44px',
    height: '44px',
    borderRadius: RADIUS.md,
    border: '1px solid rgba(0,0,0,0.08)',
    backgroundColor: COLORS.surface,
    color: COLORS.charcoalBlue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: TRANSITIONS.fast
  },
  rightSide: (isMobile) => ({
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '20px',
    minWidth: 0
  }),
  searchContainer: (isMobile) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: '8px 12px',
    borderRadius: RADIUS.md,
    border: '1px solid rgba(0,0,0,0.02)',
    minWidth: isMobile ? '0' : '280px',
    width: isMobile ? '44vw' : 'auto'
  }),
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: COLORS.charcoalBlue,
    width: '100%'
  },
  clearButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    margin: '-8px'
  },
  addButton: (isMobile) => ({
    backgroundColor: COLORS.atomicTangerine,
    color: COLORS.linen,
    border: 'none',
    padding: isMobile ? '10px' : '10px 20px',
    borderRadius: RADIUS.md,
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0' : '8px',
    boxShadow: `0 4px 12px ${COLORS.atomicTangerine}40`,
    whiteSpace: 'nowrap',
    transition: TRANSITIONS.fast,
    minHeight: '44px'
  }),
  addButtonLabel: {
    display: 'inline-flex',
    alignItems: 'center'
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sandyBrown,
    border: `2px solid ${COLORS.surface}`,
    boxShadow: SHADOWS.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    flexShrink: 0
  },
  avatarInitials: {
    fontWeight: '700',
    fontSize: '0.85rem',
    letterSpacing: '0.5px'
  }
};
