import React, { useRef, useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS } from '@shared/config';
import {
  isMapStyleLoaded,
  setMapLanguage,
  createPinElement,
  resolveIdentityPins,
} from '@shared/lib/geo';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { OperationalMapFallback } from '@shared/ui/components';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryISO3, getCountryCentroid } from '@shared/lib/utils/countryUtils';
import { Plus, MapPin } from 'lucide-react';


import TripRoster from './components/TripRoster';
import MapEmptyState from './components/MapEmptyState';
import { createSpinGlobe } from './components/SpinGlobe';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * MapaView — "Command Center" Map Page
 *
 * Architecture:
 *   Full-bleed Mapbox globe (100% viewport) with glassmorphic overlay layer.
 *   Three states:
 *     1. Empty (0 trips): SpinGlobe + MapEmptyState CTA
 *     2. Roster (N trips): TripRoster drawer
 *     3. Trip Selected: Cinematic flyTo + highlighted roster item
 *
 * Performance:
 *   - 100dvh no-scroll rule enforced (parent scaffold handles this)
 *   - SpinGlobe cleaned up on unmount and on trip arrival
 *   - Internal roster scroll via overflow-y: auto
 */
function MapaView({ paises = [], paradas = [], trips = [], tripData = {} }) {
  const { i18n, t } = useTranslation(['dashboard', 'nav']);
  const navigate = useNavigate();
  useDocumentTitle(t('nav:pageTitle.worldMap'));
  const mapRef = useRef(null);
  // Raw Mapbox instance (react-map-gl's ref intentionally omits style mutators
  // such as setPaintProperty, so imperative work always targets the real map).
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const spinGlobeRef = useRef(null);
  const identityMarkersRef = useRef([]);
  const cameraTargetRef = useRef(null);
  const { userProfile } = useAuth() || {};

  // Granular identity slices: they change only when the geographic identity changes,
  // so the reactive map effect never re-runs on unrelated profile edits (e.g. avatar).
  const profileBirthCountry = userProfile?.birthCountry || null;
  const profileResidenceCountry = userProfile?.residenceCountry || null;
  const profileBirthCity = userProfile?.birthCity || null;
  const profileBaseCity = userProfile?.baseCity || null;

  const birthIso3 = profileBirthCountry ? getCountryISO3(profileBirthCountry) : null;
  const residenceIso3 = profileResidenceCountry ? getCountryISO3(profileResidenceCountry) : null;
  const hasGeoIdentity = Boolean(
    profileBirthCountry || profileResidenceCountry || profileBirthCity || profileBaseCity
  );

  // Initial camera focus on roots/base if no trip selected
  const initialBaseCoords = useMemo(() => {
    if (profileBaseCity?.coordinates) {
      return profileBaseCity.coordinates;
    }
    if (profileBirthCity?.coordinates) {
      return profileBirthCity.coordinates;
    }
    if (profileResidenceCountry) {
      const c = getCountryCentroid(profileResidenceCountry);
      if (c) return c;
    }
    if (profileBirthCountry) {
      const c = getCountryCentroid(profileBirthCountry);
      if (c) return c;
    }
    return null;
  }, [profileBaseCity, profileBirthCity, profileResidenceCountry, profileBirthCountry]);

  const {
    flags: { level: operationalLevel },
  } = useOperationalFlags();
  const isWebGLDisabled = operationalLevel >= 2;
  const mapShieldMessage = t(
    'map.shieldOverlay',
    'Interactive maps are resting. Your journey data remains safe.'
  );

  const [viewState, setViewState] = useState(() => ({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
  }));

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const stops = useMemo(() => (Array.isArray(paradas) ? paradas : []), [paradas]);

  const isEmptyMap = paises.length === 0;

  const coordinateHash = useMemo(
    () => stops.map((stop) => `${stop.id}-${stop.coordenadas?.[0]}-${stop.coordenadas?.[1]}`).join('|'),
    [stops]
  );

  const { stopsGeoJson } = useMemo(() => {
    const seenCoordinates = new Set();
    const uniqueStops = stops.filter((stop) => {
      if (!stop.coordenadas) return false;
      const key = `${stop.coordenadas[0]},${stop.coordenadas[1]}`;
      if (seenCoordinates.has(key)) return false;
      seenCoordinates.add(key);
      return true;
    });

    const nextGeoJson = {
      type: 'FeatureCollection',
      metadata: { coordinateHash },
      features: uniqueStops.map((stop) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: stop.coordenadas },
        properties: { id: stop.id, name: stop.nombre, tripId: stop.tripId || stop.viajeId },
      })),
    };

    return { stopsGeoJson: nextGeoJson };
  }, [coordinateHash, stops]);

  const listaPaises = useMemo(() => (paises.length > 0 ? paises : ['EMPTY']), [paises]);

  // ── SpinGlobe lifecycle ──────────────────────────────────────────────
  const initSpinGlobe = useCallback((map) => {
    // Only spin on empty state with globe projection (desktop)
    if (!isEmptyMap || (typeof window !== 'undefined' && window.innerWidth < 768)) return;
    if (spinGlobeRef.current) spinGlobeRef.current.destroy();

    spinGlobeRef.current = createSpinGlobe(map, {
      secondsPerRevolution: 120,
      maxSpinZoom: 5,
    });
    spinGlobeRef.current.start();
  }, [isEmptyMap]);

  // Cleanup SpinGlobe when trips arrive or on unmount
  useEffect(() => {
    if (!isEmptyMap && spinGlobeRef.current) {
      spinGlobeRef.current.destroy();
      spinGlobeRef.current = null;
    }
    return () => {
      if (spinGlobeRef.current) {
        spinGlobeRef.current.destroy();
        spinGlobeRef.current = null;
      }
    };
  }, [isEmptyMap]);

  // Pause SpinGlobe when modal overlays are mounted (?editing= or ?new)
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
    };

    window.addEventListener('popstate', checkModalOcclusion);
    const interval = setInterval(checkModalOcclusion, 500);

    return () => {
      window.removeEventListener('popstate', checkModalOcclusion);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (spinGlobeRef.current) {
      spinGlobeRef.current.setOccluded(isModalOccluded);
    }
  }, [isModalOccluded]);

  // ── Reactive Geographic Identity (country fills + city pins + camera) ─
  // Priority: Conquered (#FF6B35) > Residence (#45B0A8) > Origin (#2C3E50).
  const countryFillPaint = useMemo(() => ({
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
    'fill-opacity': [
      'case',
      ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', listaPaises]],
      0.65,
      ['==', ['get', 'iso_3166_1_alpha_3'], residenceIso3 || ''],
      0.45,
      ['==', ['get', 'iso_3166_1_alpha_3'], birthIso3 || ''],
      0.45,
      0,
    ],
  }), [listaPaises, residenceIso3, birthIso3]);

  useEffect(() => {
    const map = mapInstanceRef.current;
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
        `${t('dashboard:map.originAndResidencePin', 'Origen y residencia')}: ${unified.name}`
      );
    } else {
      if (birth) {
        addIdentityMarker(
          'origin',
          birth,
          `${t('dashboard:map.birthCityPin', 'Ciudad natal')}: ${birth.name}`
        );
      }
      if (base) {
        addIdentityMarker(
          'residence',
          base,
          `${t('dashboard:map.baseCityPin', 'Ciudad base')}: ${base.name}`
        );
      }
    }

    // C. Smooth camera update if no trip is currently focused.
    // Guarded by the last camera target so re-runs (or user panning) never fight the camera.
    const focusCoords =
      base?.coordinates || birth?.coordinates || unified?.coordinates || initialBaseCoords;
    const focusSignature = focusCoords ? `${focusCoords[0]},${focusCoords[1]}` : null;

    if (!selectedTrip && focusCoords && cameraTargetRef.current !== focusSignature) {
      cameraTargetRef.current = focusSignature;
      map.flyTo({
        center: focusCoords,
        zoom: 3.5,
        speed: 1.2,
        essential: true,
      });
    }
  }, [
    initialBaseCoords,
    mapLoaded,
    profileBaseCity,
    profileBirthCity,
    selectedTrip,
    t,
  ]);

  // Release imperative identity markers when leaving the map page
  useEffect(() => () => {
    identityMarkersRef.current.forEach((marker) => marker.remove());
    identityMarkersRef.current = [];
    mapInstanceRef.current = null;
  }, []);

  // ── Map event handlers ───────────────────────────────────────────────
  const onMapLoad = useCallback((e) => {
    const map = e.target;
    mapInstanceRef.current = map;
    setMapLanguage(map, i18n.language);
    setMapLoaded(true);

    // The reactive identity effect owns the camera whenever an identity exists;
    // the spinning globe only runs on a truly empty archive.
    if (!initialBaseCoords || !isEmptyMap) {
      initSpinGlobe(map);
    }
  }, [i18n.language, initialBaseCoords, isEmptyMap, initSpinGlobe]);

  useEffect(() => {
    if (!mapRef.current || !isMapStyleLoaded(mapRef.current)) return;
    setMapLanguage(mapRef.current, i18n.language);
  }, [i18n.language]);

  // Mapbox WebGL resize synchronization on parent container dimension shifts
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !mapContainerRef.current) return undefined;

    let rafId = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    });

    observer.observe(mapContainerRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Click on map marker → select trip
  const onMapClick = useCallback((event) => {
    const feature = event.features && event.features[0];
    if (feature && feature.layer.id === 'unclustered-point') {
      const tripId = feature.properties.tripId || feature.properties.id;
      const trip = trips.find((t) => t.id === tripId);

      if (trip) {
        setSelectedTrip(trip);
        mapRef.current?.flyTo({
          center: feature.geometry.coordinates,
          zoom: 5.5,
          pitch: 45,
          bearing: -17.6,
          duration: 2400,
          essential: true,
          curve: 1.42,
        });
        // Settle camera after arc
        setTimeout(() => {
          mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 1200 });
        }, 2800);
      }
    }
  }, [trips]);

  // Trip roster selection → cinematic flyTo
  const handleTripSelect = useCallback((trip) => {
    setSelectedTrip(trip);

    // Find the first parada belonging to this trip
    const tripParada = stops.find(
      (p) => (p.tripId || p.viajeId) === trip.id
    );

    if (tripParada && tripParada.coordenadas) {
      mapRef.current?.flyTo({
        center: tripParada.coordenadas,
        zoom: 5.5,
        pitch: 45,
        bearing: -17.6,
        duration: 2400,
        essential: true,
        curve: 1.42,
      });
      // Settle camera
      setTimeout(() => {
        mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 1200 });
      }, 2800);
    } else {
      // Fallback: try trip-level coordinates
      const lat = trip.lat || trip.latitud;
      const lng = trip.lng || trip.longitud;
      if (lat && lng) {
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 5,
          duration: 1800,
          essential: true,
        });
      }
    }
  }, [stops]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div ref={mapContainerRef} className="w-full h-[100dvh] md:h-full rounded-3xl overflow-hidden bg-[#e0f2fe] relative">
      {isWebGLDisabled ? (
        <OperationalMapFallback message={mapShieldMessage} borderRadius="var(--radius-xl)" />
      ) : (
        /* Full-bleed Mapbox */
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={onMapClick}
          interactiveLayerIds={['unclustered-point']}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          projection={(typeof window !== 'undefined' && window.innerWidth < 768) ? 'mercator' : 'globe'}
          minZoom={1}
          maxZoom={20}
          doubleClickZoom={true}
          scrollZoom={true}
          dragPan={true}
          onLoad={onMapLoad}
          reuseMaps
          attributionControl={false}
        >
          {/* Atmosphere */}
          <Layer
            id="sky"
            type="sky"
            paint={{
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 5,
            }}
          />

          {/* Visited countries fill */}
          <Source id="world" type="vector" url="mapbox://mapbox.country-boundaries-v1">
            <Layer
              id="country-fills"
              type="fill"
              source-layer="country_boundaries"
              paint={countryFillPaint}
            />
          </Source>

          {/* Trip stop markers with clustering */}
          <Source
            id="paradas"
            type="geojson"
            data={stopsGeoJson}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer
              id="clusters"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': COLORS.charcoalBlue,
                'circle-radius': ['step', ['get', 'point_count'], 15, 5, 20, 10, 30],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
              }}
            />
            <Layer
              id="cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12,
              }}
              paint={{ 'text-color': '#ffffff' }}
            />
            <Layer
              id="unclustered-point"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-color': COLORS.atomicTangerine,
                'circle-radius': 7,
                'circle-stroke-width': 2.5,
                'circle-stroke-color': 'white',
              }}
            />
          </Source>

          <FullscreenControl position="top-right" />
          <NavigationControl position="top-right" />
        </Map>
      )}

      {/* ── OVERLAY LAYER ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {isEmptyMap ? (
          hasGeoIdentity ? (
            /* Floating banner when user has origin/residence configured but 0 trips yet */
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(calc(100vw-32px),520px)] bg-[#2C3E50] text-white rounded-2xl md:rounded-full p-3 md:p-2 md:pl-5 shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pointer-events-auto">
              <div className="flex items-center gap-2 min-w-0 px-1 sm:px-0">
                <MapPin size={16} className="text-[#45B0A8] shrink-0" />
                <span className="text-xs md:text-sm font-semibold font-sans leading-snug">
                  {t('dashboard:map.geoIdentityMarked', 'Tu ubicación ya está marcada en el mapa.')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard?new=true')}
                className="bg-[#FF6B35] hover:bg-[#e85d2a] text-white text-xs font-bold px-4 rounded-full shrink-0 flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm transition-all cursor-pointer font-heading"
              >
                <Plus size={14} />
                <span>{t('dashboard:map.createFirstTrip', 'Crear primer viaje')}</span>
              </button>
            </div>
          ) : (
            /* STATE: Empty without identity — spinning globe + editorial CTA */
            <MapEmptyState />
          )
        ) : (
          /* STATE: Active — trip roster + FABs */
          <>
            <TripRoster
              trips={trips}
              paises={paises}
              tripData={tripData}
              isMobile={typeof window !== 'undefined' && window.innerWidth < 768}
              activeTrip={selectedTrip}
              onTripSelect={handleTripSelect}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(MapaView);

