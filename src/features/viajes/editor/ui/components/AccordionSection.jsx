import React, { useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { COLORS, RADIUS, FONTS } from '@shared/config';

/**
 * AccordionSection — reemplaza <details>/<summary> nativos.
 * Usa AnimatePresence + height:'auto' para una apertura suave.
 * Respeta prefers-reduced-motion.
 *
 * Props:
 *   title     — string mostrado en el header
 *   badge     — string corto (ej: "3") que indica datos rellenos; null = sin badge
 *   defaultOpen — boolean, false por defecto
 *   children  — contenido del acordeón
 */
const EASE_OUT_QUART = [0.25, 1, 0.5, 1];

const AccordionSection = ({ title, badge, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();
  const panelId = React.useId();

  const contentTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : {
        height: { duration: 0.28, ease: EASE_OUT_QUART },
        opacity: { duration: 0.18, ease: 'easeOut' },
      };

  const chevronTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: EASE_OUT_QUART };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header toggle */}
      <Motion.button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        whileHover={{ backgroundColor: COLORS.borderLight + '60' }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.15 }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          cursor: 'pointer',
          gap: '8px',
          fontFamily: FONTS.heading,
          fontWeight: '700',
          fontSize: '0.9rem',
          color: COLORS.textPrimary,
          textAlign: 'left',
          boxSizing: 'border-box',
          borderBottomColor: isOpen ? COLORS.borderLight : COLORS.border,
          transition: 'border-color 200ms ease',
        }}
      >
        {/* Título + badge de datos */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title}
          <AnimatePresence>
            {badge && (
              <Motion.span
                key="badge"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  letterSpacing: '0.3px',
                  background: `${COLORS.atomicTangerine}1A`,
                  color: COLORS.atomicTangerine,
                  borderRadius: RADIUS.full,
                  padding: '2px 8px',
                  lineHeight: 1.6,
                  border: `1px solid ${COLORS.atomicTangerine}30`,
                }}
              >
                {badge}
              </Motion.span>
            )}
          </AnimatePresence>
        </span>

        {/* Chevron rotante */}
        <Motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={chevronTransition}
          style={{ display: 'flex', flexShrink: 0, color: COLORS.textSecondary }}
        >
          <ChevronDown size={16} />
        </Motion.span>
      </Motion.button>

      {/* Contenido animado */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <Motion.div
            id={panelId}
            role="region"
            key="accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={contentTransition}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: '8px' }}>{children}</div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionSection;

