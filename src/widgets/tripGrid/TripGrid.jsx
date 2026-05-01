/**
 * TripGrid — 2026 Spatial Experience
 * 
 * Features:
 *  - Responsive Masonry-like grid using CSS Grid
 *  - Spring-animated stagger transitions
 *  - GhostEmptyState for first-run experience
 */
import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TripCard from './ui/TripCard';
import GhostEmptyState from '@pages/trips/ui/components/GhostEmptyState';
import { cn } from '@shared/lib/utils/cn';

const TripGrid = ({
  trips = [],
  tripData = {},
  totalLogCount = 0,
  handleDelete,
}) => {
  const { t: tDashboard } = useTranslation('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  const hasNoTrips = totalLogCount === 0;
  const hasNoSearchResults = !hasNoTrips && trips.length === 0;

  const openTrip = (tripId) => {
    const trip = trips.find(t => t.id === tripId) || tripData[tripId];
    if (trip && trip.isShared) {
      navigate(`/trips/${tripId}`);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div className="w-full pb-14">
      <Motion.div 
        className={cn(
          "grid gap-4 md:gap-6 w-full",
          "grid-cols-[repeat(auto-fill,minmax(min(288px,100%),1fr))]"
        )}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {hasNoTrips ? (
          <div className="col-span-full">
            <GhostEmptyState />
          </div>
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
        <div className="text-center py-16 px-6 col-span-full flex flex-col items-center gap-2">
          <h3 className="text-xl font-bold text-charcoalBlue font-heading">
            {tDashboard('noResults')}
          </h3>
          <p className="text-text-secondary">
            {tDashboard('noResultsMessage')}
          </p>
        </div>
      )}

      {/* Outlet para rutas anidadas /trips/:id */}
      <Outlet />
    </div>
  );
};

export default TripGrid;