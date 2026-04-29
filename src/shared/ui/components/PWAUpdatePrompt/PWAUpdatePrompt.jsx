import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { styles } from './PWAUpdatePrompt.styles';

/**
 * PWAUpdatePrompt — Premium UI for notifying the user about new app versions.
 * Uses vite-plugin-pwa's 'prompt' strategy to control SW lifecycle.
 */
const PWAUpdatePrompt = () => {
  const { t } = useTranslation(['common']);
  const { isMobile } = useWindowSize();
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
          style={{
            ...styles.container,
            ...(isMobile ? styles.containerMobile : {})
          }}
        >
          <div style={styles.content}>
            <div style={styles.iconWrapper}>
              <RefreshCw size={18} strokeWidth={2.5} />
            </div>
            <span style={styles.text}>
              {t('common:pwa.updateAvailable')}
            </span>
          </div>

          <div style={{
            ...styles.actions,
            ...(isMobile ? styles.actionsMobile : {})
          }}>
            <button 
              type="button"
              style={styles.laterBtn}
              onClick={close}
            >
              {t('common:pwa.later')}
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.updateBtn}
              onClick={() => updateServiceWorker(true)}
            >
              <Sparkles size={14} fill="currentColor" />
              {t('common:pwa.update')}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;
