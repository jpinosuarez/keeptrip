import { COLORS, RADIUS, SHADOWS } from '@shared/config';

export const styles = {
  searchMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    fontSize: '0.875rem',
    color: COLORS.charcoalBlue,
    fontWeight: '500'
  },
  clearSearchButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.atomicTangerine,
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: RADIUS.sm,
    transition: 'background-color 0.2s ease',
    fontSize: '0.875rem',
    minHeight: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  masonryItem: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: SHADOWS.md,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: COLORS.surface
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '120px',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    zIndex: 2
  },
  miniBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: RADIUS.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'background-color 0.2s ease',
    minHeight: '44px',
    minWidth: '44px'
  },
  bottomContentGlass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
    backdropFilter: 'blur(8px)',
    zIndex: 1
  },
  bottomContentSolid: (bgColor) => ({
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: bgColor,
    color: COLORS.surface,
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.08)',
  }),
  metaRow: (isPhoto) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: isPhoto ? 'rgba(255,255,255,0.9)' : COLORS.charcoalBlue,
  }),
  emptyStatePrimary: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.md,
    marginBottom: '16px'
  },
  emptyIconContainer: (variant) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    marginBottom: '24px',
    background: variant === 'primary'
      ? `linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(69,176,168,0.08) 100%)`
      : 'rgba(248,250,252,0.9)',
    border: variant === 'primary'
      ? '1px solid rgba(255,107,53,0.15)'
      : '1px solid rgba(44,62,80,0.08)'
  }),
  emptyTitlePrimary: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: COLORS.charcoalBlue,
    marginBottom: '8px'
  },
  emptyTextPrimary: {
    fontSize: '0.875rem',
    color: COLORS.textTertiary,
    marginBottom: '24px',
    maxWidth: '280px'
  },
  emptyActionPrimary: {
    backgroundColor: COLORS.atomicTangerine,
    color: COLORS.surface,
    border: 'none',
    borderRadius: RADIUS.md,
    padding: '14px 28px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    minHeight: '44px',
    minWidth: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.md,
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: COLORS.charcoalBlue,
    marginBottom: '4px'
  },
  emptyText: {
    fontSize: '0.875rem',
    color: COLORS.textTertiary,
    marginBottom: '16px',
    maxWidth: '280px'
  },
  emptyAction: {
    backgroundColor: COLORS.mutedTeal,
    color: COLORS.surface,
    border: 'none',
    borderRadius: RADIUS.md,
    padding: '10px 20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    minHeight: '44px'
  },
  gridWrapper: {
    width: '100%',
    paddingBottom: '56px'
  },
  flagsRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  flagImage: {
    width: '28px',
    height: '20px',
    borderRadius: RADIUS.xs,
    objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.3)',
    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))'
  },
  flagOverflow: {
    color: 'white',
    fontWeight: '700',
    fontSize: '0.75rem',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  cardTitle: (isPhoto) => ({
    margin: 0,
    color: isPhoto ? 'white' : COLORS.charcoalBlue,
    fontSize: '1.125rem',
    fontWeight: '800',
    lineHeight: 1.2,
    ...(isPhoto && {
      textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
    }),
  }),
  metaRowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
};