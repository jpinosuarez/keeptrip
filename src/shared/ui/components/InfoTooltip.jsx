import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, GLASS, FONTS } from '@shared/config';

/**
 * Tooltip de ayuda contextual para campos de formulario.
 *
 * Uso:
 *   <label>Vibe <InfoTooltip text="Etiquetas que capturan..." /></label>
 *   <label>Vibe <InfoTooltip textKey="editor.tooltip.vibe" /></label>
 *
 * Props:
 *   text     — Texto directo a mostrar
 *   textKey  — Clave i18n (requiere useTranslation en el padre)
 *   size     — Tamaño del ícono en px (default: 15)
 */
export default function InfoTooltip({ text, textKey, size = 15 }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(true);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Decidir si el popover se muestra arriba o abajo según el espacio disponible
  const recalcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    setAbove(spaceAbove > spaceBelow);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [open]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    recalcPosition();
    setOpen((v) => !v);
  };

  // Resolve text: directo o con i18n key
  const displayText = text || (textKey ? t(textKey) : '');

  return (
    <span style={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onMouseEnter={() => { recalcPosition(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        style={styles.trigger}
        aria-label="Más información"
      >
        <HelpCircle size={size} color={COLORS.mutedTeal} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && displayText && (
          <Motion.div
            ref={tooltipRef}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.92, y: above ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              ...styles.popover,
              ...(above ? styles.above : styles.below),
            }}
          >
            <span style={styles.arrow(above)} />
            <span style={styles.text}>{displayText}</span>
          </Motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: 4,
    verticalAlign: 'middle',
  },
  trigger: {
    background: 'none',
    border: 'none',
    padding: 2,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1,
    borderRadius: RADIUS.full,
    transition: 'background 0.15s',
  },
  popover: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 220,
    padding: '10px 12px',
    borderRadius: RADIUS.md,
    boxShadow: SHADOWS.lg,
    ...GLASS.medium,
    border: `1px solid ${COLORS.border}`,
    zIndex: 500,
    pointerEvents: 'none',
  },
  above: {
    bottom: 'calc(100% + 8px)',
  },
  below: {
    top: 'calc(100% + 8px)',
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: '0.78rem',
    lineHeight: 1.45,
    color: COLORS.textPrimary,
  },
  arrow: (above) => ({
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: 8,
    height: 8,
    background: GLASS.medium.background,
    borderRight: above ? `1px solid ${COLORS.border}` : 'none',
    borderBottom: above ? `1px solid ${COLORS.border}` : 'none',
    borderLeft: above ? 'none' : `1px solid ${COLORS.border}`,
    borderTop: above ? 'none' : `1px solid ${COLORS.border}`,
    ...(above ? { bottom: -5 } : { top: -5 }),
  }),
};
