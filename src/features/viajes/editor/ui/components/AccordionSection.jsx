import React, { useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

/**
 * AccordionSection — replaces native <details>/<summary>.
 * Uses AnimatePresence + height:'auto' for smooth opening.
 * Respects prefers-reduced-motion.
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
    <div className="flex flex-col gap-2">
      {/* Header toggle */}
      <Motion.button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        whileHover={{ backgroundColor: 'rgba(238, 242, 246, 0.4)' }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "w-full flex items-center justify-between p-3.5 bg-background border border-border rounded-md cursor-pointer gap-2 font-bold text-[0.9rem] text-textPrimary text-left box-border transition-colors duration-200",
          isOpen ? "border-b-borderLight" : "border-border"
        )}
      >
        {/* Título + badge de datos */}
        <span className="flex items-center gap-2">
          {title}
          <AnimatePresence>
            {badge && (
              <Motion.span
                key="badge"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="text-[0.68rem] font-extrabold tracking-wide bg-atomicTangerine/10 text-atomicTangerine rounded-full px-2 py-0.5 border border-atomicTangerine/20 leading-[1.6]"
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
          className="flex shrink-0 text-textSecondary"
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
            className="overflow-hidden"
          >
            <div className="pb-2">{children}</div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionSection;

