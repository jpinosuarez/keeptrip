import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { emptyStyles as styles } from './EmptyDashboardState.styles';
import { COLORS } from '@shared/config';

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
      style={styles.container}
    >
      <Motion.div 
        style={styles.artWrapper}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Globe size={44} color={COLORS.atomicTangerine} strokeWidth={1.2} aria-hidden="true" />
        <Motion.div 
          style={styles.sparkleContainer}
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={16} color={COLORS.mutedTeal} strokeWidth={2} aria-hidden="true" />
        </Motion.div>
      </Motion.div>
      
      <h3 style={styles.title}>{t('welcome.emptyStateTitle')}</h3>
      <p style={styles.text}>{t('welcome.recentPlaceholder')}</p>
    </Motion.div>
  );
};

export default EmptyDashboardState;
