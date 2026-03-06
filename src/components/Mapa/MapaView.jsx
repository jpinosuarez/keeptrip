import React, { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS, SHADOWS, GLASS } from '../../theme';
import { setMapLanguage } from '../../utils/mapLanguage';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function MapaView({ paises = [], paradas = [] }) {
  const { i18n } = useTranslation();
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({ longitude: 20, latitude: 20, zoom: 1.5 });

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
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="globe"
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

      <AnimatePresence>
        {isEmptyMap && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '18px',
              transform: 'translateX(-50%)',
              ...GLASS.dark,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: RADIUS.full,
              padding: '10px 16px',
              fontSize: '0.86rem',
              fontWeight: '700',
              boxShadow: SHADOWS.lg,
              pointerEvents: 'none',
              zIndex: 3,
              whiteSpace: 'nowrap',
              maxWidth: 'calc(100% - 24px)',
              textAlign: 'center'
            }}
          >
            Pulsa el boton (+) para marcar tu primer pais en el mapa
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MapaView;
