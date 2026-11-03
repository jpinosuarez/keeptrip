import { cn } from '@shared/lib/utils/cn';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { setMapLanguage, generateCurvedRoute } from '@shared/lib/geo';
import { getTripMapBounds, collectCountryCodes } from '@shared/lib/geo/mapBounds';
import { getCountryISO3, normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { OperationalMapFallback } from '@shared/ui/components';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Static infographic route map for the Trip Viewer.
 * No pan/zoom/rotate: it frames the trip once and never moves (no flyTo).
 */
const RouteMap = ({ paradas = [], countryCodes = [], paisCodigo = null, activeIndex = 0, hoveredIndex = null, hoveredStopId = null, onMarkerHover, onMarkerHoverEnd, onMarkerClick, isModal = false }) => {
  const { i18n, t } = useTranslation(['dashboard', 'visor']);
  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isWebGLDisabled = operationalLevel >= 2;
  const mapShieldMessage = t(
    'map.shieldOverlay',
    'Interactive maps are resting. Your journey data remains safe.'
  );
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const resolvedCountryCodes = useMemo(() => {
    const provided = (Array.isArray(countryCodes) ? countryCodes : [])
      .map((code) => normalizeCountryCode(code))
      .filter(Boolean);
    if (provided.length > 0) return provided;
    return collectCountryCodes(paradas, paisCodigo);
  }, [countryCodes, paradas, paisCodigo]);

  const countryIso3List = useMemo(
    () => resolvedCountryCodes.map((code) => getCountryISO3(code)).filter(Boolean),
    [resolvedCountryCodes]
  );

  const tripBounds = useMemo(
    () => getTripMapBounds({ paradas, countryCodes: resolvedCountryCodes }),
    [paradas, resolvedCountryCodes]
  );

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    if (mapRef.current) setMapLanguage(mapRef.current, i18n.language);
  }, [i18n.language]);

  // ─── fitBounds helper — country-framed, runs ONCE on load (no flyTo) ───
  const fitMapToBounds = useCallback(() => {
    if (!mapRef.current || !tripBounds) return;
    const map = mapRef.current;
    map.resize(); // fuerza recalcular dimensiones del contenedor
    map.fitBounds(tripBounds, {
      padding: 48,
      maxZoom: 6,
      duration: 0,
    });
  }, [tripBounds]);

  // ─── fitBounds inicial (espera a que el mapa cargue) ───
  useEffect(() => {
    if (!mapLoaded) return undefined;
    if (isModal) {
      const timer = setTimeout(fitMapToBounds, 200);
      return () => clearTimeout(timer);
    }
    fitMapToBounds();
    return undefined;
  }, [mapLoaded, fitMapToBounds, isModal]);

  // ─── GeoJSON: ruta curvada ───
  const rutaGeoJSON = useMemo(() => {
    const coords = paradas
      .filter((p) => Array.isArray(p?.coordenadas) && p.coordenadas.length >= 2)
      .map((p) => p.coordenadas);
    if (coords.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateCurvedRoute(coords),
      },
    };
  }, [paradas]);

  const displayIndex = hoveredIndex != null ? hoveredIndex : activeIndex;
  const activeName = paradas[displayIndex]?.nombre || '';

  return (
    <div className={cn(
      "w-full h-full overflow-hidden relative",
      isModal ? "rounded-none" : "rounded-xl border border-border"
    )}>
      {isWebGLDisabled ? (
        <OperationalMapFallback
          message={mapShieldMessage}
          borderRadius={isModal ? 0 : "var(--radius-xl)"}
        />
      ) : (
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="mercator"
          onLoad={handleMapLoad}
          interactive={false}
          dragPan={false}
          scrollZoom={false}
          boxZoom={false}
          dragRotate={false}
          keyboard={false}
          doubleClickZoom={false}
          touchZoomRotate={false}
          touchPitch={false}
          pitchWithRotate={false}
          renderWorldCopies={false}
          reuseMaps
        >
          {/* País(es) del viaje resaltados (Atomic Tangerine) sobre country-boundaries */}
          <Source id="trip-countries" type="vector" url="mapbox://mapbox.country-boundaries-v1">
            <Layer
              id="trip-countries-fill"
              type="fill"
              source-layer="country_boundaries"
              filter={['in', ['get', 'iso_3166_1_alpha_3'], ['literal', countryIso3List]]}
              paint={{ 'fill-color': '#FF6B35', 'fill-opacity': 0.18 }}
            />
            <Layer
              id="trip-countries-border"
              type="line"
              source-layer="country_boundaries"
              filter={['in', ['get', 'iso_3166_1_alpha_3'], ['literal', countryIso3List]]}
              paint={{ 'line-color': '#FF6B35', 'line-width': 1.5, 'line-opacity': 0.9 }}
            />
          </Source>

          {/* Línea de ruta curvada (dashed) */}
          {rutaGeoJSON && (
            <Source id="ruta-route" type="geojson" data={rutaGeoJSON}>
              <Layer
                id="ruta-route-line"
                type="line"
                paint={{
                  'line-color': '#FF6B35', // atomicTangerine
                  'line-width': 3,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.95,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          )}

          {/* Pines numerados — siempre visibles (infografía estática) */}
          {paradas.map((p, i) => {
            if (!Array.isArray(p?.coordenadas) || p.coordenadas.length < 2) return null;
            const isActive = i === activeIndex;
            const isIndexHovered = i === hoveredIndex;
            const isIdHovered = Boolean(hoveredStopId && p.id === hoveredStopId);
            const highlighted = isActive || isIndexHovered || isIdHovered;
            return (
              <Marker
                key={p.id || i}
                longitude={p.coordenadas[0]}
                latitude={p.coordenadas[1]}
                anchor="center"
                style={{ zIndex: highlighted ? 20 : 1 }}
              >
                <div
                  data-testid={`route-map-stop-${p.id || i}`}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full opacity-100",
                    "bg-atomicTangerine border-2 border-white shadow-md transition-transform duration-200",
                    highlighted && "scale-125 z-20 ring-4 ring-[#FF6B35]/30"
                  )}
                  onMouseEnter={() => onMarkerHover?.(i)}
                  onMouseLeave={() => onMarkerHoverEnd?.()}
                  onClick={() => onMarkerClick?.(i)}
                >
                  <span className="text-white text-[0.72rem] font-black leading-none">
                    {i + 1}
                  </span>
                </div>
              </Marker>
            );
          })}
        </Map>
      )}

      {/* Label de parada activa */}
      <AnimatePresence mode="wait">
        {!isWebGLDisabled && activeName && (
          <Motion.div
            key={activeName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/40 text-white border border-white/20 rounded-full px-[18px] py-2 text-[0.85rem] font-bold shadow-lg pointer-events-none z-[3] whitespace-nowrap max-w-[calc(100%-32px)] text-center"
          >
            📍 {activeName}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RouteMap;
