import React, { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS, SHADOWS, GLASS } from '@shared/config';
import { setMapLanguage } from '@shared/lib/geo';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

import TravelerHud from './components/TravelerHud';
import TripSlideOver from './components/TripSlideOver';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function MapaView({ paises = [], paradas = [], trips = [], tripData = {} }) {
  const { i18n, t } = useTranslation('dashboard');
  useDocumentTitle(t('map', 'Mapa 3D'));
  const mapRef = useRef(null);
  const { isMobile } = useWindowSize(768);
  const [viewState, setViewState] = useState(() => ({
    longitude: 0,
    latitude: 20,
    zoom: isMobile ? 0 : 1.5,
  }));
  
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const handleLocateMe = React.useCallback(() => {
    mapRef.current?.flyTo({
      center: [20, 20],
      zoom: 1.5,
      duration: 1500,
      essential: true,
    });
  }, []);

  const onMapClick = React.useCallback((event) => {
    const feature = event.features && event.features[0];
    if (feature && feature.layer.id === 'unclustered-point') {
      const tripId = feature.properties.id;
      const trip = trips.find(t => t.id === tripId);
      
      if (trip) {
        setSelectedTrip(trip);
        setIsSlideOverOpen(true);
        
        mapRef.current?.flyTo({
          center: feature.geometry.coordinates,
          zoom: 5.5,
          duration: 1800,
          essential: true
        });
      }
    }
  }, [trips]);

  const paradasUnicas = useMemo(() => {
    const vistas = new Set();
    return paradas.filter((p) => {
      const key = `${p.coordenadas[0]},${p.coordenadas[1]}`;
      if (vistas.has(key)) return false;
      vistas.add(key);
      return true;
    });
  }, [paradas]);

  const paradasGeoJSON = {
    type: 'FeatureCollection',
    features: paradasUnicas.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p.coordenadas },
      properties: { id: p.id, name: p.nombre }
    }))
  };

  const listaPaises = paises.length > 0 ? paises : ['EMPTY'];
  const isEmptyMap = paises.length === 0;

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: RADIUS.xl, overflow: 'hidden', background: '#e0f2fe', position: 'relative' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={onMapClick}
        interactiveLayerIds={['unclustered-point']}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection={isMobile ? 'mercator' : 'globe'}
        onLoad={(e) => setMapLanguage(e.target, i18n.language)}
        reuseMaps
      >
        <Layer id="sky" type="sky" paint={{ 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0.0, 0.0], 'sky-atmosphere-sun-intensity': 5 }} />

        <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
          <Layer
            id="country-fills"
            type="fill"
            source-layer="country_boundaries"
            paint={{
              'fill-color': COLORS.atomicTangerine,
              'fill-opacity': ['match', ['get', 'iso_3166_1_alpha_3'], listaPaises, 0.6, 0]
            }}
          />
        </Source>

        <Source id="paradas" type="geojson" data={paradasGeoJSON} cluster={true} clusterMaxZoom={14} clusterRadius={50}>
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': COLORS.charcoalBlue,
              'circle-radius': ['step', ['get', 'point_count'], 15, 5, 20, 10, 30],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{ 'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 12 }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': COLORS.atomicTangerine,
              'circle-radius': 6,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'white'
            }}
          />
        </Source>

        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />
      </Map>

      {/* OVERLAY LAYER (HUD) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
        {!isEmptyMap && (
          <TravelerHud isMobile={isMobile} paises={paises} trips={trips} tripData={tripData} />
        )}
      </div>

      <AnimatePresence>
        {isEmptyMap && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              opacity: { duration: 0.3 }
            }}
            style={{
              position: 'absolute',
              right: '24px',
              bottom: '100px',
              ...GLASS.dark,
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: RADIUS.lg,
              padding: '12px 18px',
              fontSize: '0.86rem',
              fontWeight: '700',
              boxShadow: SHADOWS.lg,
              pointerEvents: 'none',
              zIndex: 3,
              maxWidth: '220px',
              textAlign: 'right'
            }}
          >
            {t('welcome.emptyStateDescription', 'El globo está en blanco. Planta tu primera bandera.')}
          </Motion.div>
        )}
      </AnimatePresence>
      
      <TripSlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        trip={selectedTrip} 
      />
    </div>
  );
}

export default MapaView;
