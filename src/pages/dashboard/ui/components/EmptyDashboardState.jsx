import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe, Sparkles, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { emptyStyles as styles } from './EmptyDashboardState.styles';
import { COLORS } from '@shared/config';

const EmptyDashboardState = ({ onNewTrip }) => {
  const { t } = useTranslation('dashboard');

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.container}
    >
      <Motion.div 
        style={styles.artWrapper}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Globe size={56} color={COLORS.atomicTangerine} strokeWidth={1.2} />
        <Motion.div 
          style={styles.sparkleContainer}
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={20} color={COLORS.mutedTeal} strokeWidth={2} />
        </Motion.div>
      </Motion.div>
      
      <h3 style={styles.title}>{t('welcome.emptyStateTitle')}</h3>
      <p style={styles.text}>{t('welcome.emptyStateDescription')}</p>
      
      <Motion.button 
        type="button" 
        style={styles.cta} 
        onClick={onNewTrip}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Compass size={20} />
        {t('welcome.emptyStateCTA')}
      </Motion.button>
    </Motion.div>
  );
};

export default EmptyDashboardState;
