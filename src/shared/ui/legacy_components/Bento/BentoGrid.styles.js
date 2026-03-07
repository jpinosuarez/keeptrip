import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '@shared/config';

export const styles = {
  searchMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '10px 25px 0',
    color: COLORS.textSecondary,
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  clearSearchButton: {
    border: 'none',
    background: 'none',
    color: COLORS.atomicTangerine,
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.85rem'
  },
  masonryItem: {
    borderRadius: 'var(--radius-xl)',
    backgroundColor: COLORS.surface,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: SHADOWS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.normal,
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  topGradient: {
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)'
  },
  miniBtn: {
    ...GLASS.light,
    background: 'rgba(255,255,255,0.25)',
    border: 'none',
    borderRadius: RADIUS.full,
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  bottomContentGlass: {
    padding: '15px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
    marginTop: 'auto'
  },
  bottomContentSolid: (color) => ({
    padding: '15px',
    borderTop: `4px solid ${color}`,
    backgroundColor: COLORS.surface,
    marginTop: 'auto'
  }),
  metaRow: (isDark) => ({
    display: 'flex', gap: '12px', alignItems: 'center',
    fontSize: '0.7rem',
    color: isDark ? 'rgba(255,255,255,0.8)' : COLORS.textSecondary,
    fontWeight: '600'
  }),
  emptyState: {
    background: COLORS.surface,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 'var(--radius-xl)',
    padding: '32px',
    textAlign: 'center',
    color: COLORS.charcoalBlue,
    boxShadow: SHADOWS.sm,
    columnSpan: 'all'
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-lg)',
    background: COLORS.background,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.textSecondary,
    marginBottom: '12px'
  },
  emptyTitle: {
    margin: '0 0 6px',
    fontSize: '1rem',
    fontWeight: '800'
  },
  emptyText: {
    margin: 0,
    color: COLORS.textSecondary,
    fontSize: '0.85rem'
  },
  emptyAction: {
    marginTop: '14px',
    border: 'none',
    background: COLORS.atomicTangerine,
    color: COLORS.linen,
    padding: '8px 14px',
    borderRadius: RADIUS.sm,
    fontWeight: '700',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  emptyStatePrimary: {
    background: `linear-gradient(155deg, ${COLORS.linen} 0%, #ffffff 65%)`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 'var(--radius-xl)',
    padding: '38px 26px',
    textAlign: 'center',
    color: COLORS.charcoalBlue,
    boxShadow: SHADOWS.lg,
    columnSpan: 'all'
  },
  emptyIconPrimary: {
    width: '72px',
    height: '72px',
    borderRadius: 'var(--radius-lg)',
    background: COLORS.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.atomicTangerine,
    marginBottom: '14px',
    border: `1px solid ${COLORS.border}`
  },
  emptyTitlePrimary: {
    margin: '0 0 8px',
    fontSize: '1.2rem',
    fontWeight: '900'
  },
  emptyTextPrimary: {
    margin: '0 auto',
    color: COLORS.textSecondary,
    fontSize: '0.9rem',
    lineHeight: 1.5,
    maxWidth: '480px'
  },
  emptyActionPrimary: {
    marginTop: '16px',
    border: 'none',
    background: COLORS.atomicTangerine,
    color: COLORS.surface,
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '800',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  }
};
