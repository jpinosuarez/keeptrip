import React from 'react';
import { motion as Motion } from 'framer-motion';

import { useAuth } from '@app/providers/AuthContext';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { styles } from './NavBar.styles';

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
  const { isMobile } = useWindowSize();

  return (
    <Motion.nav style={styles.nav(isMobile)} variants={itemVariants}>
      <div style={styles.logo}>Keeptrip</div>
      <Motion.button
        onClick={login}
        className="tap-btn"
        style={styles.loginBtn}
        variants={hoverScaleVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {t('common:login')}
      </Motion.button>
    </Motion.nav>
  );
};

export default NavBar;
