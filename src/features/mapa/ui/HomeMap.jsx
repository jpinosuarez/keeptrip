import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS } from '@shared/config';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { setMapLanguage } from '@shared/lib/geo';
import { OperationalMapFallback } from '@shared/ui/components';
import { cn } from '@shared/lib/utils/cn';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryISO3, getCountryCentroid } from '@shared/lib/utils/countryUtils';

// Desktop: full inhabited world (S. Argentina → N. Russia).
// Asymmetric padding (top > bottom) compensates for Mercator's polar distortion,
// visually trimming Greenland without altering the southern boundary.
// Padding reduced (iteration 2) to avoid clipping at N/S extremes.
const WORLD_BOUNDS_DESKTOP = [[-170, -58], [170, 74]];
const WORLD_PADDING_DESKTOP = { top: 25, bottom: 10, left: 8, right: 8 };

// Mobile: mapCard is fixed at 240px tall and full-width (~390px), ratio ≈ 1.6:1.
// GEOMETRIC CONSTRAINT: In Mercator, the inhabited world width/height ratio is ~1.96:1,
// which is always wider than the mobile container. With full longitude, width is the
// binding constraint, and ~17px of ocean will appear at top/bottom (unavoidable).
// Restoring full longitude range (-170/170) to eliminate the side clipping from iter.2.
// Ocean vertical strips minimized by: max lat bounds + near-zero padding + slight top
// asymmetry to counter Mercator's polar distortion and center on the inhabited world.
const WORLD_BOUNDS_MOBILE = [[-170, -58], [170, 74]];
const WORLD_PADDING_MOBILE = { top: 10, bottom: 2, left: 2, right: 2 };

const MAP_OCEAN_COLOR = '#e0e6ed';
const MIN_WORLD_ZOOM = -2; // Permite a mapbox hacer zoom-out en pantallas estrechas (mobile)


// Estilo en blanco para eliminar TODOS los tags geográficos y nombres por defecto de Mapbox
const BLANK_STYLE = {
  version: 8,
  name: 'Blank',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': MAP_OCEAN_COLOR }
    }
  ]
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HomeMap = ({ paisesVisitados = [], isMobile = false, userProfile: propProfile = null }) => {
  const { i18n, t } = useTranslation('dashboard');
  const auth = useAuth() || {};
  const profile = propProfile || auth.userProfile || null;

  const birthIso3 = profile?.birthCountry ? getCountryISO3(profile.birthCountry) : null;
  const residenceIso3 = profile?.residenceCountry ? getCountryISO3(profile.residenceCountry) : null;

  const initialCameraCoords = useMemo(() => {
    if (profile?.baseCity?.coordinates) {
      return profile.baseCity.coordinates;
    }
    if (profile?.residenceCountry) {
      const c = getCountryCentroid(profile.residenceCountry);
      if (c) return c;
    }
    if (profile?.birthCountry) {
      const c = getCountryCentroid(profile.birthCountry);
      if (c) return c;
    }
    return null;
  }, [profile]);

  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isWebGLDisabled = operationalLevel >= 2;
  const mapShieldMessage = t(
    'map.shieldOverlay',
    'Interactive maps are resting. Your journey data remains safe.'
  );
  const [hoverInfo, setHoverInfo] = useState(null);
  const mapRef = useRef(null);
  const isMobileRef = useRef(isMobile);
  const mapContainerRef = useRef(null);
  const isIntersectingRef = useRef(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);

  // Active scroll hibernation: pause Mapbox hit-testing and halt camera during scroll
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timer = null;
    const onScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        setIsScrolling(true);
        if (mapRef.current?.stop) {
          mapRef.current.stop();
        }
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        isScrollingRef.current = false;
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Hibernation during modal overlays (?editing= or ?new)
  const [isModalOccluded, setIsModalOccluded] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location?.search || '');
    return params.has('editing') || params.has('new');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkModalOcclusion = () => {
      const params = new URLSearchParams(window.location?.search || '');
      const occluded = params.has('editing') || params.has('new');
      setIsModalOccluded((prev) => (prev !== occluded ? occluded : prev));
      if (occluded) setHoverInfo(null);
    };

    window.addEventListener('popstate', checkModalOcclusion);
    const interval = setInterval(checkModalOcclusion, 500);

    return () => {
      window.removeEventListener('popstate', checkModalOcclusion);
      clearInterval(interval);
    };
  }, []);

  // Viewport intersection hibernation
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !mapContainerRef.current) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
      if (!entry.isIntersecting) {
        setHoverInfo(null);
      }
    }, { threshold: 0.05 });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const onHover = useCallback(event => {
    if (isScrollingRef.current || !isIntersectingRef.current || isModalOccluded) return;
    const { features, lngLat } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature ? {
      feature: hoveredFeature,
      longitude: lngLat.lng,
      latitude: lngLat.lat
    } : null);
  }, [isModalOccluded]);

  const fitWorld = useCallback(map => {
    if (!map) return;
    const mobile = isMobileRef.current;
    
    // Stabilize map dimensions before fitting bounds
    map.resize();
    
    map.fitBounds(
      mobile ? WORLD_BOUNDS_MOBILE : WORLD_BOUNDS_DESKTOP,
      {
        padding: mobile ? WORLD_PADDING_MOBILE : WORLD_PADDING_DESKTOP,
        duration: 0,
        animate: false,
      }
    );
  }, []);

  useEffect(() => { 
    isMobileRef.current = isMobile; 
    // Re-fit world framing when switching between mobile/desktop layouts
    if (mapRef.current) {
      fitWorld(mapRef.current);
    }
  }, [isMobile, fitWorld]);

  // Sync map language when user changes language preference
  useEffect(() => {
    if (mapRef.current && i18n.language) {
      setMapLanguage(mapRef.current, i18n.language);
    }
  }, [i18n.language]);

  const handleMapLoad = useCallback(e => {
    const map = e.target;
    mapRef.current = map;
    map.setMinZoom(MIN_WORLD_ZOOM);
    setMapLanguage(map, i18n.language);

    try {
      if (initialCameraCoords) {
        map.flyTo({
          center: initialCameraCoords,
          zoom: isMobileRef.current ? 2.2 : 2.8,
          duration: 1000,
        });
      } else {
        fitWorld(map);
      }
    } catch (error) {
      console.error('fitBounds failed:', error);
    }
  }, [fitWorld, i18n.language, initialCameraCoords]);

  const handleMapResize = useCallback(e => {
    try {
      fitWorld(e.target);
    } catch (error) {
      console.error('fitBounds on resize failed:', error);
    }
  }, [fitWorld]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !mapContainerRef.current) return undefined;

    const observer = new ResizeObserver(() => {
      if (!isIntersectingRef.current || isModalOccluded) return;
      const map = mapRef.current;
      if (!map) return;

      map.resize();
      fitWorld(map);
    });

    observer.observe(mapContainerRef.current);

    return () => observer.disconnect();
  }, [fitWorld, isModalOccluded]);

  const listaPaises = useMemo(() => (paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST']), [paisesVisitados]);

  return (
    <div
      ref={mapContainerRef}
      className={cn(
        "w-full min-w-0 h-full min-h-0 relative bg-[#e0e6ed] rounded-2xl overflow-hidden",
        isScrolling && "pointer-events-none"
      )}
    >
      {isWebGLDisabled ? (
        <OperationalMapFallback message={mapShieldMessage} borderRadius="1.5rem" />
      ) : (
        <Map
          className="w-full min-w-0 h-full min-h-0"
          initialViewState={{ longitude: 0, latitude: 15, zoom: 1.5 }}
          mapStyle={BLANK_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="mercator"
          reuseMaps
          preventStyleDiffing={true}
          interactive={true}
          renderWorldCopies={false}
          minZoom={MIN_WORLD_ZOOM}
          maxZoom={4}
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
          onResize={handleMapResize}
          onMouseMove={onHover}
          interactiveLayerIds={['country-fills']}
          attributionControl={false}
        >
          <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
            {/* Base blanca para masas continentales (oculta océano de los bounds de cada país) */}
            <Layer
              id="country-base"
              type="fill"
              source-layer="country_boundaries"
              paint={{ 'fill-color': '#ffffff', 'fill-opacity': 1 }}
            />
            <Layer
              id="country-fills"
              type="fill"
              source-layer="country_boundaries"
              paint={{
                'fill-color': [
                  'case',
                  ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', listaPaises]],
                  COLORS.atomicTangerine,
                  ['==', ['get', 'iso_3166_1_alpha_3'], residenceIso3 || ''],
                  COLORS.mutedTeal,
                  ['==', ['get', 'iso_3166_1_alpha_3'], birthIso3 || ''],
                  COLORS.charcoalBlue,
                  COLORS.atomicTangerine,
                ],
                // Conquistado: 0.8, Base/Raíces no conquistados: 0.45, otros: 0
                'fill-opacity': [
                  'case',
                  ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', listaPaises]],
                  0.8,
                  ['==', ['get', 'iso_3166_1_alpha_3'], residenceIso3 || ''],
                  0.45,
                  ['==', ['get', 'iso_3166_1_alpha_3'], birthIso3 || ''],
                  0.45,
                  0,
                ],
              }}
            />
            <Layer
              id="borders"
              type="line"
              source-layer="country_boundaries"
              paint={{ 'line-color': '#cbd5e1', 'line-width': 0.5, 'line-opacity': 0.6 }}
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
                {hoverInfo.feature.properties[`name_${i18n.language}`] || hoverInfo.feature.properties.name_en || t('countryFallback')}
              </div>
            </Popup>
          )}
        </Map>
      )}
    </div>
  );
};

export default memo(HomeMap);
