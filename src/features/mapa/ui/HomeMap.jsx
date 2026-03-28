import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS } from '@shared/config';
import { setMapLanguage } from '@shared/lib/geo';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const HomeMap = ({ paisesVisitados = [], isMobile = false }) => {
  const { i18n, t } = useTranslation('dashboard');
  const [hoverInfo, setHoverInfo] = useState(null);
  const onHover = useCallback(event => {
    const { features, point: { x, y } } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature ? { feature: hoveredFeature, x, y } : null);
  }, []);
  const listaPaises = paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST'];
  return (
    <div style={{ width: '100%', minWidth: 0, height: '100%', minHeight: 0, position: 'relative', background: COLORS.background, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
      <Map style={{ width: '100%', minWidth: 0, height: '100%', minHeight: 0 }} initialViewState={{ longitude: 0, latitude: 10, zoom: 1 }} mapStyle="mapbox://styles/mapbox/light-v11" mapboxAccessToken={MAPBOX_TOKEN} projection="mercator" reuseMaps interactive={true} renderWorldCopies={false} minZoom={0.45} maxBounds={[[-180, -70], [180, 85]]} boxZoom={false} keyboard={false} scrollZoom={false} dragPan={false} dragRotate={false} doubleClickZoom={false} touchZoomRotate={false} touchPitch={false} pitchWithRotate={false} onLoad={(e) => setMapLanguage(e.target, i18n.language)} onMouseMove={onHover} interactiveLayerIds={['country-fills']} attributionControl={false}>
        <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
          <Layer id="country-fills" type="fill" source-layer="country_boundaries" paint={{ 'fill-color': COLORS.atomicTangerine, 'fill-opacity': ['match', ['get', 'iso_3166_1_alpha_3'], listaPaises, 0.8, 0] }} />
          <Layer id="borders" type="line" source-layer="country_boundaries" paint={{ 'line-color': '#cbd5e1', 'line-width': 0.5, 'line-opacity': 0.6 }} />
        </Source>
        {hoverInfo && (
          <div style={{ position: 'absolute', zIndex: 10, pointerEvents: 'none', left: hoverInfo.x, top: hoverInfo.y, transform: 'translate(-50%, -120%)', background: 'rgba(30, 41, 59, 0.95)', color: 'white', padding: '6px 10px', borderRadius: RADIUS.xs, fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {hoverInfo.feature.properties[`name_${i18n.language}`] || hoverInfo.feature.properties.name_en || t('countryFallback')}
          </div>
        )}
      </Map>
    </div>
  );
};
export default HomeMap;