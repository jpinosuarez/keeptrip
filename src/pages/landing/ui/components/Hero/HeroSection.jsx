import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { Globe, ArrowRight } from 'lucide-react';
import { COLORS } from '@shared/config';
import { styles } from './HeroSection.styles';
import InteractiveCardStack from './InteractiveCardStack';

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const hoverScaleVariants = {
  ...itemVariants,
  hover: { scale: 1.02, y: -2, boxShadow: `0 12px 28px ${COLORS.atomicTangerine}50` },
  tap: { scale: 0.95 },
};

const HeroSection = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['landing']);
  const { isMobile } = useWindowSize();

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      login();
    }
  };

  return (
    <motion.main style={styles.hero(isMobile)} variants={itemVariants}>
      {/* Columna izquierda: copy */}
      <motion.div style={styles.content} variants={itemVariants}>
        <motion.div style={styles.kicker} variants={itemVariants}>
          <Globe size={14} color={COLORS.mutedTeal} strokeWidth={2.5} />
          {t('landing:hero.kicker', 'Para viajeros de alma')}
        </motion.div>

        <motion.h1 style={styles.title(isMobile)} variants={itemVariants}>
          {t('landing:hero.titleTop')}
          <br />
          <span style={styles.highlight}>{t('landing:hero.titleHighlight')}</span>
        </motion.h1>

        <motion.p style={styles.subtitle} variants={itemVariants}>
          {t('landing:hero.subtitle')}
        </motion.p>

        <motion.button
          onClick={handleCtaClick}
          className="tap-btn"
          style={styles.ctaBtn}
          variants={hoverScaleVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {user ? t('landing:hero.ctaLoggedIn') : t('landing:hero.ctaButton')}
          <ArrowRight size={18} strokeWidth={2.5} />
        </motion.button>
      </motion.div>

      {/* Columna derecha: sneak-peek del producto */}
      <InteractiveCardStack isMobile={isMobile} />
    </motion.main>
  );
};

export default HeroSection;
