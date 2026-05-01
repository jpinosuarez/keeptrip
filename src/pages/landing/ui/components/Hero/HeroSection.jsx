import React, { useState } from 'react';

import { useAuth } from '@app/providers/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { Globe, ArrowRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { COLORS } from '@shared/config';
import { styles } from './HeroSection.styles';
import InteractiveCardStack from './InteractiveCardStack';

const AuthModal = React.lazy(() => import('@features/auth/ui/AuthModal'));

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
  const { usuario: user, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['landing']);
  const { isMobile } = useWindowSize();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <Motion.main style={styles.hero(isMobile)} variants={itemVariants}>
        {/* Columna izquierda: copy */}
        <Motion.div style={styles.content} variants={itemVariants}>
          <Motion.div style={styles.kicker} variants={itemVariants}>
            <Globe size={14} color={COLORS.mutedTeal} strokeWidth={2.5} />
            {t('landing:hero.kicker', 'Para viajeros de alma')}
          </Motion.div>

          <Motion.h1 style={styles.title(isMobile)} variants={itemVariants}>
            {t('landing:hero.titleTop')}
            <br />
            <span style={styles.highlight}>{t('landing:hero.titleHighlight')}</span>
          </Motion.h1>

          <Motion.p style={styles.subtitle} variants={itemVariants}>
            {t('landing:hero.subtitle')}
          </Motion.p>

          <Motion.button
            onClick={handleCtaClick}
            className="tap-btn"
            style={styles.ctaBtn}
            variants={hoverScaleVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {user ? t('landing:hero.ctaLoggedIn') : t('landing:hero.ctaButton')}
            <ArrowRight size={18} strokeWidth={2.5} />
          </Motion.button>
        </Motion.div>

        {/* Columna derecha: sneak-peek del producto */}
        <InteractiveCardStack isMobile={isMobile} />
      </Motion.main>

      <React.Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onContinue={login}
        />
      </React.Suspense>
    </>
  );
};

export default HeroSection;
