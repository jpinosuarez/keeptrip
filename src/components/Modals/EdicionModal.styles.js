import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '../../theme';

export const styles = {
  overlay: (isMobile) => ({
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    ...GLASS.overlay, backgroundColor: undefined,
    zIndex: 2000, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
    padding: isMobile ? 0 : '20px'
  }),
  modal: (isMobile) => ({
    width: isMobile ? '100%' : 'min(600px, 100%)',
    maxWidth: '100%',
    maxHeight: isMobile ? '100vh' : '90vh',
    backgroundColor: COLORS.surface,
    borderRadius: isMobile ? 0 : RADIUS.xl,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: SHADOWS.float
  }),
  header: (img, isMobile) => ({
    height: isMobile ? '160px' : '180px', position: 'relative',
    backgroundImage: img ? `url(${img})` : 'none',
    backgroundColor: COLORS.charcoalBlue,
    backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
  }),
  headerOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
  },
  headerContent: {
    position: 'relative', zIndex: 2, padding: '20px',
    display: 'flex', alignItems: 'center', gap: '15px'
  },
  flagImg: {
    width: '50px', height: 'auto', borderRadius: RADIUS.xs,
    boxShadow: SHADOWS.md,
    border: '2px solid rgba(255,255,255,0.3)'
  },
  titleInput: {
    fontSize: '1.5rem', fontWeight: '800', color: 'white',
    background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)',
    width: '100%', outline: 'none', paddingBottom: '4px'
  },
  titleInputAutoPulse: {
    fontSize: '1.5rem', fontWeight: '800', color: 'white',
    background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.6)',
    width: '100%', outline: 'none', paddingBottom: '4px',
    boxShadow: '0 6px 18px rgba(255,255,255,0.2)'
  },
  autoBadge: (isAuto) => ({
    fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.5px',
    background: isAuto ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
    color: 'white',
    padding: '4px 8px', borderRadius: RADIUS.full, textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer', transition: TRANSITIONS.fast
  }),
  cameraBtn: (disabled = false) => ({
    position: 'absolute', top: '15px', right: '15px', zIndex: 10,
    ...GLASS.dark, color: 'white',
    padding: '8px', borderRadius: RADIUS.full, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center',
    opacity: disabled ? 0.6 : 1, transition: TRANSITIONS.fast
  }),
  processingBadge: {
    position: 'absolute', top: '18px', right: '64px', zIndex: 10,
    ...GLASS.dark, color: 'white', borderRadius: RADIUS.full,
    padding: '6px 10px', fontSize: '0.75rem', fontWeight: '700',
    display: 'flex', alignItems: 'center', gap: '6px'
  },
  body: { padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.8rem', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'6px' },
  subtleText: { fontSize: '0.85rem', color: COLORS.textSecondary },
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  dateInput: {
    border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm,
    padding: '10px', fontSize: '0.9rem', color: COLORS.charcoalBlue,
    outline: 'none', background: COLORS.background, boxShadow: SHADOWS.inner
  },
  textarea: {
    width: '100%', minHeight: '100px', padding: '12px',
    border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm,
    resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem',
    outline: 'none', boxShadow: SHADOWS.inner
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
    padding: '6px 8px',
    fontSize: '0.85rem',
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
  footer: {
    borderTop: `1px solid ${COLORS.border}`, padding: '20px',
    display: 'flex', justifyContent: 'flex-end', gap: '10px'
  },
  cancelBtn: (disabled = false) => ({
    background: 'transparent', border: 'none', color: COLORS.textSecondary,
    fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', padding: '10px 20px',
    opacity: disabled ? 0.6 : 1, transition: TRANSITIONS.fast
  }),
  saveBtn: (disabled = false) => ({
    background: COLORS.atomicTangerine, color: 'white', border: 'none',
    padding: '10px 24px', borderRadius: RADIUS['2xl'], fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: SHADOWS.sm, opacity: disabled ? 0.7 : 1, transition: TRANSITIONS.fast
  })
};
