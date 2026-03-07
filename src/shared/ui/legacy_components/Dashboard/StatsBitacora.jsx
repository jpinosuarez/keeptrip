import React from 'react';
import { Calendar, MapPin, BookOpen, Star } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';

const StatsBitacora = ({ bitacora = [], bitacoraData = {} }) => {
  const { t } = useTranslation('dashboard');
  
  // 1. Días totales (Suma de todas las duraciones)
  const calcularDiasTotales = () => {
    return bitacora.reduce((total, viaje) => {
      const data = bitacoraData[viaje.id];
      if (data?.fechaInicio && data?.fechaFin) {
        const d = Math.ceil((new Date(data.fechaFin) - new Date(data.fechaInicio)) / (1000 * 60 * 60 * 24)) + 1;
        return total + (d > 0 ? d : 1);
      }
      return total + 1;
    }, 0);
  };

  // 2. Ciudades registradas (Contar elementos separados por comas)
  const calcularTotalCiudades = () => {
    const todasCiudades = bitacora.map(v => bitacoraData[v.id]?.ciudades || "").join(',');
    return todasCiudades.split(',').filter(c => c.trim().length > 0).length;
  };

  // 3. Puntaje promedio (Rating)
  const calcularPromedio = () => {
    if (bitacora.length === 0) return "0.0";
    const suma = bitacora.reduce((acc, v) => acc + (bitacoraData[v.id]?.rating || 0), 0);
    return (suma / bitacora.length).toFixed(1);
  };

  const statsCrono = [
    { label: t('stats.totalDays'), value: calcularDiasTotales(), icon: <Calendar size={20} />, color: COLORS.danger },
    { label: t('stats.registeredCities'), value: calcularTotalCiudades(), icon: <MapPin size={20} />, color: '#3b82f6' },
    { label: t('stats.tripsCompleted'), value: bitacora.length, icon: <BookOpen size={20} />, color: '#10b981' },
    { label: t('stats.averageRating'), value: `${calcularPromedio()} / 5`, icon: <Star size={20} />, color: '#f59e0b' }
  ];

  return (
    <section style={{ padding: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
      {statsCrono.map((stat, index) => (
        <div key={index} style={{ 
          backgroundColor: COLORS.surface, padding: '20px', borderRadius: RADIUS.xl, 
          display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: SHADOWS.sm
        }}>
          <div style={{ backgroundColor: `${stat.color}15`, padding: '12px', borderRadius: '14px', color: stat.color }}>
            {stat.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default StatsBitacora;