import React, { useState } from 'react';

import { useAuth } from '@app/providers/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import InteractiveCardStack from './InteractiveCardStack';

const AuthModal = React.lazy(() => import('@features/auth/ui/AuthModal'));

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const hoverScaleVariants = {
  ...itemVariants,
  hover: { scale: 1.02, y: -2, boxShadow: '0 12px 28px rgba(255, 126, 66, 0.5)' },
  tap: { scale: 0.95 },
};

const HeroSection = () => {
  const { usuario: user, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['landing']);
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
      <main 
        className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-12 md:py-0 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-[72px] items-center min-h-[calc(100svh-88px)]"
      >
        {/* Columna izquierda: copy */}
        <div className="flex flex-col items-start gap-7">
          <div className="inline-flex items-center gap-2 text-[0.8rem] font-extrabold text-mutedTeal uppercase tracking-[1.8px] bg-mutedTeal/15 px-5 py-2.5 rounded-full border-[1.5px] border-mutedTeal/30 font-heading">
            <Globe size={14} className="text-mutedTeal" strokeWidth={2.5} />
            {t('landing:hero.kicker', 'Para viajeros de alma')}
          </div>

          <h1 className="m-0 text-[3.2rem] md:text-[4.8rem] font-black text-charcoalBlue leading-[1.05] tracking-[-1px] md:tracking-[-2.5px] font-heading opacity-100">
            {t('landing:hero.titleTop')}
            <br />
            <span className="text-atomicTangerine inline-block">{t('landing:hero.titleHighlight')}</span>
          </h1>

          <p className="m-0 text-[1.15rem] text-text-secondary max-w-[520px] leading-[1.7] font-normal font-body">
            {t('landing:hero.subtitle')}
          </p>

          <Motion.button
            onClick={handleCtaClick}
            className="tap-btn inline-flex items-center justify-center gap-3 px-10 bg-atomicTangerine text-white border-none rounded-full text-[1.1rem] font-extrabold cursor-pointer shadow-[0_8px_24px_theme(colors.atomicTangerine/0.4)] min-h-[56px] min-w-[260px] font-heading"
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 12px 28px rgba(255, 126, 66, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            {user ? t('landing:hero.ctaLoggedIn') : t('landing:hero.ctaButton')}
            <ArrowRight size={18} strokeWidth={2.5} />
          </Motion.button>
        </div>

        {/* Columna derecha: sneak-peek del producto */}
        <InteractiveCardStack />
      </main>

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
