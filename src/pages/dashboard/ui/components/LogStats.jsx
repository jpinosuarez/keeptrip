import React from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@shared/config';

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
    const allCities = log.map(v => logData[v.id]?.cities || '').join(',');
    return allCities.split(',').filter(c => c.trim().length > 0).length;
  };

  const getAverageRating = () => {
    if (log.length === 0) return null;
    const sum = log.reduce((acc, v) => acc + (logData[v.id]?.rating || 0), 0);
    const avg = sum / log.length;
    return avg > 0 ? avg.toFixed(1) : null;
  };

  if (log.length === 0) return null;

  const rating = getAverageRating();
  const stats = [
    { value: log.length,        label: t('stats.tripsCompleted') },
    { value: getTotalDays(),    label: t('stats.totalDays') },
    { value: getTotalCities(),  label: t('stats.registeredCities') },
    ...(rating ? [{ value: `${rating}\u2605`, label: t('stats.averageRating'), accent: true }] : []),
  ];

  return (
    <div
      role="region"
      aria-label={t('stats.tripSummary', 'Resumen de viajes')}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        flexWrap: 'wrap',
        rowGap: '12px',
        paddingBottom: '4px',
        marginBottom: '8px',
      }}
    >
      {stats.map((stat, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: `0 ${i === 0 ? 0 : 20}px 0 ${i === 0 ? 0 : 20}px` }}>
            <span style={{
              fontSize: '1.6rem',
              fontWeight: '900',
              color: stat.accent ? COLORS.atomicTangerine : COLORS.charcoalBlue,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {stat.value}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '5px',
            }}>
              {stat.label}
            </span>
          </div>
          {i < stats.length - 1 && (
            <div aria-hidden="true" style={{
              width: '1px',
              alignSelf: 'stretch',
              backgroundColor: `rgba(44,62,80,0.1)`,
              flexShrink: 0,
              margin: '4px 0',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LogStats;
