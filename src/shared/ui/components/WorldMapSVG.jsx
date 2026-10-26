import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as d3geo from 'd3-geo';
import * as topojson from 'topojson-client';
import { cn } from '@shared/lib/utils/cn';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryCentroid, getCountryName } from '@shared/lib/utils/countryUtils';

// Real-world TopoJSON from jsDelivr CDN (Natural Earth 110m — CC0 public domain)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO numeric IDs of visited countries
const VISITED_IDS = new Set(['764', '250', '032', '380', '392', '724']);

// Named pins in [longitude, latitude]
const PINS = [
  { name: 'Bangkok', coords: [100.5, 13.75] },
  { name: 'Paris', coords: [2.35, 48.86] },
  { name: 'Patagonia', coords: [-68.5, -51.0] },
  { name: 'Tokyo', coords: [139.7, 35.69] },
  { name: 'Rome', coords: [12.5, 41.9] },
];

// Route arcs [[from_lng,from_lat],[to_lng,to_lat]]
const ROUTES = [
  { from: [2.35, 48.86], to: [100.5, 13.75] },
  { from: [100.5, 13.75], to: [139.7, 35.69] },
  { from: [2.35, 48.86], to: [-68.5, -51.0] },
];

export const WorldMapSVG = ({ color = '#FF6B35', userProfile: propProfile = null }) => {
  const { t } = useTranslation();
  const auth = useAuth() || {};
  const profile = propProfile || auth.userProfile || null;
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });
  const [geoData, setGeoData] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [pinsReady, setPinsReady] = useState(false);

  // Measure container
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: Math.round(width), h: Math.round(height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fetch TopoJSON
  useEffect(() => {
    fetch(GEO_URL)
      .then((response) => response.json())
      .then((world) => setGeoData(world))
      .catch(() => {}); // silently fail — map just won't show
  }, []);

  const { w, h } = dims;

  // Build a Mercator projection that fills the SVG
  const projection = useMemo(() => {
    return d3geo
      .geoMercator()
      .scale((w / 2 / Math.PI) * 1.05)
      .translate([w / 2, h * 0.55])
      .center([10, 12]);
  }, [w, h]);

  const pathGen = useMemo(() => {
    return d3geo.geoPath().projection(projection);
  }, [projection]);

  // Convert geo coords → SVG px. Returns null if outside viewport.
  const project = useCallback((coords) => {
    return projection(coords) ?? null;
  }, [projection]);

  // Build arc path between two points
  const buildArc = useCallback((from, to) => {
    const line = { type: 'LineString', coordinates: [from, to] };
    return pathGen(line);
  }, [pathGen]);

  const countries = useMemo(() => {
    if (!geoData) return null;
    return topojson.feature(geoData, geoData.objects.countries);
  }, [geoData]);

  const birthName = useMemo(() => {
    return profile?.birthCountry ? getCountryName(profile.birthCountry) : null;
  }, [profile?.birthCountry]);

  const residenceName = useMemo(() => {
    return profile?.residenceCountry ? getCountryName(profile.residenceCountry) : null;
  }, [profile?.residenceCountry]);

  const countryPaths = useMemo(() => {
    if (!countries) return [];
    return countries.features.map((feature, idx) => {
      const isVisited = VISITED_IDS.has(String(feature.id));
      const cName = feature.properties?.name || '';
      const isResidence = !isVisited && Boolean(residenceName && cName.toLowerCase() === residenceName.toLowerCase());
      const isBirth = !isVisited && !isResidence && Boolean(birthName && cName.toLowerCase() === birthName.toLowerCase());

      return {
        id: String(feature.id ?? `geo-${idx}`),
        d: pathGen(feature),
        isVisited,
        isResidence,
        isBirth,
        name: cName || 'Saved destination',
      };
    });
  }, [countries, pathGen, residenceName, birthName]);

  const arcPaths = useMemo(() => {
    return ROUTES.map((route, index) => {
      const path = buildArc(route.from, route.to);
      return path ? { path, index } : null;
    }).filter(Boolean);
  }, [buildArc]);

  const projectedPins = useMemo(() => {
    return PINS.map((pin, index) => {
      const pt = project(pin.coords);
      return pt ? { ...pin, px: pt[0], py: pt[1], index } : null;
    }).filter(Boolean);
  }, [project]);

  const activeCountry = useMemo(() => {
    if (!hoveredCountry || !countryPaths.length) return null;
    return countryPaths.find((c) => c.id === hoveredCountry) || null;
  }, [hoveredCountry, countryPaths]);

  useEffect(() => {
    if (geoData) {
      // small delay so pins animate in after countries
      const timer = setTimeout(() => setPinsReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [geoData]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="block"
        aria-label="Interactive world map with visited destinations"
      >
        {/* Ocean background */}
        <rect width={w} height={h} fill="#EFF6FF" className="rounded-xl" rx="12" />

        {countryPaths.length > 0 && (
          <g>
            {/* Country fills */}
            {countryPaths.map((country) => {
              const { id, d, isVisited, isResidence, isBirth } = country;
              const isHovered = hoveredCountry === id;
              const pathFill = isVisited ? color : (isResidence ? '#45B0A8' : (isBirth ? '#2C3E50' : '#CBD5E1'));
              const pathOpacity = isVisited ? (isHovered ? 0.85 : 0.6) : ((isResidence || isBirth) ? 0.55 : 0.75);
              const isInteractive = isVisited || isResidence || isBirth;

              return (
                <path
                  key={id}
                  d={d}
                  fill={pathFill}
                  fillOpacity={pathOpacity}
                  stroke="#fff"
                  strokeWidth={0.4}
                  className={cn(
                    "transition-all duration-300",
                    isInteractive ? "cursor-pointer" : "cursor-default"
                  )}
                  style={{
                    filter: isHovered && isInteractive ? `drop-shadow(0 0 4px ${pathFill}40)` : 'none'
                  }}
                  onMouseEnter={() => isInteractive && setHoveredCountry(id)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })}

            {/* Flight arc routes */}
            {arcPaths.map(({ path, index }) => (
              <Motion.path
                key={index}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={1.2}
                strokeOpacity={0.55}
                strokeDasharray="5 4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.5, duration: 1.4, ease: 'easeInOut' }}
              />
            ))}

            {/* Destination Pins (Lens Markers) */}
            <AnimatePresence>
              {pinsReady && projectedPins.map((pin) => {
                const { name, px, py, index } = pin;
                return (
                  <Motion.g
                    key={name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer pointer-events-auto"
                  >
                    {/* Invisible touch target (44x44) */}
                    <circle cx={px} cy={py} r={22} fill="transparent" />

                    {/* Pulse ring */}
                    <Motion.circle
                      cx={px}
                      cy={py}
                      r={9}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4, ease: 'easeOut' }}
                      style={{ transformOrigin: `${px}px ${py}px` }}
                    />

                    {/* Lens Base (Shadow) */}
                    <circle cx={px} cy={py} r={6} fill="white" className="drop-shadow-sm" />

                    {/* Pin dot */}
                    <Motion.circle
                      cx={px}
                      cy={py}
                      r={4.5}
                      fill={color}
                      stroke="white"
                      strokeWidth={1.5}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.18, type: 'spring', damping: 12, stiffness: 240 }}
                      style={{ transformOrigin: `${px}px ${py}px` }}
                    />

                    {/* Label Pill */}
                    <foreignObject x={px - 35} y={py - 32} width={70} height={20} className="pointer-events-none">
                      <Motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.18 }}
                        className={cn(
                          "flex justify-center items-center bg-white/95",
                          "border border-slate-200/80 rounded-full h-[18px] shadow-sm"
                        )}
                      >
                        <span className="text-[8px] font-extrabold text-slate-800 font-jakarta">
                          {name.toUpperCase()}
                        </span>
                      </Motion.div>
                    </foreignObject>
                  </Motion.g>
                );
              })}
            </AnimatePresence>
          </g>
        )}

        {/* Loading shimmer if no data yet */}
        {!geoData && (
          <rect width={w} height={h} fill="#E2E8F0" rx="12">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>

      {/* Static Context Overlay (Fixed Card) */}
      <AnimatePresence>
        {activeCountry && (
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              "absolute bottom-4 left-4 bg-white/95",
              "border border-slate-200 rounded-2xl p-3 px-5 shadow-lg z-10",
              "pointer-events-none flex flex-col gap-0.5"
            )}
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>
              {t('common.visitedDestination', 'Visited Destination')}
            </span>
            <span className="text-[18px] font-extrabold text-slate-800 font-jakarta">
              {activeCountry.name}
            </span>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(WorldMapSVG);