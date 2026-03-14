import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS, FONTS } from '@shared/config';

export const styles = {
  // ─── DESKTOP: Slide-over Panel ───
  desktopScrim: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...GLASS.overlay,
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
  },
  desktopPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 'min(480px, 60vw)',
    height: '100dvh',
    backgroundColor: COLORS.surface,
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: SHADOWS.float,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `1px solid ${COLORS.border}`,
  },

  // ─── MOBILE: Full-screen Sheet ───
  mobileScrim: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...GLASS.overlay,
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
  },
  mobileSheet: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    boxShadow: SHADOWS.float,
  },

  // ─── SHARED: Header ───
  stickyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    padding: '20px',
    borderBottom: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  headerFlagImg: {
    width: '40px',
    height: '32px',
    borderRadius: RADIUS.sm,
    objectFit: 'cover',
    boxShadow: SHADOWS.sm,
    border: `1px solid ${COLORS.border}`,
  },
  headerTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: COLORS.charcoalBlue,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(255, 107, 53, 0.1)',
    color: COLORS.atomicTangerine,
    border: `1px solid ${COLORS.atomicTangerine}20`,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    transition: TRANSITIONS.fast,
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
      color: COLORS.charcoalBlue,
    },
  },
  saveStatusBadge: (status) => {
    const statusColors = {
      unsaved: COLORS.textSecondary,
      saving: COLORS.atomicTangerine,
      saved: '#08a854',
      error: '#d32f2f',
    };

    return {
      fontSize: '0.75rem',
      fontWeight: '700',
      padding: '6px 12px',
      borderRadius: RADIUS.full,
      backgroundColor: `${statusColors[status] || statusColors.unsaved}15`,
      color: statusColors[status] || statusColors.unsaved,
      border: `1px solid ${statusColors[status] || statusColors.unsaved}30`,
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    };
  },

  // ─── SHARED: Body (Scrollable) ───
  scrollableBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // ─── SHARED: Footer ───
  stickyFooter: {
    position: 'sticky',
    bottom: 0,
    borderTop: `1px solid ${COLORS.border}`,
    padding: '16px 20px',
    backgroundColor: COLORS.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    zIndex: 10,
  },
  closeFooterBtn: {
    padding: '10px 16px',
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.background,
    color: COLORS.charcoalBlue,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: TRANSITIONS.fast,
    '&:hover': {
      backgroundColor: COLORS.surface,
    },
  },

  // ─── SECTION CONTAINERS ───
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  // ─── FIELD GROUPS ───
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: COLORS.charcoalBlue,
    letterSpacing: '0.3px',
  },
  fieldValue: {
    fontSize: '0.95rem',
    color: COLORS.charcoalBlue,
  },
};
