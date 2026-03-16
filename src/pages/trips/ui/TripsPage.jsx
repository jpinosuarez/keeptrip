import React, { useState, useMemo } from 'react';
import { useOutletContext, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@app/providers/UIContext';
import TripGrid from '@widgets/tripGrid/TripGrid';
import TripCommandBar from './components/TripCommandBar';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';

const TripsPage = () => {
  const { t } = useTranslation('dashboard');
  useDocumentTitle(t('pageTitle.journal', 'Mis Viajes'));
  
  const { data, crud } = useOutletContext();
  const { busqueda } = useSearch();
  
  const [activeFilter, setActiveFilter] = useState('all'); // all, year, favorites
  
  const trips = data.bitacora || [];
  const tripData = data.bitacoraData || {};
  const searchTerm = busqueda.trim().toLowerCase();

  const filteredTrips = useMemo(() => {
    let result = trips;
    
    // Quick Filters
    if (activeFilter === 'year') {
       const currentYear = new Date().getFullYear();
       result = result.filter(t => {
          const start = tripData[t.id]?.startDate || t.date;
          return start && start.includes(currentYear.toString());
       });
    }
    
    // Search Term
    if (searchTerm) {
      result = result.filter(trip => {
        const d = tripData[trip.id] || {};
        const fields = [
          d.titulo,
          trip.nameSpanish,
          d.cities,
        ].filter(Boolean).join(' ').toLowerCase();
        return fields.includes(searchTerm);
      });
    }
    
    // Sort
    return result.sort((a, b) => {
      const dateA = new Date(tripData[a.id]?.startDate || a.date).getTime();
      const dateB = new Date(tripData[b.id]?.startDate || b.date).getTime();
      return dateB - dateA; // newest first
    });
  }, [trips, tripData, activeFilter, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <TripCommandBar 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter}
        tripCount={filteredTrips.length}
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
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
