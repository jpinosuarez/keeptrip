import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS, SHADOWS, GLASS, FONTS } from '../../theme';
import { routeMapStyles as s } from './RouteMap.styles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ─── Genera una curva bezier cuadrática entre cada par de puntos ───
function generateCurvedRoute(coordinates) {
  if (coordinates.length < 2) return coordinates;

  const result = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.01) {
      // Puntos casi idénticos — línea directa
      result.push(start);
      continue;
    }

    // Control point perpendicular al midpoint (15% offset)
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const offset = dist * 0.15;
    const cpX = midX - (dy / dist) * offset;
    const cpY = midY + (dx / dist) * offset;

    // Interpolar puntos de la curva
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

/**
 * Mapa interactivo de ruta para el VisorViaje — Modo Ruta.
 * Se centra con fitBounds al cargar; el feedback de parada activa
 * se da únicamente con el highlight del Marker (sin flyTo).
 */
const RouteMap = ({ paradas, activeIndex = 0, hoveredIndex = null, onMarkerHover, onMarkerHoverEnd, onMarkerClick, isModal = false }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // ─── fitBounds inicial (espera a que el mapa cargue) ───
  useEffect(() => {
    if (!mapLoaded || paradas.length === 0 || !mapRef.current) return;

    const map = mapRef.current;
    const bounds = new mapboxgl.LngLatBounds();
    paradas.forEach((p) => {
      if (p.coordenadas) bounds.extend(p.coordenadas);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 80, right: 80 },
        duration: 1000,
        maxZoom: 6,
      });
    }
  }, [mapLoaded, paradas]);

  // ─── GeoJSON: ruta curvada ───
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

  const containerStyle = isModal ? s.modalContainer : s.container;
  const displayIndex = hoveredIndex != null ? hoveredIndex : activeIndex;
  const activeName = paradas[displayIndex]?.nombre || '';

  return (
    <div style={containerStyle}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="mercator"
        onLoad={handleMapLoad}
        scrollZoom={false}
        dragRotate={false}
        reuseMaps
      >
        {/* Línea de ruta curvada */}
        {rutaGeoJSON && (
          <Source id="ruta-route" type="geojson" data={rutaGeoJSON}>
            <Layer
              id="ruta-route-line"
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

        {/* Pin Markers con número de orden */}
        {paradas.map((p, i) => {
          if (!p.coordenadas) return null;
          const isActive = i === activeIndex;
          const isHovered = i === hoveredIndex;
          const highlighted = isActive || isHovered;
          return (
            <Marker
              key={p.id || i}
              longitude={p.coordenadas[0]}
              latitude={p.coordenadas[1]}
              anchor="bottom"
              style={{ zIndex: highlighted ? 10 : 1 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: highlighted ? 'scale(1.4)' : 'scale(1)',
                  opacity: highlighted ? 1 : 0.6,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => onMarkerHover?.(i)}
                onMouseLeave={() => onMarkerHoverEnd?.()}
                onClick={() => onMarkerClick?.(i)}
              >
                {/* Pin */}
                <div style={{
                  width: highlighted ? '30px' : '22px',
                  height: highlighted ? '30px' : '22px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  background: highlighted ? COLORS.atomicTangerine : COLORS.textSecondary,
                  border: highlighted ? '3px solid white' : '2px solid rgba(255,255,255,0.6)',
                  boxShadow: highlighted ? SHADOWS.glow : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    transform: 'rotate(45deg)',
                    color: 'white',
                    fontSize: highlighted ? '0.7rem' : '0.6rem',
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

        <NavigationControl position="top-right" />
      </Map>

      {/* Label de parada activa */}
      <AnimatePresence mode="wait">
        {activeName && (
          <motion.div
            key={activeName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={s.activeLabel}
          >
            📍 {activeName}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RouteMap;
