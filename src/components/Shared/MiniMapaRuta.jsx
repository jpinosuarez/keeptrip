import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS, SHADOWS, GLASS } from '../../theme';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ─── Curva bezier cuadrática (misma lógica que RouteMap) ───
function generateCurvedRoute(coordinates) {
  if (coordinates.length < 2) return coordinates;
  const result = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) { result.push(start); continue; }
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const offset = dist * 0.15;
    const cpX = midX - (dy / dist) * offset;
    const cpY = midY + (dx / dist) * offset;
    const steps = Math.max(30, Math.round(dist * 4));
    for (let t = 0; t <= 1; t += 1 / steps) {
      const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * cpX + t * t * end[0];
      const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * cpY + t * t * end[1];
      result.push([x, y]);
    }
  }
  result.push(coordinates[coordinates.length - 1]);
  return result;
}

const MiniMapaRuta = ({ paradas }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // fitBounds cuando el mapa y las paradas estén listas
  useEffect(() => {
    if (!mapLoaded || paradas.length === 0 || !mapRef.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    paradas.forEach((p) => {
      if (p.coordenadas) bounds.extend(p.coordenadas);
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 50, right: 50 },
        duration: 1000,
        maxZoom: 6,
      });
    }
  }, [mapLoaded, paradas]);

  // Línea curvada GeoJSON
  const rutaGeoJSON = useMemo(() => {
    const coords = paradas.filter((p) => p.coordenadas).map((p) => p.coordenadas);
    if (coords.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateCurvedRoute(coords),
      },
    };
  }, [paradas]);

  return (
    <div style={{
      width: '100%',
      height: '300px',
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      border: `1px solid ${COLORS.border}`,
    }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="mercator"
        interactive={false}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        {/* Línea de ruta curvada */}
        {rutaGeoJSON && (
          <Source id="ruta" type="geojson" data={rutaGeoJSON}>
            <Layer
              id="ruta-line"
              type="line"
              paint={{
                'line-color': COLORS.atomicTangerine,
                'line-width': 2.5,
                'line-dasharray': [4, 3],
                'line-opacity': 0.75,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>
        )}

        {/* Markers con labels */}
        {paradas.map((p, i) => {
          if (!p.coordenadas) return null;
          return (
            <Marker
              key={p.id || i}
              longitude={p.coordenadas[0]}
              latitude={p.coordenadas[1]}
              anchor="bottom"
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                {/* Nombre */}
                <div style={{
                  ...GLASS.dark,
                  borderRadius: RADIUS.full,
                  padding: '2px 8px',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  marginBottom: '3px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: SHADOWS.sm,
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.nombre}
                </div>
                {/* Pin */}
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  background: COLORS.charcoalBlue,
                  border: '2px solid white',
                  boxShadow: SHADOWS.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    transform: 'rotate(45deg)',
                    color: 'white',
                    fontSize: '0.5rem',
                    fontWeight: '800',
                    lineHeight: 1,
                  }}>
                    {i + 1}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default MiniMapaRuta;