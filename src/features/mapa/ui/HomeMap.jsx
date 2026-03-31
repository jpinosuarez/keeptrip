import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Popup, AttributionControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS, RADIUS } from '@shared/config';
import { setMapLanguage } from '@shared/lib/geo';

/**
 * Inhabited World Bounds: Lat -60 (south of Argentina) to Lat 80 (north of Russia).
 * Frames all inhabited landmasses with comfortable margins.
 */
const INHABITED_BOUNDS = [
  [-180, -60],
  [180, 80],
];

/**
 * Mercator Aspect Ratio for the Inhabited World bounds.
 *
 * Derivation using Web Mercator Y formula: y = ln(tan(π/4 + φ/2))
 *   y(80°)  = ln(tan(85°)) ≈  2.43625
 *   y(-60°) = ln(tan(15°)) ≈ -1.31696
 *   Y_range = 2.43625 − (−1.31696) = 3.75321
 *   X_range = 2π (full 360° longitude sweep)
 *   AR = X_range / Y_range = 6.28318 / 3.75321 ≈ 1.6741
 */
const WORLD_AR = 1.6741;

/**
 * "Object-fit: contain" for WebGL — returns the largest map dimensions
 * that preserve WORLD_AR within the given container bounds.
 */
function computeContainedSize(containerW, containerH) {
  if (containerW <= 0 || containerH <= 0) return { width: 0, height: 0 };
  const containerAR = containerW / containerH;
  if (containerAR > WORLD_AR) {
    // Container is wider → height-constrained: use full height, shrink width
    return { width: Math.floor(containerH * WORLD_AR), height: Math.floor(containerH) };
  }
  // Container is taller → width-constrained: use full width, shrink height
  return { width: Math.floor(containerW), height: Math.floor(containerW / WORLD_AR) };
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HomeMap = ({ paisesVisitados = [], isMobile = false }) => {
  const { i18n, t } = useTranslation('dashboard');
  const [hoverInfo, setHoverInfo] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapDims, setMapDims] = useState({ width: 0, height: 0 });
  const [mapReady, setMapReady] = useState(false);
  const rafIdRef = useRef(null);

  // ── ResizeObserver: watches container and computes contained map dimensions ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      // Debounce via rAF to prevent re-render storms during live resize
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dims = computeContainedSize(width, height);
          setMapDims((prev) =>
            prev.width === dims.width && prev.height === dims.height ? prev : dims
          );
        }
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ── Fit the inhabited world whenever map dimensions stabilize or map loads ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || mapDims.width <= 0 || mapDims.height <= 0) return;

    const id = requestAnimationFrame(() => {
      map.resize();
      try {
        map.fitBounds(INHABITED_BOUNDS, {
          padding: { top: 10, bottom: 36, left: 10, right: 10 },
          duration: 0,
        });
      } catch (error) {
        console.error('fitBounds failed:', error);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [mapDims, mapReady]);

  const onHover = useCallback((event) => {
    const { features, lngLat } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(
      hoveredFeature
        ? { feature: hoveredFeature, longitude: lngLat.lng, latitude: lngLat.lat }
        : null
    );
  }, []);

  const handleMapLoad = useCallback(
    (e) => {
      const map = e.target;
      mapRef.current = map;
      setMapLanguage(map, i18n.language);
      setMapReady(true);
    },
    [i18n.language]
  );

  const listaPaises = paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST'];
  const hasValidDims = mapDims.width > 0 && mapDims.height > 0;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: COLORS.background,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {hasValidDims && (
        <Map
          style={{
            width: mapDims.width,
            height: mapDims.height,
            flexShrink: 0,
            borderRadius: RADIUS.xl,
          }}
          initialViewState={{ longitude: 0, latitude: 15, zoom: 1.5 }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="mercator"
          reuseMaps
          preventStyleDiffing={true}
          interactive={true}
          renderWorldCopies={false}
          minZoom={0}
          maxZoom={2.8}
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
          attributionControl={false}
        >
          <AttributionControl position="bottom-left" compact={true} />
          <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
            <Layer
              id="country-fills"
              type="fill"
              source-layer="country_boundaries"
              paint={{
                'fill-color': COLORS.atomicTangerine,
                'fill-opacity': ['match', ['get', 'iso_3166_1_alpha_3'], listaPaises, 0.8, 0],
              }}
            />
            <Layer
              id="borders"
              type="line"
              source-layer="country_boundaries"
              paint={{
                'line-color': '#cbd5e1',
                'line-width': 0.5,
                'line-opacity': 0.6,
              }}
            />
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
              <div>
                {hoverInfo.feature.properties[`name_${i18n.language}`] ||
                  hoverInfo.feature.properties.name_en ||
                  t('countryFallback')}
              </div>
            </Popup>
          )}
        </Map>
      )}
    </div>
  );
};

export default HomeMap;