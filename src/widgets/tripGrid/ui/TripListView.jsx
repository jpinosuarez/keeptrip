import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CountryFlag from '@shared/ui/components/CountryFlag';
import GhostEmptyState from '@pages/trips/ui/components/GhostEmptyState';
import TripStoriesPlayerModal from '@features/viajes/viewer/components/TripStoriesPlayerModal';
import { buildTripStoryDeck } from '@features/viajes/viewer/lib/buildTripStoryDeck';
import {
  computeRouteTelemetry,
  ordenarParadasCronologicamente,
} from '@shared/lib/utils/viajeUtils';
import TripListRow from './TripListRow';
import { classifyScope, groupTripsByYear, mergeTrip } from '../lib/tripFilters';

/**
 * TripListView — chronological Year-Header archive of compact trip rows.
 * Annual telemetry is computed 100% in-memory (zero Firestore reads).
 */
const TripListView = ({
  trips = [],
  tripData = {},
  crud,
  userProfile = null,
  sort = 'recent',
  totalTripsCount = 0,
  onClearFilters = null,
}) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [activeStories, setActiveStories] = useState(null);

  const groupedYears = useMemo(
    () => groupTripsByYear(trips, tripData, sort),
    [trips, tripData, sort]
  );

  const handleView = useCallback(
    (tripId) => {
      navigate(`/trips/${tripId}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (tripId) => {
      navigate(`/trips?editing=${tripId}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (tripId) => {
      crud?.solicitarEliminarViaje?.(tripId);
    },
    [crud]
  );

  const handleOpenStories = useCallback(
    (tripId) => {
      const raw = tripData?.[tripId] || trips.find((trip) => trip.id === tripId) || {};
      const paradas = ordenarParadasCronologicamente(
        Array.isArray(raw.paradas) ? raw.paradas : []
      );
      const telemetry = computeRouteTelemetry(paradas, raw);
      const slides = buildTripStoryDeck({
        viaje: raw,
        paradasOrdenadas: paradas,
        photos: [],
        telemetry,
        userProfile,
      });
      setActiveStories({ tripId, slides });
    },
    [tripData, trips, userProfile]
  );

  // Empty archive → onboarding ghost (invite the first trip).
  if (totalTripsCount === 0) {
    return (
      <div className="w-full" data-testid="trips-list-empty-archive">
        <GhostEmptyState />
      </div>
    );
  }

  // Archive has trips, but the active filters/search returned none.
  if (!Array.isArray(trips) || trips.length === 0) {
    return (
      <div
        className="text-center py-16 px-6 flex flex-col items-center gap-3"
        data-testid="trips-list-no-results"
      >
        <h3 className="text-xl font-bold text-charcoalBlue font-heading">
          {t('noResults')}
        </h3>
        <p className="text-text-secondary">
          {t('noResultsFiltered', 'No se encontraron viajes con estos filtros.')}
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            data-testid="trips-list-clear-filters"
            className="min-h-[44px] px-5 rounded-full bg-atomicTangerine text-white font-bold border-none cursor-pointer"
          >
            {t('clearFilters', 'Limpiar filtros')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 pb-14" data-testid="trips-list-view">
      {groupedYears.map((group) => (
        <section key={group.year ?? 'undated'} className="flex flex-col">
          {/* Year header + annual telemetry */}
          <header className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 font-heading m-0">
                {group.year ?? t('undated', 'Sin fecha')}
              </h2>
              {group.uniqueCountries.length > 0 && (
                <span className="flex items-center" aria-hidden="true">
                  {group.uniqueCountries.slice(0, 6).map((code) => (
                    <CountryFlag key={code} code={code} size="sm" className="-ml-1 first:ml-0" />
                  ))}
                </span>
              )}
            </div>
            <span className="font-mono text-[0.75rem] text-slate-500">
              {t('annualSummary', {
                trips: group.totalTrips,
                countries: group.uniqueCountries.length,
                days: group.totalDays,
                defaultValue: '{{trips}} viajes · {{countries}} países · {{days}} días explorados',
              })}
            </span>
          </header>

          <div className="flex flex-col gap-3 mt-3">
            {group.trips.map((stub) => {
              const merged = mergeTrip(stub, tripData);
              return (
                <TripListRow
                  key={stub.id}
                  trip={merged}
                  isLocal={classifyScope(merged, userProfile) === 'local'}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onOpenStories={handleOpenStories}
                />
              );
            })}
          </div>
        </section>
      ))}

      <TripStoriesPlayerModal
        isOpen={Boolean(activeStories)}
        slides={activeStories?.slides || []}
        onClose={() => setActiveStories(null)}
      />
    </div>
  );
};

export default TripListView;
