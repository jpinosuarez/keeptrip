import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as d3geo from 'd3-geo';
import * as topojson from 'topojson-client';
import { cn } from '@shared/lib/utils/cn';

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

export const WorldMapSVG = ({ color = '#FF6B35' }) => {
  const { t } = useTranslation();
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
  const projection = d3geo
    .geoMercator()
    .scale((w / 2 / Math.PI) * 1.05)
    .translate([w / 2, h * 0.55])
    .center([10, 12]);

  const pathGen = d3geo.geoPath().projection(projection);

  // Convert geo coords → SVG px. Returns null if outside viewport.
  const project = (coords) => {
    const point = projection(coords);
    return point ?? null;
  };

  // Build arc path between two points
  const buildArc = (from, to) => {
    const line = { type: 'LineString', coordinates: [from, to] };
    return pathGen(line);
  };

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

        {geoData && (() => {
          const countries = topojson.feature(geoData, geoData.objects.countries);
          return (
            <g>
              {/* Country fills */}
              {countries.features.map((feature, idx) => {
                const id = String(feature.id ?? `geo-${idx}`);
                const isVisited = VISITED_IDS.has(String(feature.id));
                const isHovered = hoveredCountry === id;
                return (
                  <path
                    key={id}
                    d={pathGen(feature)}
                    fill={isVisited ? color : '#CBD5E1'}
                    fillOpacity={isVisited ? (isHovered ? 0.8 : 0.5) : 0.75}
                    stroke="#fff"
                    strokeWidth={0.4}
                    className={cn(
                      "transition-all duration-300",
                      isVisited ? "cursor-pointer" : "cursor-default"
                    )}
                    style={{
                      filter: isVisited && isHovered ? `drop-shadow(0 0 4px ${color}40)` : 'none'
                    }}
                    onMouseEnter={() => isVisited && setHoveredCountry(id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                );
              })}

              {/* Flight arc routes */}
              {ROUTES.map((route, index) => {
                const path = buildArc(route.from, route.to);
                return path ? (
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
                ) : null;
              })}

              {/* Destination Pins (Lens Markers) */}
              <AnimatePresence>
                {pinsReady && PINS.map((pin, index) => {
                  const point = project(pin.coords);
                  if (!point) return null;
                  const [px, py] = point;
                  return (
                    <Motion.g
                      key={pin.name}
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

                      {/* Glassmorphic Label Pill */}
                      <foreignObject x={px - 35} y={py - 32} width={70} height={20} className="pointer-events-none">
                        <Motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.18 }}
                          className={cn(
                            "flex justify-center items-center bg-white/70 backdrop-blur-md",
                            "border border-white/40 rounded-full h-[18px] shadow-sm"
                          )}
                        >
                          <span className="text-[8px] font-extrabold text-slate-800 font-jakarta">
                            {pin.name.toUpperCase()}
                          </span>
                        </Motion.div>
                      </foreignObject>
                    </Motion.g>
                  );
                })}
              </AnimatePresence>
            </g>
          );
        })()}

        {/* Loading shimmer if no data yet */}
        {!geoData && (
          <rect width={w} height={h} fill="#E2E8F0" rx="12">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>

      {/* Static Context Overlay (Fixed Glassmorphic Card) */}
      <AnimatePresence>
        {hoveredCountry && geoData && (() => {
          const countryFeature = topojson
            .feature(geoData, geoData.objects.countries)
            .features.find((feature) => String(feature.id) === hoveredCountry);

          const countryName = countryFeature?.properties?.name || 'Saved destination';

          return (
            <Motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={cn(
                "absolute bottom-4 left-4 bg-white/85 backdrop-blur-xl",
                "border border-white/50 rounded-2xl p-3 px-5 shadow-lg z-10",
                "pointer-events-none flex flex-col gap-0.5"
              )}
            >
              <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>
                {t('common.visitedDestination', 'Visited Destination')}
              </span>
              <span className="text-[18px] font-extrabold text-slate-800 font-jakarta">
                {countryName}
              </span>
            </Motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default WorldMapSVG;