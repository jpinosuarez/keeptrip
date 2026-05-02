import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

/**
 * PWAUpdatePrompt — Premium UI for notifying the user about new app versions.
 * Uses vite-plugin-pwa's 'prompt' strategy to control SW lifecycle.
 */
const PWAUpdatePrompt = () => {
  const { t } = useTranslation(['common']);
  
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
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-32px)] md:w-auto min-w-[340px]",
            "bg-white/90 backdrop-blur-xl border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4"
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-atomicTangerine/15 flex items-center justify-center text-atomicTangerine shrink-0">
              <RefreshCw size={20} strokeWidth={2.5} className="animate-spin-slow" />
            </div>
            <span className="text-[0.95rem] font-bold text-charcoalBlue tracking-tight font-heading leading-tight">
              {t('common:pwa.updateAvailable')}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              type="button"
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-text-secondary hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent font-heading"
              onClick={close}
            >
              {t('common:pwa.later')}
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 md:flex-none px-6 py-2.5 bg-atomicTangerine text-white rounded-xl text-[0.85rem] font-black shadow-lg shadow-atomicTangerine/20 flex items-center justify-center gap-2 cursor-pointer border-none font-heading"
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

