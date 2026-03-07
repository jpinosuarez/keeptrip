import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '@shared/config';

export const styles = {
  modalOverlay: (isMobile) => ({
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    ...GLASS.overlay,
    zIndex: 2000,
    display: 'flex',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    justifyContent: 'center',
    paddingTop: isMobile ? 0 : '100px'
  }),
  modalContent: (isMobile) => ({
    width: isMobile ? '100%' : 'min(500px, 100%)',
    maxWidth: '100%',
    height: isMobile ? '100vh' : 'auto',
    maxHeight: isMobile ? '100vh' : '80vh',
    backgroundColor: COLORS.surface,
    borderRadius: isMobile ? 0 : RADIUS.xl,
    boxShadow: SHADOWS.float,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }),
  header: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { margin: 0, fontSize: '1.1rem', color: COLORS.charcoalBlue, fontWeight: '800' },

  searchBox: {
    margin: '0 20px 10px', padding: '12px 16px',
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', gap: '10px'
  },
  inputStyle: { border: 'none', background: 'transparent', fontSize: '1rem', width: '100%', outline: 'none', color: COLORS.charcoalBlue },

  listaContainer: (isMobile) => ({ maxHeight: isMobile ? 'none' : '300px', overflowY: 'auto', flex: 1 }),

  tagBtn: {
    background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '8px 12px',
    borderRadius: RADIUS.xl, cursor: 'pointer', fontSize: '0.9rem', color: COLORS.charcoalBlue,
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: TRANSITIONS.normal
  },

  resultItem: {
    padding: '12px 20px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '15px',
    transition: TRANSITIONS.fast,
    position: 'relative'
  },
  iconBox: (isCountry) => ({
    width: '44px', height: '44px', borderRadius: RADIUS.sm,
    backgroundColor: isCountry ? `${COLORS.atomicTangerine}15` : `${COLORS.mutedTeal}15`,
    color: isCountry ? COLORS.atomicTangerine : COLORS.mutedTeal,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }),
  nombrePais: { fontWeight: '700', color: COLORS.charcoalBlue, display: 'block' },
  subtext: { fontSize: '0.8rem', color: COLORS.textSecondary },

  addLabel: {
    position: 'absolute', right: '20px',
    fontSize: '0.8rem', fontWeight: '700', color: COLORS.mutedTeal,
    display: 'none', alignItems: 'center', gap: '4px'
  }
};
