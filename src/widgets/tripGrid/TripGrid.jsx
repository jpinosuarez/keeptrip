import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// DEPRECATED: TravelStatsWidget widget moved to TripCommandBar (TravelStatsWidget now uses logStats API, not stats)
// import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';
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

  // DEPRECATED: statItems - stats are now displayed in TripCommandBar
  // const statItems = useMemo(() => { ... });

  const hasNoTrips = totalLogCount === 0;
  const hasNoSearchResults = !hasNoTrips && trips.length === 0;

  const openTrip = (tripId) => {
    // Determine if the trip is shared (read-only for this user)
    const trip = trips.find(t => t.id === tripId) || tripData[tripId];
    if (trip && trip.isShared) {
      if (location.pathname.startsWith('/trips')) {
        navigate(`/trips/${tripId}`);
      } else {
        navigate(`/trips/${tripId}`);
      }
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div style={styles.gridWrapper}>
      {/* DEPRECATED: TravelStatsWidget moved to TripCommandBar for centralized stats display */}
      {/* Stats are now displayed in TripCommandBar with TravelStatsWidget (home & trips variants) */}

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
              if (!data.titulo && !data.nombreEspanol && !data.nameSpanish && !data.paisCodigo && !data.code && !data.countryCode) {
                return null;
              }

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
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 30 },
                    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <TripCard
                    trip={{ ...data, id: trip.id, paradaCount }}
                    variant="grid"
                    onClick={() => openTrip(trip.id)}
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
          <h3 style={{ fontSize: '1.2rem', color: COLORS.charcoalBlue }}>{tDashboard('noResults')}</h3>
          <p style={{ color: COLORS.textSecondary }}>{tDashboard('noResultsMessage')}</p>
        </div>
      )}

      {/* Outlet para rutas anidadas /trips/:id */}
      <Outlet />
    </div>
  );
};

export default TripGrid;