import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '../../theme';

export const styles = {
  expandedOverlay: { 
    position: 'fixed', inset: 0, backgroundColor: COLORS.surface, zIndex: 10000, overflowY: 'auto' 
  },
  expandedHeader: (foto) => ({ 
    height: foto ? '50vh' : '35vh', 
    width: '100%', 
    position: 'relative', 
    backgroundImage: foto ? `url(${foto})` : 'none', 
    backgroundColor: foto ? 'transparent' : COLORS.charcoalBlue, 
    backgroundSize: 'cover', 
    backgroundPosition: 'center',
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'flex-end'
  }),
  fotoOverlay: { 
    position: 'absolute', 
    inset: 0, 
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8))' 
  },
  navBar: {
    position: 'absolute', top: 20, left: 20, right: 20,
    display: 'flex', justifyContent: 'space-between', zIndex: 20
  },
  iconBtn: (disabled = false) => ({ 
    ...GLASS.dark, border: 'none', borderRadius: RADIUS.full, width: '40px', height: '40px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
    opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: TRANSITIONS.fast
  }),
  primaryBtn: (isSave, disabled = false) => ({
    background: isSave ? COLORS.atomicTangerine : 'white', 
    color: isSave ? 'white' : COLORS.charcoalBlue,
    border: 'none', borderRadius: RADIUS.full, padding: '10px 20px', 
    fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center',
    opacity: disabled ? 0.7 : 1, transition: TRANSITIONS.fast
  }),
  secondaryBtn: (disabled = false) => ({
    ...GLASS.dark, color: 'white', border: 'none', borderRadius: RADIUS.full, width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, transition: TRANSITIONS.fast
  }),
  headerContent: {
    position: 'relative', zIndex: 10, padding: '0 40px 40px', maxWidth: '1000px', margin: '0 auto', width: '100%'
  },
  flagIcon: { fontSize: '3rem', textShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  titleDisplay: { 
    color: 'white', fontSize: '3.5rem', fontWeight: '900', margin: '10px 0', lineHeight: 1.1,
    textShadow: '0 4px 20px rgba(0,0,0,0.5)' 
  },
  titleInput: { 
    fontSize: '2.5rem', fontWeight: '900', background: 'rgba(255,255,255,0.1)', border: 'none', 
    borderBottom: '2px solid white', color: 'white', width: '100%', outline: 'none' 
  },
  editHeaderStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  imageActionsRow: {
    display: 'flex',
    alignItems: 'center'
  },
  imageReplaceBtn: (disabled = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(255,255,255,0.4)',
    ...GLASS.dark,
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '8px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: TRANSITIONS.fast
  }),
  metaBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: '6px', 
    background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: RADIUS.sm, 
    color: 'white', fontSize: '0.9rem', fontWeight: '600',
    backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'
  },
  
  bodyContent: {
    maxWidth: '1000px', margin: '0 auto', padding: '40px',
    display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '60px',
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr', gap: '30px' }
  },
  mainColumn: { display: 'flex', flexDirection: 'column' },
  sectionTitle: { 
    fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', 
    color: COLORS.mutedTeal, marginBottom: '15px', fontWeight: '800' 
  },
  galleryHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },
  galleryToggleBtn: (active = false) => ({
    border: `1px solid ${active ? COLORS.atomicTangerine : COLORS.border}`,
    background: active ? `${COLORS.atomicTangerine}15` : 'white',
    color: active ? COLORS.atomicTangerine : COLORS.textPrimary,
    borderRadius: RADIUS.full,
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  }),
  gallerySubtitle: {
    marginTop: '-6px',
    marginBottom: '12px',
    color: COLORS.textSecondary,
    fontSize: '0.9rem'
  },
  readText: { fontSize: '1.1rem', lineHeight: 1.7, color: COLORS.charcoalBlue, whiteSpace: 'pre-wrap' },
  textArea: { 
    width: '100%', minHeight: '200px', padding: '20px', borderRadius: RADIUS.lg, 
    border: `2px solid ${COLORS.border}`, fontSize: '1rem', outline: 'none',
    boxShadow: SHADOWS.inner,
    ':focus': { borderColor: COLORS.atomicTangerine } 
  },
  galleryManageBlock: {
    marginTop: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px'
  },
  galleryManageCard: (isPortada) => ({
    border: `1px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    borderRadius: RADIUS.md,
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
    background: isPortada ? `${COLORS.atomicTangerine}15` : 'white',
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
  
  timeline: { borderLeft: `2px solid ${COLORS.border}`, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  timelineItem: { position: 'relative' },
  timelineDot: { position: 'absolute', left: '-25px', top: '6px', width: '8px', height: '8px', borderRadius: RADIUS.full, background: COLORS.atomicTangerine, border: '2px solid white' },
  stopCard: { background: COLORS.surface, padding: '12px', borderRadius: RADIUS.md, border: `1px solid ${COLORS.background}` },
  emptyState: { fontStyle: 'italic', color: COLORS.textSecondary },
  weatherNote: {
    marginTop: '8px',
    fontSize: '0.9rem',
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: COLORS.background,
    padding: '8px 12px',
    borderRadius: RADIUS.sm
  },
  verifiedBadge: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    fontWeight: '800',
    color: COLORS.mutedTeal,
    background: COLORS.surface,
    padding: '2px 6px',
    borderRadius: RADIUS.xs
  },
  creditLink: {
    position: 'absolute', bottom: 15, right: 20,
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.75rem', textDecoration: 'none',
    ...GLASS.dark, padding: '4px 10px', borderRadius: RADIUS.lg,
    display: 'flex', gap: '6px', alignItems: 'center',
    zIndex: 20,
    border: '1px solid rgba(255,255,255,0.2)'
  }
};

