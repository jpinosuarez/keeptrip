import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Globe } from 'lucide-react';
import { useUI } from '@app/providers/UIContext';
import { RADIUS } from '@shared/config';
import EmptyStateCard from '@shared/ui/components/EmptyStateCard';

/**
 * GhostEmptyState — "no trips yet" aspirational state for the Trips archive.
 * Keeps the decorative ambient orbs + entrance animation, but delegates the card
 * itself to the canonical <EmptyStateCard /> (Visual System v2.0, no serif, no
 * off-palette gradients on the CTA).
 */
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
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        className="relative z-10 w-full max-w-lg"
      >
        <EmptyStateCard
          data-testid="ghost-empty-state"
          icon={Globe}
          accentColor="orange"
          title={t('ghostEmptyState.title')}
          description={t('ghostEmptyState.description')}
          primaryAction={{
            label: t('ghostEmptyState.action'),
            onClick: isReadOnlyMode ? undefined : openBuscador,
            icon: Plus,
          }}
          className={isReadOnlyMode ? 'opacity-60 pointer-events-none' : ''}
        />
      </Motion.div>
    </div>
  );
};

export default GhostEmptyState;

