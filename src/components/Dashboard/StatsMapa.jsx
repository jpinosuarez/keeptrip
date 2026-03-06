import React from 'react';
import { Globe, Compass, Clock, Map, Percent } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS } from '../../theme';
import { useTranslation } from 'react-i18next';

const StatsMapa = ({ bitacora = [], paisesVisitados = [] }) => {
  const { t } = useTranslation('dashboard');
  const totalPaisesMundo = 195;
  const countPaises = paisesVisitados.length;
  const porcentajeMundo = ((countPaises / totalPaisesMundo) * 100).toFixed(1);
  const continentesUnicos = [...new Set(bitacora.map(v => v.continente))].filter(Boolean).length;
  
  const obtenerUltimaAventura = () => {
    if (bitacora.length === 0) return "---";
    // Ordenamos descendente para sacar la más reciente
    // Suponemos que bitacora ya viene ordenada, pero por seguridad:
    const sorted = [...bitacora].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const ultima = new Date(sorted[0].fecha);
    const hoy = new Date();
    
    // Diferencia en meses
    const difMeses = (hoy.getFullYear() - ultima.getFullYear()) * 12 + (hoy.getMonth() - ultima.getMonth());
    
    if (difMeses === 0) return t('stats.thisMonth');
    if (difMeses < 12) return t('stats.monthsAgo', { count: difMeses });
    return t('stats.yearsAgo', { count: Math.floor(difMeses/12) });
  };

  const obtenerRegionPredominante = () => {
    if (bitacora.length === 0) return "---";
    const conteo = bitacora.reduce((acc, v) => {
      acc[v.continente] = (acc[v.continente] || 0) + 1;
      return acc;
    }, {});
    // Devuelve la clave con mayor valor
    return Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
  };

  const statsGeo = [
    { label: t('stats.countriesVisited'), value: `${countPaises} / ${totalPaisesMundo}`, icon: <Globe size={20} />, color: COLORS.mutedTeal },
    { label: t('stats.worldCovered'), value: `${porcentajeMundo}%`, icon: <Percent size={20} />, color: COLORS.atomicTangerine },
    { label: t('stats.continents'), value: `${continentesUnicos} de 7`, icon: <Compass size={20} />, color: COLORS.charcoalBlue },
    { label: t('stats.mainRegion'), value: obtenerRegionPredominante(), icon: <Map size={20} />, color: COLORS.atomicTangerine }
  ];

  return (
    <section style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '20px',
      width: '100%',
      marginBottom: '20px' // Espacio inferior seguro
    }}>
      {statsGeo.map((stat, index) => (
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

export default StatsMapa;