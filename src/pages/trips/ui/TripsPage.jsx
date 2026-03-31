import React, { useState, useMemo } from 'react';
import { useOutletContext, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@app/providers/UIContext';
import TripGrid from '@widgets/tripGrid/TripGrid';
import TripCommandBar from './components/TripCommandBar';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

const TripsPage = () => {
  const { t } = useTranslation('dashboard');
  useDocumentTitle(t('pageTitle.journal', 'Mis Viajes'));
  
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const { data, crud } = useOutletContext();
  const { busqueda } = useSearch();
  
  const [activeFilter, setActiveFilter] = useState('all'); // all, year
  
  const trips = useMemo(() => data.bitacora ?? [], [data.bitacora]);
  const tripData = useMemo(() => data.bitacoraData ?? {}, [data.bitacoraData]);
  const logStats = useLogStats(trips, tripData);
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
        const fields = [
          d.titulo,
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
  }, [trips, tripData, activeFilter, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
      <TripCommandBar 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter}
        logStats={logStats}
        isMobile={isMobile}
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>
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
