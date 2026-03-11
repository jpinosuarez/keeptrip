import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS } from '@shared/config';
import { setMapLanguage } from '@shared/lib/geo';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HomeMap = ({ paisesVisitados = [] }) => {
  const { i18n } = useTranslation();
  const [hoverInfo, setHoverInfo] = useState(null);

  const onHover = useCallback(event => {
    const { features, point: { x, y } } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature ? { feature: hoveredFeature, x, y } : null);
  }, []);

  // Asegurar que la lista no esté vacía para la expresión de Mapbox
  const listaPaises = paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST'];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.background, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 0.32, 
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="mercator"
        scrollZoom={false}
        dragPan={false}
        doubleClickZoom={false}
        onLoad={(e) => setMapLanguage(e.target, i18n.language)}
        onMouseMove={onHover}
        interactiveLayerIds={['country-fills']} // Solo interactuar con países pintados
        attributionControl={false}
      >
        <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
          
          {/* Capa de Relleno: Solo pinta si el ISO3 está en la lista */}
          <Layer
            id="country-fills"
            type="fill"
            source-layer="country_boundaries"
            paint={{
              'fill-color': COLORS.atomicTangerine,
              'fill-opacity': [
                'match',
                ['get', 'iso_3166_1_alpha_3'], // Campo del vector tile
                listaPaises,                   // Lista de mis países
                0.8,                           // Opacidad si coincide
                0                              // Opacidad si no coincide
              ]
            }}
          />

          {/* Fronteras */}
          <Layer
            id="borders"
            type="line"
            source-layer="country_boundaries"
            paint={{
              'line-color': '#cbd5e1',
              'line-width': 0.5,
              'line-opacity': 0.6
            }}
          />
        </Source>

        {hoverInfo && (
          <div style={{
            position: 'absolute',
            zIndex: 10,
            pointerEvents: 'none',
            left: hoverInfo.x,
            top: hoverInfo.y,
            transform: 'translate(-50%, -120%)',
            background: 'rgba(30, 41, 59, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: RADIUS.xs,
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {/* Mapbox suele tener name_es o name_en */}
            {hoverInfo.feature.properties[`name_${i18n.language}`] || hoverInfo.feature.properties.name_en || "País"}
          </div>
        )}
      </Map>
    </div>
  );
};

export default HomeMap;