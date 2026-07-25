import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';


/**
 * EmptyDashboardState — Minimalist empty placeholder for the "Recent Adventures" column.
 * No CTA button here — the primary Hero CTA lives in WelcomeBento to avoid visual confusion.
 * Shows an elegant text/icon to fill the space when no trips exist.
 */
const EmptyDashboardState = () => {
  const { t } = useTranslation('dashboard');

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      className="flex flex-col items-center justify-center gap-4 text-center w-full h-full min-h-0 bg-transparent py-8 px-6 rounded-3xl relative overflow-hidden box-border"
    >
      <Motion.div 
        className="relative flex items-center justify-center w-[72px] h-[72px] bg-atomicTangerine/5 rounded-full mb-1 shrink-0"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Globe size={44} className="text-atomicTangerine" strokeWidth={1.2} aria-hidden="true" />
        <Motion.div 
          className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-1.5 flex shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={16} className="text-mutedTeal" strokeWidth={2} aria-hidden="true" />
        </Motion.div>
      </Motion.div>
      
      <h3 className="m-0 text-[1.15rem] font-extrabold text-charcoalBlue tracking-tight leading-[1.2] font-heading">{t('welcome.emptyStateTitle')}</h3>
      <p className="m-0 text-[0.85rem] text-text-secondary leading-normal max-w-[240px] font-medium font-body">{t('welcome.recentPlaceholder')}</p>
    </Motion.div>
  );
};

export default EmptyDashboardState;
