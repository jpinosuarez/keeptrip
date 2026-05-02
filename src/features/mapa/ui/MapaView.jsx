import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLORS } from '@shared/config';
import { isMapStyleLoaded, setMapLanguage } from '@shared/lib/geo';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { OperationalMapFallback } from '@shared/ui/components';
import { cn } from '@shared/lib/utils/cn';

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
  const { i18n, t } = useTranslation('dashboard');
  useDocumentTitle(t('map', 'Mapa 3D'));
  const mapRef = useRef(null);
  const spinGlobeRef = useRef(null);
  
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

  const listaPaises = paises.length > 0 ? paises : ['EMPTY'];

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

  // ── Map event handlers ───────────────────────────────────────────────
  const onMapLoad = useCallback((e) => {
    const map = e.target;
    setMapLanguage(map, i18n.language);
    initSpinGlobe(map);
  }, [i18n.language, initSpinGlobe]);

  useEffect(() => {
    if (!mapRef.current || !isMapStyleLoaded(mapRef.current)) return;
    setMapLanguage(mapRef.current, i18n.language);
  }, [i18n.language]);

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
    <div className="w-full h-[100dvh] md:h-full rounded-3xl overflow-hidden bg-[#e0f2fe] relative">
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
              paint={{
                'fill-color': COLORS.atomicTangerine,
                'fill-opacity': ['match', ['get', 'iso_3166_1_alpha_3'], listaPaises, 0.6, 0],
              }}
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
          /* STATE: Empty — spinning globe + editorial CTA */
          <MapEmptyState />
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

export default MapaView;

