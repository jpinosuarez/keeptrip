import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers';
import { getTravelerLevel } from '@features/gamification';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import { GLASS, SHADOWS, RADIUS, COLORS } from '@shared/config';

const TravelerHud = ({ paises = [], trips = [], tripData = {}, isMobile = false }) => {
  const { t } = useTranslation('dashboard');
  const { usuario } = useAuth();
  
  const stats = useLogStats(trips, tripData);
  const level = getTravelerLevel(paises.length);
  
  const name = usuario?.displayName?.split(' ')[0] || 'Viajero';
  
  return (
    <Motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileTap={{ scale: 0.98 }}
      style={{
        position: 'absolute',
        top: isMobile ? '10px' : '20px',
        left: isMobile ? '10px' : '20px',
        zIndex: 10,
        pointerEvents: 'auto',

        ...GLASS.dark,
        backgroundColor: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: RADIUS.xl,
        padding: isMobile ? '10px 12px' : '14px 18px',
        boxShadow: SHADOWS.float,

        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '6px' : '10px',
        minWidth: isMobile ? '170px' : '220px',
        maxWidth: isMobile ? '220px' : '260px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
        <div style={{
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          borderRadius: '50%',
          backgroundColor: COLORS.atomicTangerine,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '16px' : '18px',
          boxShadow: `0 4px 12px ${COLORS.atomicTangerine}60`,
        }}>
          {level.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff' }}>
            {name}
          </h2>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: COLORS.atomicTangerine, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {level.label}
          </span>
        </div>
      </div>
      
      <div style={{ marginTop: '4px', paddingTop: isMobile ? '8px' : '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.85rem', color: '#fff', fontWeight: 600 }}>
          {paises.length} {paises.length === 1 ? 'País' : 'Países'} · {stats.continents} Continentes
        </p>
        <p style={{ margin: 0, fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'rgba(255,255,255,0.65)' }}>
          {stats.tripCount} {stats.tripCount === 1 ? 'Viaje documentado' : 'Viajes documentados'}
        </p>
      </div>
    </Motion.div>
  );
};

export default React.memo(TravelerHud);
