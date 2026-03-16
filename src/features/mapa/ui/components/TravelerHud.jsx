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
        top: isMobile ? '12px' : '24px',
        left: isMobile ? '12px' : '24px',
        zIndex: 10,
        pointerEvents: 'auto',
        
        ...GLASS.dark,
        backgroundColor: 'rgba(30, 41, 59, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: RADIUS.xl,
        padding: isMobile ? '12px 16px' : '16px 24px',
        boxShadow: SHADOWS.float,
        
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: isMobile ? '200px' : '240px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: COLORS.atomicTangerine,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: `0 4px 12px ${COLORS.atomicTangerine}60`,
        }}>
          {level.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            {name}
          </h2>
          <span style={{ fontSize: '0.75rem', color: COLORS.atomicTangerine, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {level.label}
          </span>
        </div>
      </div>
      
      <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
          {paises.length} {paises.length === 1 ? 'País' : 'Países'} · {stats.continents} Continentes
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>
          {stats.tripCount} {stats.tripCount === 1 ? 'Viaje documentado' : 'Viajes documentados'}
        </p>
      </div>
    </Motion.div>
  );
};

export default React.memo(TravelerHud);
