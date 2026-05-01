import { COLORS, SHADOWS, RADIUS, FONTS, SPACING, Z_INDEX } from './src/shared/config/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: COLORS.linen,
        atomicTangerine: {
          DEFAULT: COLORS.atomicTangerine,
          glow: `${COLORS.atomicTangerine}30`,
        },
        charcoalBlue: COLORS.charcoalBlue,
        mutedTeal: COLORS.mutedTeal,
        background: COLORS.background,
        surface: {
          DEFAULT: COLORS.surface,
          glass: COLORS.surfaceGlass,
          glassStrong: COLORS.surfaceGlassStrong,
        },
        text: {
          primary: COLORS.textPrimary,
          secondary: COLORS.textSecondary,
          tertiary: COLORS.textTertiary,
        },
        border: {
          DEFAULT: COLORS.border,
          light: COLORS.borderLight,
        },
        overlay: COLORS.overlay,
        danger: COLORS.danger,
        success: COLORS.success,
        warning: COLORS.warning,
      },
      boxShadow: {
        sm: SHADOWS.sm,
        md: SHADOWS.md,
        lg: SHADOWS.lg,
        float: SHADOWS.float,
        glow: SHADOWS.glow,
        inner: SHADOWS.inner,
      },
      borderRadius: {
        xs: RADIUS.xs,
        sm: RADIUS.sm,
        md: RADIUS.md,
        lg: RADIUS.lg,
        xl: RADIUS.xl,
        '2xl': RADIUS['2xl'],
        full: RADIUS.full,
      },
      fontFamily: {
        heading: [FONTS.heading.split(',')[0].replace(/"/g, ''), 'sans-serif'],
        body: [FONTS.body.split(',')[0].replace(/"/g, ''), 'sans-serif'],
        mono: [FONTS.mono.split(',')[0].replace(/"/g, ''), 'monospace'],
      },
      spacing: {
        xs: SPACING.xs,
        sm: SPACING.sm,
        md: SPACING.md,
        lg: SPACING.lg,
        xl: SPACING.xl,
        '2xl': SPACING['2xl'],
        '3xl': SPACING['3xl'],
      },
      zIndex: {
        base: String(Z_INDEX.base),
        dropdown: String(Z_INDEX.dropdown),
        sticky: String(Z_INDEX.sticky),
        modal: String(Z_INDEX.modal),
        overlay: String(Z_INDEX.overlay),
        toast: String(Z_INDEX.toast),
        celebration: String(Z_INDEX.celebration),
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      }
    },
  },
  plugins: [],
};
