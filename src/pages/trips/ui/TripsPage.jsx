import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useSearch } from '@app/providers';
import { ENABLE_TRIPS_LIST_VIEW } from '@shared/config';
import TripGrid from '@widgets/tripGrid/TripGrid';
import TripListView from '@widgets/tripGrid/ui/TripListView';
import {
  applyTripFilters,
  buildCountryOptions,
  buildYearOptions,
} from '@widgets/tripGrid/lib/tripFilters';
import TripCommandBar from './components/TripCommandBar';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useLogStats } from '@features/gamification/model';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const VIEW_MODE_KEY = 'keeptrip_trips_view_mode';

const getInitialViewMode = () => {
  if (typeof window === 'undefined') return 'grid';
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const TripsPage = () => {
  const { t, i18n } = useTranslation(['dashboard', 'countries', 'nav']);
  useDocumentTitle(t('nav:pageTitle.journal'));

  const { data, crud } = useOutletContext();
  const { userProfile } = useAuth();
  const { busqueda, limpiarBusqueda } = useSearch();

  const [filters, setFilters] = useState(() => ({
    viewMode: getInitialViewMode(),
    year: 'all',
    country: 'all',
    scope: 'all',
    duration: 'all',
    curation: 'all',
    sort: 'recent',
  }));

  const trips = useMemo(() => data.bitacora ?? [], [data.bitacora]);
  const tripData = useMemo(() => data.bitacoraData ?? {}, [data.bitacoraData]);

  const handleFiltersChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      year: 'all',
      country: 'all',
      scope: 'all',
      duration: 'all',
      curation: 'all',
      sort: 'recent',
    }));
    limpiarBusqueda();
  }, [limpiarBusqueda]);

  // Persist the dual-view preference (default: grid for first-time visitors).
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, filters.viewMode);
    } catch {
      // Private mode / storage disabled — preference simply not persisted.
    }
  }, [filters.viewMode]);

  const filteredTrips = useMemo(
    () =>
      applyTripFilters({
        trips,
        tripData,
        searchQuery: busqueda,
        year: filters.year,
        country: filters.country,
        scope: filters.scope,
        duration: filters.duration,
        curation: filters.curation,
        sort: filters.sort,
        userProfile,
        i18nLang: i18n.language,
      }),
    [trips, tripData, busqueda, filters, userProfile, i18n.language]
  );

  const countryOptions = useMemo(
    () => buildCountryOptions(trips, tripData, i18n.language),
    [trips, tripData, i18n.language]
  );
  const yearOptions = useMemo(() => buildYearOptions(trips, tripData), [trips, tripData]);

  const tripsLogStats = useLogStats(trips, tripData);
  const searchTerm = busqueda.trim().toLowerCase();
  const isListView = ENABLE_TRIPS_LIST_VIEW && filters.viewMode === 'list';

  return (
    <div className="flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
      {/* 1. Single search authority + 5D filters + view switcher */}
      <div className="mb-3">
        <TripCommandBar
          filters={filters}
          onChange={handleFiltersChange}
          countryOptions={countryOptions}
          yearOptions={yearOptions}
          resultCount={filteredTrips.length}
          totalCount={trips.length}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* 2. Stats Bar */}
      <div className="mb-4">
        <TravelStatsWidget
          logStats={tripsLogStats}
          ariaLabel={t('stats.tripSummary')}
          variant="compact"
          containerClassName="w-full md:w-fit md:mx-auto md:justify-center max-w-4xl"
        />
      </div>

      {/* 3. Dual view: Grid (untouched) | List (Year headers + rows) */}
      <div className="flex-1 flex flex-col pb-0 md:pb-0 max-md:pb-[max(env(safe-area-inset-bottom),20px)]">
        {isListView ? (
          <TripListView
            trips={filteredTrips}
            tripData={tripData}
            crud={crud}
            userProfile={userProfile}
            sort={filters.sort}
            totalTripsCount={trips.length}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <TripGrid
            trips={filteredTrips}
            tripData={tripData}
            totalLogCount={trips.length}
            handleDelete={crud.solicitarEliminarViaje}
            isDeletingTrip={crud.isDeletingViaje}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Nested route modal support */}
      <Outlet />
    </div>
  );
};

export default TripsPage;
