import React, { useEffect, useRef, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS } from '../../theme';
import { routeMapStyles as s } from './RouteMap.styles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Mapa interactivo de ruta para el VisorViaje — Modo Ruta.
 * Hace flyTo al cambiar activeIndex.
 *
 * @param {{ paradas: Array, activeIndex: number, isModal?: boolean }} props
 * isModal: true para la versión fullscreen mobile (sin border-radius)
 */
const RouteMap = ({ paradas, activeIndex = 0, isModal = false }) => {
  const mapRef = useRef(null);
  const initialFitDone = useRef(false);

  // ---------- fitBounds inicial ----------
  useEffect(() => {
    if (paradas.length === 0 || !mapRef.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    paradas.forEach((p) => bounds.extend(p.coordenadas));

    mapRef.current.fitBounds(bounds, {
      padding: 60,
      duration: 800,
    });

    initialFitDone.current = true;
  }, [paradas]);

  // ---------- flyTo al cambiar parada activa ----------
  useEffect(() => {
    if (!initialFitDone.current) return;
    if (!mapRef.current || paradas.length === 0) return;
    const target = paradas[activeIndex];
    if (!target?.coordenadas) return;

    mapRef.current.flyTo({
      center: target.coordenadas,
      zoom: 11,
      duration: 1200,
      essential: true,
    });
  }, [activeIndex, paradas]);

  // ---------- GeoJSON ----------
  const rutaGeoJSON = useMemo(
    () => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: paradas.map((p) => p.coordenadas),
      },
    }),
    [paradas]
  );

  const paradasGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: paradas.map((p, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.coordenadas },
        properties: { name: p.nombre, index: i },
      })),
    }),
    [paradas]
  );

  // Highlight: un solo punto para la parada activa
  const activeGeoJSON = useMemo(() => {
    const target = paradas[activeIndex];
    if (!target?.coordenadas) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: target.coordenadas },
          properties: { name: target.nombre },
        },
      ],
    };
  }, [paradas, activeIndex]);

  const containerStyle = isModal ? s.modalContainer : s.container;
  const activeName = paradas[activeIndex]?.nombre || '';

  return (
    <div style={containerStyle}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 0, zoom: 1 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        reuseMaps
      >
        {/* Línea de ruta */}
        {paradas.length > 1 && (
          <Source id="ruta-route" type="geojson" data={rutaGeoJSON}>
            <Layer
              id="ruta-route-line"
              type="line"
              paint={{
                'line-color': COLORS.atomicTangerine,
                'line-width': 3,
                'line-dasharray': [2, 1],
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Puntos (todos) */}
        <Source id="puntos-route" type="geojson" data={paradasGeoJSON}>
          <Layer
            id="puntos-route-circle"
            type="circle"
            paint={{
              'circle-radius': 6,
              'circle-color': COLORS.charcoalBlue,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'white',
            }}
          />
        </Source>

        {/* Highlight activo */}
        {activeGeoJSON && (
          <Source id="active-stop" type="geojson" data={activeGeoJSON}>
            <Layer
              id="active-stop-glow"
              type="circle"
              paint={{
                'circle-radius': 18,
                'circle-color': COLORS.atomicTangerine,
                'circle-opacity': 0.18,
              }}
            />
            <Layer
              id="active-stop-circle"
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': COLORS.atomicTangerine,
                'circle-stroke-width': 3,
                'circle-stroke-color': 'white',
              }}
            />
          </Source>
        )}

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
