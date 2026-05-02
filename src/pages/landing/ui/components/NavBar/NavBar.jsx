import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';

import { useAuth } from '@app/providers/AuthContext';
import { useTranslation } from 'react-i18next';


const AuthModal = React.lazy(() => import('@features/auth/ui/AuthModal'));

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const hoverScaleVariants = {
  hover: { scale: 1.02, y: -4, transition: springTransition },
  tap: { scale: 0.96, transition: springTransition },
};

const NavBar = () => {
  const { login } = useAuth();
  const { t } = useTranslation(['common']);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <Motion.nav 
        className="sticky top-0 z-[100] w-full flex items-center justify-between px-6 md:px-12 py-5 bg-white/80 backdrop-blur-xl"
        variants={itemVariants}
      >
        <div className="text-[1.6rem] font-black text-charcoalBlue tracking-[-1.2px] font-heading">Keeptrip</div>
        <Motion.button
          onClick={() => setIsAuthModalOpen(true)}
          className="tap-btn px-7 py-3 border-2 border-atomicTangerine bg-transparent text-atomicTangerine rounded-full font-extrabold cursor-pointer min-h-[48px] text-[0.95rem] font-heading"
          variants={hoverScaleVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {t('common:login')}
        </Motion.button>
      </Motion.nav>

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

export default NavBar;
