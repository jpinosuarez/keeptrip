import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS } from '@shared/config';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { setMapLanguage, createPinElement, resolveIdentityPins } from '@shared/lib/geo';
import { OperationalMapFallback } from '@shared/ui/components';
import { cn } from '@shared/lib/utils/cn';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryISO3 } from '@shared/lib/utils/countryUtils';
import { resolveConquestColor, CONQUEST_COLOR_UNLOCK_XP } from '@shared/lib/utils/conquestTheme';

// Fixed flat Mercator world view (Block 2.1): the Home map is a stable 2D
// archive canvas — no flyTo, no fitBounds, no globe spin, no camera shifts.
const HOME_INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0.95,
  pitch: 0,
  bearing: 0,
};

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

const HomeMap = ({ paisesVisitados = [], userProfile: propProfile = null }) => {
  const { i18n, t } = useTranslation('dashboard');
  const auth = useAuth() || {};
  const profile = propProfile || auth.userProfile || null;

  // Granular identity slices: stable primitives/objects so the reactive map effect
  // only re-runs when the geographic identity actually changes.
  const profileBirthCountry = profile?.birthCountry || null;
  const profileResidenceCountry = profile?.residenceCountry || null;
  const profileBirthCity = profile?.birthCity || null;
  const profileBaseCity = profile?.baseCity || null;

  const birthIso3 = profileBirthCountry ? getCountryISO3(profileBirthCountry) : null;
  const residenceIso3 = profileResidenceCountry ? getCountryISO3(profileResidenceCountry) : null;

  // Level 3 conquest colour: validates the stored theme (falls back to Atomic
  // Tangerine when missing/invalid). Declarative paint only — never setPaintProperty.
  const activeConquestColor = useMemo(
    () => resolveConquestColor(profile, CONQUEST_COLOR_UNLOCK_XP),
    [profile],
  );

  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isWebGLDisabled = operationalLevel >= 2;
  const mapShieldMessage = t(
    'map.shieldOverlay',
    'Interactive maps are resting. Your journey data remains safe.'
  );
  const [hoverInfo, setHoverInfo] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const identityMarkersRef = useRef([]);
  const mapContainerRef = useRef(null);
  const isIntersectingRef = useRef(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);

  // Camera: none. The Home map is a fixed flat Mercator world view (Block 2.1).

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
    setMapLoaded(true);
  }, [i18n.language]);

  const listaPaises = useMemo(() => (paisesVisitados.length > 0 ? paisesVisitados : ['EMPTY_LIST']), [paisesVisitados]);

  // ── Reactive Geographic Identity (country fills + city pins) ─────────
  // Priority: Conquered (#FF6B35) > Residence (#45B0A8) > Origin (#2C3E50).
  // Camera is intentionally fixed (flat Mercator world view).
  const countryFillPaint = useMemo(() => ({
    'fill-color': [
      'case',
      ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', listaPaises]],
      activeConquestColor,
      ['==', ['get', 'iso_3166_1_alpha_3'], residenceIso3 || ''],
      COLORS.mutedTeal,
      ['==', ['get', 'iso_3166_1_alpha_3'], birthIso3 || ''],
      COLORS.charcoalBlue,
      COLORS.atomicTangerine,
    ],
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
  }), [listaPaises, residenceIso3, birthIso3, activeConquestColor]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // A. Clean up previous identity markers (never accumulate stale pins)
    identityMarkersRef.current.forEach((marker) => marker.remove());
    identityMarkersRef.current = [];

    // B. Render special city pins
    const { unified, birth, base } = resolveIdentityPins({
      birthCity: profileBirthCity,
      baseCity: profileBaseCity,
    });

    const addIdentityMarker = (kind, pin, label) => {
      const marker = new mapboxgl.Marker({ element: createPinElement(kind, label) })
        .setLngLat(pin.coordinates)
        .addTo(map);
      identityMarkersRef.current.push(marker);
    };

    if (unified) {
      addIdentityMarker(
        'unified',
        unified,
        `${t('map.originAndResidencePin', 'Origen y residencia')}: ${unified.name}`
      );
    } else {
      if (birth) {
        addIdentityMarker('origin', birth, `${t('map.birthCityPin', 'Ciudad natal')}: ${birth.name}`);
      }
      if (base) {
        addIdentityMarker('residence', base, `${t('map.baseCityPin', 'Ciudad base')}: ${base.name}`);
      }
    }
  }, [mapLoaded, profileBaseCity, profileBirthCity, t]);

  // Release imperative identity markers on unmount (avoid leaked WebGL markers)
  useEffect(() => () => {
    identityMarkersRef.current.forEach((marker) => marker.remove());
    identityMarkersRef.current = [];
  }, []);

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
          initialViewState={HOME_INITIAL_VIEW_STATE}
          mapStyle={BLANK_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="mercator"
          reuseMaps
          preventStyleDiffing={true}
          interactive={true}
          renderWorldCopies={false}
          minZoom={MIN_WORLD_ZOOM}
          maxZoom={4}
          maxPitch={0}
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
              paint={countryFillPaint}
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
