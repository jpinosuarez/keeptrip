import { cn } from '@shared/lib/utils/cn';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Marker } from 'react-map-gl';
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
const RouteMap = ({ paradas = [], countryCodes = [], paisCodigo = null, hoveredStopId = null, onHoverStop, telemetry = null, isModal = false }) => {
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
    const hasStops = Array.isArray(paradas) && paradas.length > 0;

    // STOP-FIRST: once stops exist they are the only geographic truth. Root
    // trip metadata may be stale and must never add "intruder" countries.
    if (hasStops) {
      return collectCountryCodes({ viaje: { paisCodigo }, paradas });
    }

    const provided = (Array.isArray(countryCodes) ? countryCodes : [])
      .map((code) => normalizeCountryCode(code))
      .filter(Boolean);
    if (provided.length > 0) return provided;

    return collectCountryCodes({ viaje: { paisCodigo }, paradas: [] });
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

  // ─── Country-framed camera: refit when the bounds SIGNATURE changes ───
  // This guarantees the map frames only the real stops/countries as soon as
  // `paradas` finishes loading (or after edits), never before.
  const lastFittedBoundsKeyRef = useRef('');
  const boundsKey = tripBounds ? JSON.stringify(tripBounds) : '';

  useEffect(() => {
    if (!mapLoaded || !tripBounds || !boundsKey) return undefined;
    if (boundsKey === lastFittedBoundsKeyRef.current) return undefined;

    const applyBounds = () => {
      const map = mapRef.current;
      if (!map) return;
      lastFittedBoundsKeyRef.current = boundsKey;
      map.resize(); // fuerza recalcular dimensiones del contenedor
      map.fitBounds(tripBounds, {
        padding: 48,
        maxZoom: 6,
        duration: 0,
      });
    };

    if (isModal) {
      const timer = setTimeout(applyBounds, 200);
      return () => clearTimeout(timer);
    }

    applyBounds();
    return undefined;
  }, [mapLoaded, tripBounds, boundsKey, isModal]);

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

  const hoveredStop = hoveredStopId
    ? paradas.find((parada) => parada?.id === hoveredStopId) || null
    : null;
  const routeSummary =
    paradas
      .map((parada) => parada?.ciudad || parada?.nombre || parada?.name)
      .filter(Boolean)
      .join(' ➔ ') || t('visor:map.routeSummary', 'Ruta del viaje');
  const totalKm = Number(telemetry?.totalKm) > 0 ? ` · ${telemetry.totalKm} km` : '';
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
            const isHovered = Boolean(hoveredStopId && p.id === hoveredStopId);
            return (
              <Marker
                key={p.id || i}
                longitude={p.coordenadas[0]}
                latitude={p.coordenadas[1]}
                anchor="center"
                style={{ zIndex: isHovered ? 30 : 10 }}
              >
                <div
                  data-testid={`route-map-stop-${p.id || i}`}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full opacity-100",
                    "bg-atomicTangerine border-2 border-white shadow-md transition-transform duration-200",
                    isHovered
                      ? "scale-125 z-30 ring-4 ring-[#FF6B35]/40 shadow-lg"
                      : "scale-100 z-10"
                  )}
                  onMouseEnter={() => onHoverStop?.(p.id)}
                  onMouseLeave={() => onHoverStop?.(null)}
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

      {/* Bottom legend: route overview (idle) ⇄ stop details (hover) */}
      {!isWebGLDisabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none max-w-[calc(100%-32px)]">
          {hoveredStop ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B35] text-white text-xs font-semibold shadow-lg border border-white/20 transition-all duration-200">
              <span>📍</span>
              <span className="truncate">
                {hoveredStop.orden || (paradas.indexOf(hoveredStop) + 1)}.{' '}
                {hoveredStop.ciudad || hoveredStop.nombre || hoveredStop.name}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B35] text-white text-xs font-semibold shadow-lg border border-white/20 transition-all duration-200">
              <span>🗺️</span>
              <span className="truncate">
                {routeSummary}
                {totalKm}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteMap;
