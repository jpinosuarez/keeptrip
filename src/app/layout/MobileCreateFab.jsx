import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { COLORS, SHADOWS, Z_INDEX } from '@shared/config';
import { useUI } from '@app/providers/UIContext';
import { useTranslation } from 'react-i18next';

const MobileCreateFab = () => {
  const { openBuscador, isReadOnlyMode } = useUI();
  const { t } = useTranslation('nav');

  return (
    <Motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      onClick={openBuscador}
      aria-label={t('nav:addTrip')}
      disabled={isReadOnlyMode}
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: COLORS.atomicTangerine,
        color: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 24px ${COLORS.atomicTangerine}60, 0 4px 12px rgba(0,0,0,0.2)`,
        zIndex: Z_INDEX.sticky + 1,
        cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
        opacity: isReadOnlyMode ? 0.55 : 1,
      }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </Motion.button>
  );
};

export default React.memo(MobileCreateFab);
