import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';
import { COLORS } from '@shared/config';
import { styles } from './TripGrid.styles';
import TripCard from './ui/TripCard';
import GhostEmptyState from '@pages/trips/ui/components/GhostEmptyState';
import { TripCardSkeleton } from '@shared/ui/components/Skeletons';
import { AnimatePresence } from 'framer-motion';
import './TripGrid.css';

const TripGrid = ({
  trips = [],
  tripData = {},
  totalLogCount = 0,
  handleDelete,
}) => {
  const { t: tDashboard } = useTranslation('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  const logStats = useLogStats(trips, tripData);

  const statItems = useMemo(() => {
    if (logStats.tripCount === 0) return [];
    return [
      { value: logStats.tripCount, label: tDashboard('stats.tripsCompleted') },
      { value: logStats.totalDays, label: tDashboard('stats.totalDays') },
      { value: logStats.totalCities, label: tDashboard('stats.registeredCities') },
      { value: logStats.continents, label: tDashboard('stats.continents') },
      { value: logStats.longestTrip, label: tDashboard('stats.longestTrip') },
      { value: logStats.totalPhotos, label: tDashboard('stats.photos') },
      ...(logStats.averageRating
        ? [{ value: `${logStats.averageRating}\u2605`, label: tDashboard('stats.averageRating'), accent: true }]
        : []),
    ];
  }, [logStats, tDashboard]);

  const hasNoTrips = totalLogCount === 0;
  const hasNoSearchResults = !hasNoTrips && trips.length === 0;

  const openTripEditor = (tripId) => {
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div style={styles.gridWrapper}>
      {trips.length > 0 && (
        <TravelStatsWidget stats={statItems} ariaLabel={tDashboard('stats.tripSummary', 'Resumen de viajes')} variant="compact" />
      )}

      <Motion.div 
        className="trip-masonry"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {hasNoTrips ? (
          <GhostEmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            {trips.map((trip) => {
              const data = tripData[trip.id] || trip || {};
              if (!data.nombreEspanol && !data.nameSpanish && !data.titulo) return null;

              const paradaCount = Array.isArray(data.paradas)
                ? data.paradas.length
                : String(data.ciudades || '')
                    .split(',')
                    .map((city) => city.trim())
                    .filter(Boolean).length;
              
              return (
                <Motion.div 
                  key={trip.id} 
                  layout
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 30 },
                    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <TripCard
                    trip={{ ...data, id: trip.id, paradaCount }}
                    variant="grid"
                    onClick={() => openTripEditor(trip.id)}
                    onDelete={handleDelete}
                  />
                </Motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </Motion.div>

      {hasNoSearchResults && (
        <div style={{ textAlign: 'center', padding: '64px 24px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1.2rem', color: COLORS.charcoalBlue }}>No encontramos viajes mágicos</h3>
          <p style={{ color: COLORS.textSecondary }}>Prueba ajustando tus filtros o búsqueda.</p>
        </div>
      )}

      {/* Outlet para rutas anidadas /trips/:id */}
      <Outlet />
    </div>
  );
};

export default TripGrid;