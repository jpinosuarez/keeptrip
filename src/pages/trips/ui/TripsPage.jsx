import React, { useState, useMemo } from 'react';
import { useOutletContext, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@app/providers/UIContext';
import TripGrid from '@widgets/tripGrid/TripGrid';
import TripCommandBar from './components/TripCommandBar';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { useLogStats } from '@features/gamification/model';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';
import { cn } from '@shared/lib/utils/cn';

const TripsPage = () => {
  const { t, i18n } = useTranslation(['dashboard', 'countries']);
  useDocumentTitle(t('pageTitle.journal', 'Mis Viajes'));
  
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const { data, crud } = useOutletContext();
  const { busqueda } = useSearch();
  
  const [activeFilter, setActiveFilter] = useState('all'); // all, year
  
  const trips = useMemo(() => data.bitacora ?? [], [data.bitacora]);
  const tripData = useMemo(() => data.bitacoraData ?? {}, [data.bitacoraData]);
  const searchTerm = busqueda.trim().toLowerCase();

  const filteredTrips = useMemo(() => {
    let result = [...trips];
    
    // Quick Filters
    if (activeFilter === 'year') {
       const currentYear = new Date().getFullYear();
       result = result.filter(t => {
         const start = tripData[t.id]?.fechaInicio || tripData[t.id]?.startDate || t.fechaInicio || t.date;
          return start && start.includes(currentYear.toString());
       });
    }
    
    // Search Term
    if (searchTerm) {
      result = result.filter(trip => {
        const d = tripData[trip.id] || {};
        const countryCode = d.paisCodigo || d.code || d.countryCode || trip.paisCodigo || trip.code || trip.countryCode;
        const localizedCountryName = getLocalizedCountryName(countryCode, i18n.language, t);
        const fields = [
          d.titulo,
          localizedCountryName,
          d.nombreEspanol,
          trip.nombreEspanol,
          trip.nameSpanish,
          d.ciudades,
          d.cities,
        ].filter(Boolean).join(' ').toLowerCase();
        return fields.includes(searchTerm);
      });
    }
    
    // Sort
    return result.sort((a, b) => {
      const dateA = new Date(tripData[a.id]?.fechaInicio || tripData[a.id]?.startDate || a.fechaInicio || a.date).getTime();
      const dateB = new Date(tripData[b.id]?.fechaInicio || tripData[b.id]?.startDate || b.fechaInicio || b.date).getTime();
      return dateB - dateA; // newest first
    });
  }, [trips, tripData, activeFilter, searchTerm, i18n.language, t]);

  const tripsLogStats = useLogStats(trips, tripData);

  return (
    <div className="flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
      {/* 1. Stats Bar at the top. Increased bottom margin to let it breathe. */}
      <div className="mb-4 mt-1">
        <TravelStatsWidget
          logStats={tripsLogStats}
          ariaLabel={t('stats.tripSummary')}
          variant="compact"
          isMobile={isMobile}
        />
      </div>

      {/* 2. Filters Bar below the Stats Bar. Added bottom margin. */}
      <div className="mb-4">
        <TripCommandBar 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          isMobile={isMobile}
        />
      </div>
      
      {/* 3. Trips Grid */}
      <div className={cn("flex-1 flex flex-col", isMobile ? "pb-[max(env(safe-area-inset-bottom),20px)]" : "pb-0")}>
        <TripGrid 
          trips={filteredTrips} 
          tripData={tripData}
          totalLogCount={trips.length}
          handleDelete={crud.solicitarEliminarViaje}
          isDeletingTrip={crud.isDeletingViaje}
          searchTerm={searchTerm}
        />
      </div>
      
      {/* Nested route modal support */}
      <Outlet />
    </div>
  );
};

export default TripsPage;
