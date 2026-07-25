export const COLORS = {
  // Paleta Principal
  linen: '#F4EDE4',              // Fondo cálido/papel
  atomicTangerine: '#FF6B35',    // Acento principal
  charcoalBlue: '#2C3E50',       // Textos y fondos oscuros
  mutedTeal: '#45B0A8',          // Acento secundario/éxito

  // Neutrales UI
  background: '#F8FAFC',         // Fondo general app (Slate 50)
  surface: '#FFFFFF',            // Tarjetas
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',   // Fondo glass claro
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.85)', // Fondo glass fuerte
  textPrimary: '#1E293B',        // Slate 800
  textSecondary: '#64748B',      // Slate 500
  textTertiary: '#475569',       // Slate 600
  border: '#E2E8F0',             // Slate 200
  borderLight: '#CBD5E1',        // Slate 300
  overlay: 'rgba(15, 23, 42, 0.4)', // Overlay oscuro

  // Estados
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B'
};

export const SHADOWS = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
  md: '0 4px 20px rgba(0, 0, 0, 0.06)',
  lg: '0 8px 30px rgba(0, 0, 0, 0.08)',
  float: '0 16px 40px rgba(0, 0, 0, 0.1)',
  glow: `0 0 20px ${COLORS.atomicTangerine}30`,
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)'
};

export const RADIUS = {
  xs: '4px',        // Flags, micro-badges
  sm: '8px',        // Inputs, chips pequeños
  md: '12px',       // Tarjetas secundarias, items
  lg: '16px',       // Tarjetas medianas, modales mobile
  xl: '24px',       // Tarjetas Bento principales, modales desktop
  '2xl': '32px',    // Hero sections, cards destacadas
  full: '9999px'    // Pills, avatares
};

export const FONTS = {
  heading: '"Plus Jakarta Sans", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace'
};

export const GLASS = {
  light: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  dark: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  overlay: {
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px'
};

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  overlay: 400,
  searchPalette: 15000,
  toast: 30000,
  // Notificaciones de logro/nivel: deben aparecer sobre TODO, incluido el visor inmersivo (z:10000)
  celebration: 20000
};

export const TRANSITIONS = {
  fast: 'all 0.15s ease',
  normal: 'all 0.25s ease',
  slow: 'all 0.4s ease'
};

export const ANIMATION_DELAYS = {
  fast: 0.1,
  normal: 0.15,
  stagger: 0.05,
  staggerLarge: 0.04,
};

/**
 * BUTTONS — Canonical Design System button tokens.
 * Primary: Tangerine gradient pill with glow shadow.
 * Secondary: Ghost text button — no BG, subtle hover.
 * Icon: Circular icon-only button.
 */
export const BUTTONS = {
  primary: {
    background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
    color: '#fff',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '10px 24px',
    fontSize: '0.88rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 6px 20px ${COLORS.atomicTangerine}35`,
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.01em',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
  secondary: {
    background: 'transparent',
    color: COLORS.textSecondary,
    border: 'none',
    borderRadius: RADIUS.md,
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '40px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'color 0.2s ease, background 0.2s ease',
  },
  icon: {
    background: 'transparent',
    border: 'none',
    borderRadius: RADIUS.full,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    transition: 'color 0.2s ease, background 0.2s ease',
  },
};