import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useUI } from '@app/providers/UIContext';
import { COLORS, SHADOWS, RADIUS } from '@shared/config';

const GhostEmptyState = () => {
  const { t } = useTranslation('dashboard');
  const { openBuscador, isReadOnlyMode } = useUI();

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      overflow: 'hidden',
    }}>
      {/* Decorative orbs — contained within parent bounds */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 18% 24%, rgba(255,107,53,0.10), transparent 42%), radial-gradient(circle at 80% 82%, rgba(69,176,168,0.12), transparent 40%)',
        pointerEvents: 'none',
        opacity: 0.7,
      }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i === 1 ? '120px' : i === 2 ? '80px' : '100px',
            height: i === 1 ? '120px' : i === 2 ? '80px' : '100px',
            top: i === 1 ? '18%' : i === 2 ? '60%' : '30%',
            left: i === 1 ? '10%' : i === 2 ? '70%' : '62%',
            borderRadius: RADIUS.full,
            background: i === 2 ? 'rgba(69,176,168,0.15)' : 'rgba(255,107,53,0.15)',
            filter: 'blur(2px)',
          }} />
        ))}
      </div>

      <Motion.div
        data-testid="ghost-empty-state"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255,255,255,0.92)',
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.xl,
          padding: '32px 28px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: SHADOWS.md,
          margin: '0 auto',
        }}
      >
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          color: COLORS.charcoalBlue,
          marginBottom: '10px',
          marginTop: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {t('ghostEmptyState.title')}
        </h2>
        <p style={{
          fontSize: '0.92rem',
          color: COLORS.textSecondary,
          marginBottom: '24px',
          marginTop: 0,
          lineHeight: 1.5,
        }}>
          {t('ghostEmptyState.description')}
        </p>
        
        <Motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openBuscador}
          disabled={isReadOnlyMode}
          style={{
            background: `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9a4d)`,
            color: '#fff',
            border: 'none',
            minHeight: '48px',
            borderRadius: '9999px',
            padding: '0 28px',
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 6px 20px ${COLORS.atomicTangerine}35`,
            cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
            opacity: isReadOnlyMode ? 0.55 : 1,
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          {t('ghostEmptyState.action')}
        </Motion.button>
      </Motion.div>
    </div>
  );
};

export default GhostEmptyState;
