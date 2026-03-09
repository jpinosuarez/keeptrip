import React from 'react';
import { Globe, Compass, Map, Percent } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';

const MapStats = ({ log = [], countriesVisited = [] }) => {
  const { t } = useTranslation('dashboard');
  const totalCountries = 195;
  const countCountries = countriesVisited.length;
  const worldPercent = ((countCountries / totalCountries) * 100).toFixed(1);
  const uniqueContinents = [...new Set(log.map(v => v.continent))].filter(Boolean).length;

  const getMainRegion = () => {
    if (log.length === 0) return "---";
    const count = log.reduce((acc, v) => {
      acc[v.continent] = (acc[v.continent] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
  };

  const stats = [
    { label: t('stats.countriesVisited'), value: `${countCountries} / ${totalCountries}`, icon: <Globe size={20} />, color: COLORS.mutedTeal },
    { label: t('stats.worldCovered'), value: `${worldPercent}%`, icon: <Percent size={20} />, color: COLORS.atomicTangerine },
    { label: t('stats.continents'), value: `${uniqueContinents} of 7`, icon: <Compass size={20} />, color: COLORS.charcoalBlue },
    { label: t('stats.mainRegion'), value: getMainRegion(), icon: <Map size={20} />, color: COLORS.atomicTangerine }
  ];

  return (
    <section style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '20px',
      width: '100%',
      marginBottom: '20px'
    }}>
      {stats.map((stat, index) => (
        <div key={index} style={{ 
          backgroundColor: COLORS.surface, 
          padding: '20px', 
          borderRadius: RADIUS.xl,
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          border: '1px solid rgba(44, 62, 80, 0.05)', 
          boxShadow: SHADOWS.sm
        }}>
          <div style={{ 
            backgroundColor: `${stat.color}15`, 
            padding: '12px', 
            borderRadius: '14px', 
            color: stat.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {stat.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: '900', color: COLORS.charcoalBlue }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default MapStats;
