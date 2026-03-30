import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS } from '@shared/config';
import { setMapLanguage } from '@shared/lib/geo';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const HomeMap = ({ paisesVisitados = [] }) => {
  const { i18n, t } = useTranslation('dashboard');
  const [hoverInfo, setHoverInfo] = useState(null);
  const mapRef = useRef(null);

  const onHover = useCallback(event => {
    const { features, lngLat } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature ? { 
      feature: hoveredFeature, 
      longitude: lngLat.lng, 
      latitude: lngLat.lat 
    } : null);
  }, []);

  const handleMapLoad = useCallback(e => {
    const map = e.target;
    mapRef.current = map;
    setMapLanguage(map, i18n.language);
  }, [i18n.language]);

  const listaPaises = paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST'];
  return (
    <div style={{ width: '100%', minWidth: 0, height: '100%', minHeight: 0, position: 'relative', background: COLORS.background, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
      <Map 
        style={{ width: '100%', minWidth: 0, height: '100%', minHeight: 0 }} 
        initialViewState={{ longitude: 0, latitude: 20, zoom: 0.6 }} 
        mapStyle="mapbox://styles/mapbox/light-v11" 
        mapboxAccessToken={MAPBOX_TOKEN} 
        projection="mercator" 
        reuseMaps 
        interactive={true} 
        renderWorldCopies={false} 
        minZoom={0} 
        maxZoom={3}
        maxBounds={[[-180, -85], [180, 85]]} 
        boxZoom={false} 
        keyboard={false} 
        scrollZoom={false} 
        dragPan={false} 
        dragRotate={false} 
        doubleClickZoom={false} 
        touchZoomRotate={false} 
        touchPitch={false} 
        pitchWithRotate={false} 
        onLoad={handleMapLoad}
        onMouseMove={onHover} 
        interactiveLayerIds={['country-fills']} 
        attributionControl={false}>
        <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
          <Layer id="country-fills" type="fill" source-layer="country_boundaries" paint={{ 'fill-color': COLORS.atomicTangerine, 'fill-opacity': ['match', ['get', 'iso_3166_1_alpha_3'], listaPaises, 0.8, 0] }} />
          <Layer id="borders" type="line" source-layer="country_boundaries" paint={{ 'line-color': '#cbd5e1', 'line-width': 0.5, 'line-opacity': 0.6 }} />
        </Source>
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="top"
            offset={[0, -10]}
          >
            <div style={{ background: 'rgba(30, 41, 59, 0.95)', color: 'white', padding: '6px 10px', borderRadius: RADIUS.xs, fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
              {hoverInfo.feature.properties[`name_${i18n.language}`] || hoverInfo.feature.properties.name_en || t('countryFallback')}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};
export default HomeMap;