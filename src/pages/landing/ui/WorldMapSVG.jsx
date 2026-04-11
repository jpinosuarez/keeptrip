import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import * as d3geo from 'd3-geo';
import * as topojson from 'topojson-client';

// Real-world TopoJSON from jsDelivr CDN (Natural Earth 110m — CC0 public domain)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO numeric IDs of visited countries
const VISITED_IDS = new Set(['764', '250', '032', '380', '392', '724']);

// Named pins in [longitude, latitude]
const PINS = [
  { name: 'Bangkok', coords: [100.5, 13.75] },
  { name: 'París', coords: [2.35, 48.86] },
  { name: 'Patagonia', coords: [-68.5, -51.0] },
  { name: 'Tokio', coords: [139.7, 35.69] },
  { name: 'Roma', coords: [12.5, 41.9] },
];

// Route arcs [[from_lng,from_lat],[to_lng,to_lat]]
const ROUTES = [
  { from: [2.35, 48.86], to: [100.5, 13.75] },
  { from: [100.5, 13.75], to: [139.7, 35.69] },
  { from: [2.35, 48.86], to: [-68.5, -51.0] },
];

export const WorldMapSVG = ({ color = '#FF6B35' }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });
  const [geoData, setGeoData] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [pinsReady, setPinsReady] = useState(false);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: Math.round(width), h: Math.round(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fetch TopoJSON
  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((world) => setGeoData(world))
      .catch(() => { }); // silently fail — map just won't show
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
    const pt = projection(coords);
    return pt ?? null;
  };

  // Build arc path between two points
  const buildArc = (from, to) => {
    const line = { type: 'LineString', coordinates: [from, to] };
    return pathGen(line);
  };

  useEffect(() => {
    if (geoData) {
      // small delay so pins animate in after countries
      const t = setTimeout(() => setPinsReady(true), 600);
      return () => clearTimeout(t);
    }
  }, [geoData]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block' }}
        aria-label="Mapa mundial interactivo con destinos visitados"
      >
        {/* Ocean background */}
        <rect width={w} height={h} fill="#EFF6FF" rx="12" />

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
                    style={{ 
                      cursor: isVisited ? 'pointer' : 'default', 
                      transition: 'fill-opacity 0.3s ease',
                      filter: isVisited && isHovered ? `drop-shadow(0 0 4px ${color}40)` : 'none'
                    }}
                    onMouseEnter={() => isVisited && setHoveredCountry(id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                );
              })}

              {/* Flight arc routes */}
              {ROUTES.map((route, i) => {
                const d = buildArc(route.from, route.to);
                return d ? (
                  <Motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.2}
                    strokeOpacity={0.55}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.5, duration: 1.4, ease: 'easeInOut' }}
                  />
                ) : null;
              })}

              {/* Destination Pins (Lens Markers) */}
              <AnimatePresence>
                {pinsReady && PINS.map((pin, i) => {
                  const pt = project(pin.coords);
                  if (!pt) return null;
                  const [px, py] = pt;
                  return (
                    <Motion.g 
                      key={pin.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    >
                      {/* Invisible touch target (44x44) */}
                      <circle cx={px} cy={py} r={22} fill="transparent" />
                      
                      {/* Pulse ring */}
                      <Motion.circle
                        cx={px} cy={py} r={9}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                        style={{ transformOrigin: `${px}px ${py}px` }}
                      />
                      
                      {/* Lens Base (Shadow) */}
                      <circle cx={px} cy={py} r={6} fill="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                      
                      {/* Pin dot */}
                      <Motion.circle
                        cx={px} cy={py} r={4.5}
                        fill={color}
                        stroke="white"
                        strokeWidth={1.5}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.18, type: 'spring', damping: 12, stiffness: 240 }}
                        style={{ transformOrigin: `${px}px ${py}px` }}
                      />

                      {/* Glassmorphic Label Pill */}
                      <foreignObject x={px - 35} y={py - 32} width={70} height={20} style={{ pointerEvents: 'none' }}>
                        <Motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + i * 0.18 }}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '9999px',
                            height: '18px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                          }}
                        >
                          <span style={{ 
                            fontSize: '8px', 
                            fontWeight: '800', 
                            color: '#1E2D3D',
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}>
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
          const countryFeature = topojson.feature(geoData, geoData.objects.countries).features.find(f => String(f.id) === hoveredCountry);
          const countryName = countryFeature?.properties?.name || 'Destino Guardado';
          
          return (
            <Motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid rgba(255,255,255,0.5)`,
                borderRadius: '16px',
                padding: '12px 20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: '600', color: color, letterSpacing: '1px' }}>DESTINO VISITADO</span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '800', 
                color: '#1E2D3D',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
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
