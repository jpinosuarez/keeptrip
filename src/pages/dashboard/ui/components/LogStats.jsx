import React from 'react';
import { Calendar, MapPin, BookOpen, Star } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';

const LogStats = ({ log = [], logData = {} }) => {
  const { t } = useTranslation('dashboard');

  const getTotalDays = () => {
    return log.reduce((total, trip) => {
      const data = logData[trip.id];
      if (data?.startDate && data?.endDate) {
        const d = Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return total + (d > 0 ? d : 1);
      }
      return total + 1;
    }, 0);
  };

  const getTotalCities = () => {
    const allCities = log.map(v => logData[v.id]?.cities || "").join(',');
    return allCities.split(',').filter(c => c.trim().length > 0).length;
  };

  const getAverageRating = () => {
    if (log.length === 0) return "0.0";
    const sum = log.reduce((acc, v) => acc + (logData[v.id]?.rating || 0), 0);
    return (sum / log.length).toFixed(1);
  };

  const stats = [
    { label: t('stats.totalDays'), value: getTotalDays(), icon: <Calendar size={20} />, color: COLORS.danger },
    { label: t('stats.registeredCities'), value: getTotalCities(), icon: <MapPin size={20} />, color: '#3b82f6' },
    { label: t('stats.tripsCompleted'), value: log.length, icon: <BookOpen size={20} />, color: '#10b981' },
    { label: t('stats.averageRating'), value: `${getAverageRating()} / 5`, icon: <Star size={20} />, color: '#f59e0b' }
  ];

  return (
    <section style={{ padding: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
      {stats.map((stat, index) => (
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

export default LogStats;
