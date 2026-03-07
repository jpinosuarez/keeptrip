import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS, FONTS, SPACING } from '@shared/config';

export const styles = {
  overlay: (isMobile) => ({
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    ...GLASS.overlay, backgroundColor: undefined,
    zIndex: 2000, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
    padding: isMobile ? 0 : '20px'
  }),
  modal: (isMobile) => ({
    width: isMobile ? '100%' : 'min(640px, 100%)',
    maxWidth: '100%',
    maxHeight: isMobile ? '100dvh' : '92vh',
    backgroundColor: COLORS.surface,
    borderRadius: isMobile ? 0 : RADIUS.xl,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: SHADOWS.float,
    border: `1px solid ${COLORS.border}`,
  }),
  header: (img, isMobile) => ({
    height: isMobile ? '160px' : '200px', position: 'relative',
    backgroundImage: img ? `url(${img})` : 'none',
    backgroundColor: COLORS.charcoalBlue,
    backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    borderRadius: isMobile ? 0 : `${RADIUS.xl} ${RADIUS.xl} 0 0`,
  }),
  headerOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    borderRadius: 'inherit',
  },
  headerContent: {
    position: 'relative', zIndex: 2, padding: '24px',
    display: 'flex', alignItems: 'center', gap: '16px'
  },
  flagImg: {
    width: '48px', height: 'auto', borderRadius: RADIUS.sm,
    boxShadow: SHADOWS.md,
    border: '2px solid rgba(255,255,255,0.25)'
  },
  titleInput: {
    fontFamily: FONTS.heading,
    fontSize: '1.4rem', fontWeight: '800', color: 'white',
    background: 'transparent', border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.25)',
    width: '100%', outline: 'none', paddingBottom: '6px',
    letterSpacing: '-0.01em',
    transition: TRANSITIONS.fast,
  },
  titleInputAutoPulse: {
    fontFamily: FONTS.heading,
    fontSize: '1.4rem', fontWeight: '800', color: 'white',
    background: 'transparent', border: 'none',
    borderBottom: '2px solid rgba(255,255,255,0.6)',
    width: '100%', outline: 'none', paddingBottom: '6px',
    letterSpacing: '-0.01em',
    boxShadow: '0 6px 18px rgba(255,255,255,0.15)',
    transition: TRANSITIONS.fast,
  },
  autoBadge: (isAuto) => ({
    fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.5px',
    ...GLASS.dark,
    background: isAuto ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
    color: 'white',
    padding: '4px 10px', borderRadius: RADIUS.full, textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.15)',
    cursor: 'pointer', transition: TRANSITIONS.fast,
    whiteSpace: 'nowrap',
  }),
  cameraBtn: (disabled = false) => ({
    position: 'absolute', top: '16px', right: '16px', zIndex: 10,
    ...GLASS.dark, color: 'white',
    padding: '10px', borderRadius: RADIUS.full,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center',
    opacity: disabled ? 0.6 : 1, transition: TRANSITIONS.fast,
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: SHADOWS.md,
  }),
  processingBadge: {
    position: 'absolute', top: '18px', right: '64px', zIndex: 10,
    ...GLASS.dark, color: 'white', borderRadius: RADIUS.full,
    padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700',
    display: 'flex', alignItems: 'center', gap: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  body: {
    padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column',
    gap: '24px', flex: 1,
  },
  section: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.border}`,
  },
  label: {
    fontSize: '0.78rem', fontWeight: '800', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    display: 'flex', alignItems: 'center', gap: '6px'
  },
  subtleText: { fontSize: '0.85rem', color: COLORS.textSecondary },
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  dateInput: {
    border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md,
    padding: '10px 12px', fontSize: '0.9rem', color: COLORS.charcoalBlue,
    outline: 'none', background: COLORS.surface, boxShadow: SHADOWS.inner,
    transition: TRANSITIONS.fast,
  },
  textarea: {
    width: '100%', minHeight: '100px', padding: '14px',
    border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md,
    resize: 'vertical', fontFamily: FONTS.body, fontSize: '0.9rem',
    outline: 'none', boxShadow: SHADOWS.inner,
    background: COLORS.surface,
    transition: TRANSITIONS.fast,
  },
  inlineError: {
    fontSize: '0.8rem', fontWeight: '600', color: '#b91c1c'
  },
  inlineInfo: {
    fontSize: '0.8rem', fontWeight: '600', color: COLORS.mutedTeal
  },
  labelSecundario: {
    fontSize: '0.75rem', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase'
  },
  galleryManageBlock: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  galleryManageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px'
  },
  galleryManageCard: (isPortada) => ({
    border: `1px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    background: COLORS.surface,
    boxShadow: isPortada ? SHADOWS.md : SHADOWS.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px'
  }),
  galleryManageImg: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: RADIUS.sm
  },
  captionInput: {
    width: '100%',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.sm,
    padding: '8px 10px',
    fontSize: '1rem',
    color: COLORS.textPrimary,
    outline: 'none',
    background: COLORS.background
  },
  galleryActionsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  galleryActionBtn: (isPortada) => ({
    border: `1px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    background: isPortada ? `${COLORS.atomicTangerine}15` : COLORS.surface,
    color: isPortada ? COLORS.atomicTangerine : COLORS.textPrimary,
    borderRadius: RADIUS.full,
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  }),
  galleryDangerBtn: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.danger,
    borderRadius: RADIUS.full,
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  portadaBadgeMini: {
    fontSize: '0.65rem', fontWeight: '800', color: COLORS.atomicTangerine,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    textAlign: 'center',
  },
  footer: {
    borderTop: `1px solid ${COLORS.border}`,
    padding: '20px 24px',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    background: COLORS.surface,
    position: 'sticky',
    bottom: 0,
    zIndex: 5,
  },
  cancelBtn: (disabled = false) => ({
    background: 'transparent', border: `1px solid ${COLORS.border}`,
    color: COLORS.textSecondary,
    fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '12px 22px', borderRadius: RADIUS.full,
    opacity: disabled ? 0.6 : 1, transition: TRANSITIONS.fast,
    fontSize: '0.9rem',
  }),
  saveBtn: (disabled = false) => ({
    background: COLORS.atomicTangerine, color: 'white', border: 'none',
    padding: '12px 28px', borderRadius: RADIUS.full, fontWeight: '700',
    fontFamily: FONTS.body,
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: SHADOWS.glow, opacity: disabled ? 0.7 : 1, transition: TRANSITIONS.fast,
    fontSize: '0.9rem',
  })
};
