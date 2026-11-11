/**
 * build-country-emblems.mjs
 *
 * Deterministic, build-time generator for the pre-processed Country Emblems catalog.
 *
 * Pipeline:
 *   1. Read the vendored Natural Earth 50m TopoJSON (scripts/data/…-countries-50m.json).
 *   2. Map each geometry's ISO 3166-1 numeric id → ISO-2 (via world-countries ccn3 ↔ cca2).
 *   3. Filter outlier overseas subpaths (< 5% of the largest polygon with a distant centroid),
 *      while preserving compact archipelagos (JP, ID, PH, GR, GB, NZ).
 *   4. Project each country with d3-geo Mercator, rotated to its centroid,
 *      fit uniformly into a 256×256 canvas with 24px padding ([[24,24],[232,232]]).
 *   5. Simplify each projected ring with Douglas-Peucker (planar px tolerance),
 *      then emit absolute, 1-decimal-rounded SVG paths + curated/fallback palettes.
 *   6. Size-guard: if the output exceeds 520 KB, retry with a 0.6px DP tolerance.
 *
 * Zero runtime API calls. Zero Firestore. Fully offline during `npm run build`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { geoMercator, geoAlbersUsa, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import {
  UN_195_COUNTRIES,
  getCountryISO3,
  getCountryContinent,
} from '../src/shared/lib/utils/countryUtils.js';

const require = createRequire(import.meta.url);
const worldCountries = require('world-countries');

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const TOPO_PATH = path.join(SCRIPT_DIR, 'data', 'world-atlas-countries-50m.json');
const OUT_PATH = path.join(
  ROOT,
  'src',
  'features',
  'gamification',
  'model',
  'data',
  'countryEmblemsCatalog.json',
);

const VIEWBOX = '0 0 256 256';
const PAD = 24;
const EXTENT = [
  [PAD, PAD],
  [256 - PAD, 256 - PAD],
];

// Exactly the 195 sovereign UN countries. Every non-sovereign territory is
// excluded from the catalog (FK → never an independent emblem; AR keeps its own
// geometry, and runtime normalization maps FK visits to AR).
const UN_COUNTRY_SET = new Set(UN_195_COUNTRIES);

// Microstates get a clean, magnified silhouette (shield fallback when absent from 110m).
const MICROSTATES = new Set(['MC', 'VA', 'SM', 'AD', 'LI', 'MT', 'SG', 'LU', 'BH', 'MV', 'SC', 'BB']);

// Curated high-fidelity silhouettes for microstates whose 50m geometry is a
// crude 4–6 vertex blob. Authored inside the 24..232 safe area of the 256×256
// viewBox. Injected verbatim into the catalog by `buildEntryFromFeature`.
const CURATED_MICROSTATE_PATHS = {
  // Monaco (MC): authentic coastline with Port Hercule harbour bay, Monte Carlo
  // and the Le Rocher promontory.
  MC: 'M38,154 C48,142 62,136 76,134 C88,132 98,138 108,144 C116,148 126,148 134,142 C142,134 146,122 152,112 C160,100 170,92 182,86 C194,80 208,72 218,62 C224,56 226,48 222,44 C216,42 204,50 190,58 C176,66 164,74 150,82 C138,90 126,98 114,108 C102,118 90,128 78,138 C66,148 52,156 42,164 C36,168 34,162 38,154 Z',
  // Vatican City (VA): authentic Leonine walls, western bastions and the
  // St. Peter's colonnade ellipse arc.
  VA: 'M82,164 C74,152 70,138 68,124 C66,108 72,94 80,82 C90,70 102,60 116,54 C128,48 144,46 158,50 C172,54 184,62 194,74 C202,86 208,100 210,114 C212,128 208,142 200,154 C192,164 180,172 166,176 C158,178 148,176 140,170 C132,164 126,154 120,148 C114,150 108,156 102,162 C96,168 88,172 82,164 Z',
  // San Marino (SM): national boundary contour following the Monte Titano
  // ridges (smooth crest, no spiky crown).
  SM: 'M128,34 C144,36 160,44 172,56 C184,68 194,84 198,100 C202,116 200,132 196,148 C192,164 184,178 174,190 C162,202 148,212 134,216 C120,216 108,210 98,200 C88,188 80,174 76,158 C72,142 72,126 76,110 C80,94 88,78 100,64 C112,50 120,38 128,34 Z',
  // Liechtenstein (LI): elongated Rhine valley to the west, alpine crest east.
  LI: 'M130,30 C138,36 142,50 144,66 C148,84 154,102 160,122 C166,142 168,162 164,182 C160,198 152,212 140,222 C128,226 118,220 112,208 C106,192 106,174 108,156 C110,136 112,116 114,96 C116,78 118,60 122,46 C124,34 126,30 130,30 Z',
  // Andorra (AD): mountainous Pyrenean valley basin with natural ridges.
  AD: 'M128,40 C146,38 166,44 182,54 C196,64 206,78 212,94 C216,110 214,126 208,142 C200,158 188,172 174,184 C160,196 144,206 130,214 C120,210 108,198 96,186 C84,172 74,156 68,138 C64,120 66,104 74,88 C84,72 98,58 114,48 C120,44 124,42 128,40 Z',
};
// Compact archipelagos must keep every island (never collapse to a single blob).
const ARCHIPELAGO_PRESERVE = new Set(['JP', 'ID', 'PH', 'GR', 'GB', 'NZ']);
// Countries whose distant tropical/overseas landmasses must not stretch the
// fitExtent into an invisible speck:
//   FR → French Guiana (4°N), Caribbean, Réunion, Mayotte
//   NL → Caribbean ABC islands (~12°N)
const OVERSEAS_LAT_BAND = new Set(['FR', 'NL']);
const OVERSEAS_LAT_TOLERANCE = 20; // degrees away from the mainland centroid

// Clean 256×256 geometric shield used for microstates / countries absent from 110m.
const FALLBACK_SHIELD =
  'M128,24 L200,52 L200,148 C200,196 166,220 128,232 C90,220 56,196 56,148 L56,52 Z';

// ─────────────────────────────────────────────────────────────────────────────
// Curated flag palettes (WCAG AA-safe, brand-neutral, high contrast).
// proportions ALWAYS sum to 1. `accent` is the emblem highlight colour.
// ─────────────────────────────────────────────────────────────────────────────
const PALETTES = {
  AR: { colors: ['#74ACDF', '#FFFFFF', '#74ACDF'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#F6B40E' },
  BO: { colors: ['#D52B1E', '#F9E300', '#007934'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#F9E300' },
  BR: { colors: ['#009C3B', '#FFDF00', '#002776'], proportions: [0.5, 0.3, 0.2], direction: 'vertical', accent: '#002776' },
  CL: { colors: ['#FFFFFF', '#D52B1E'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#0039A6' },
  CO: { colors: ['#FCD116', '#003893', '#CE1126'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#FCD116' },
  CR: { colors: ['#002B7F', '#FFFFFF', '#CE1126', '#FFFFFF', '#002B7F'], proportions: [0.17, 0.17, 0.32, 0.17, 0.17], direction: 'horizontal', accent: '#CE1126' },
  CU: { colors: ['#002A8F', '#FFFFFF'], proportions: [0.2, 0.2, 0.2, 0.2, 0.2], direction: 'horizontal', accent: '#CF142B' },
  DO: { colors: ['#002D62', '#FFFFFF', '#CE1126'], proportions: [0.4, 0.2, 0.4], direction: 'horizontal', accent: '#CE1126' },
  EC: { colors: ['#FFD100', '#0033A0', '#EF3340'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#FFD100' },
  SV: { colors: ['#0F47AF', '#FFFFFF', '#0F47AF'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0F47AF' },
  GT: { colors: ['#4997D0', '#FFFFFF', '#4997D0'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#4997D0' },
  HN: { colors: ['#0073CF', '#FFFFFF', '#0073CF'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0073CF' },
  MX: { colors: ['#006847', '#FFFFFF', '#CE1126'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#8C9E3A' },
  NI: { colors: ['#0067C6', '#FFFFFF', '#0067C6'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0067C6' },
  PA: { colors: ['#FFFFFF', '#DA121A', '#072357'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#DA121A' },
  PY: { colors: ['#D52B1E', '#FFFFFF', '#0038A8'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0038A8' },
  PE: { colors: ['#D91023', '#FFFFFF', '#D91023'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#D91023' },
  UY: { colors: ['#FFFFFF', '#0038A8'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FCD116' },
  VE: { colors: ['#FCD116', '#0033A0', '#EF3340'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FCD116' },
  US: { colors: ['#B22234', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#3C3B6E' },
  CA: { colors: ['#FF0000', '#FFFFFF', '#FF0000'], proportions: [0.25, 0.5, 0.25], direction: 'vertical', accent: '#FF0000' },
  BS: { colors: ['#00778B', '#FFC72C', '#00778B'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFC72C' },
  BB: { colors: ['#00267F', '#FFC726', '#00267F'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#000000' },
  BZ: { colors: ['#003F87', '#FFFFFF', '#CE1126'], proportions: [0.4, 0.2, 0.4], direction: 'horizontal', accent: '#003F87' },
  JM: { colors: ['#009B3A', '#000000'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FED100' },
  TT: { colors: ['#CE1126', '#000000'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FFFFFF' },
  // ── Europe ──
  DE: { colors: ['#000000', '#DD0000', '#FFCE00'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFCE00' },
  ES: { colors: ['#AA151B', '#F1BF00', '#AA151B'], proportions: [0.25, 0.5, 0.25], direction: 'horizontal', accent: '#F1BF00' },
  IT: { colors: ['#009246', '#FFFFFF', '#CE2B37'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#CE2B37' },
  FR: { colors: ['#0055A4', '#FFFFFF', '#EF4135'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#EF4135' },
  PT: { colors: ['#046A38', '#DA291C'], proportions: [0.4, 0.6], direction: 'vertical', accent: '#FFCC00' },
  GB: { colors: ['#012169', '#FFFFFF', '#C8102E'], proportions: [0.5, 0.25, 0.25], direction: 'diagonal', accent: '#C8102E' },
  IE: { colors: ['#169B62', '#FFFFFF', '#FF883E'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FF883E' },
  CH: { colors: ['#FF0000', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFFFFF' },
  AT: { colors: ['#ED2939', '#FFFFFF', '#ED2939'], proportions: [0.25, 0.5, 0.25], direction: 'horizontal', accent: '#ED2939' },
  NL: { colors: ['#AE1C28', '#FFFFFF', '#21468B'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#21468B' },
  BE: { colors: ['#000000', '#FDDA24', '#EF3340'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FDDA24' },
  LU: { colors: ['#EF3340', '#FFFFFF', '#00A1DE'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#00A1DE' },
  NO: { colors: ['#BA0C2F', '#FFFFFF', '#00205B'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#00205B' },
  SE: { colors: ['#006AA7', '#FECC00'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#FECC00' },
  FI: { colors: ['#FFFFFF', '#003580'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#003580' },
  DK: { colors: ['#C8102E', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFFFFF' },
  IS: { colors: ['#02529C', '#FFFFFF', '#DC1E35'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#DC1E35' },
  PL: { colors: ['#FFFFFF', '#DC143C'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#DC143C' },
  CZ: { colors: ['#FFFFFF', '#D7141A'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#11457E' },
  SK: { colors: ['#FFFFFF', '#0B4EA2', '#EE1C25'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0B4EA2' },
  HU: { colors: ['#CD2A3E', '#FFFFFF', '#436F4D'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#436F4D' },
  GR: { colors: ['#0D5EAF', '#FFFFFF'], proportions: [0.2, 0.2, 0.2, 0.2, 0.2], direction: 'horizontal', accent: '#0D5EAF' },
  HR: { colors: ['#FF0000', '#FFFFFF', '#171796'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#171796' },
  TR: { colors: ['#E30A17', '#FFFFFF'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#FFFFFF' },
  RU: { colors: ['#FFFFFF', '#0039A6', '#D52B1E'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#D52B1E' },
  UA: { colors: ['#0057B7', '#FFD700'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFD700' },
  RO: { colors: ['#002B7F', '#FCD116', '#CE1126'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FCD116' },
  BG: { colors: ['#FFFFFF', '#00966E', '#D62612'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#D62612' },
  RS: { colors: ['#C6363C', '#0C4076', '#FFFFFF'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#C6363C' },
  SI: { colors: ['#FFFFFF', '#005DA4', '#ED1C24'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#005DA4' },
  BY: { colors: ['#C8313E', '#4AA657'], proportions: [0.66, 0.34], direction: 'horizontal', accent: '#C8313E' },
  EE: { colors: ['#0072CE', '#000000', '#FFFFFF'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0072CE' },
  LV: { colors: ['#9E3039', '#FFFFFF', '#9E3039'], proportions: [0.4, 0.2, 0.4], direction: 'horizontal', accent: '#9E3039' },
  LT: { colors: ['#FDB913', '#006A44', '#C1272D'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#006A44' },
  MD: { colors: ['#003DA5', '#FFD200', '#C8102E'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FFD200' },
  AL: { colors: ['#E41E20', '#000000'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#000000' },
  MK: { colors: ['#D20000', '#FFE600'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#FFE600' },
  ME: { colors: ['#C40308', '#D4AF3A'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#D4AF3A' },
  BA: { colors: ['#002F6C', '#FECB00'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FECB00' },
  CY: { colors: ['#FFFFFF', '#D47600'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#D47600' },
  MT: { colors: ['#FFFFFF', '#CF142B'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#CF142B' },
  AD: { colors: ['#10069F', '#FEDF00', '#D50032'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FEDF00' },
  LI: { colors: ['#002B7F', '#CE1126'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFD83D' },
  SM: { colors: ['#FFFFFF', '#5B92E5'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#5B92E5' },
  VA: { colors: ['#FFE000', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#C9A227' },
  MC: { colors: ['#CE1126', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#CE1126' },
  // ── Asia ──
  JP: { colors: ['#FFFFFF', '#BC002D'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#BC002D' },
  CN: { colors: ['#DE2910', '#FFDE00'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#FFDE00' },
  KR: { colors: ['#FFFFFF', '#CD2E3A', '#0047A0'], proportions: [0.6, 0.2, 0.2], direction: 'horizontal', accent: '#000000' },
  KP: { colors: ['#024FA2', '#ED1C27'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFFFFF' },
  TH: { colors: ['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], proportions: [0.17, 0.17, 0.32, 0.17, 0.17], direction: 'horizontal', accent: '#2D2A4A' },
  VN: { colors: ['#DA251D', '#FFFF00'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#FFFF00' },
  ID: { colors: ['#CE1126', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#CE1126' },
  MY: { colors: ['#CC0001', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#010066' },
  SG: { colors: ['#EF3340', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFFFFF' },
  PH: { colors: ['#0038A8', '#CE1126'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FCD116' },
  IN: { colors: ['#FF9933', '#FFFFFF', '#138808'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000080' },
  PK: { colors: ['#01411C', '#FFFFFF'], proportions: [0.75, 0.25], direction: 'vertical', accent: '#FFFFFF' },
  BD: { colors: ['#006A4E', '#F42A41'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#F42A41' },
  LK: { colors: ['#8D153A', '#FFB700'], proportions: [0.8, 0.2], direction: 'vertical', accent: '#FFB700' },
  NP: { colors: ['#DC143C', '#003893'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#003893' },
  BT: { colors: ['#FFD520', '#FF4E12'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FF4E12' },
  MM: { colors: ['#FECB00', '#34B233', '#EA2839'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  KH: { colors: ['#032EA1', '#E00025', '#032EA1'], proportions: [0.25, 0.5, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  LA: { colors: ['#CE1126', '#002868', '#CE1126'], proportions: [0.25, 0.5, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  MN: { colors: ['#C4272F', '#015197', '#C4272F'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#F9CF02' },
  KZ: { colors: ['#00AFCA', '#FEC50C'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#FEC50C' },
  UZ: { colors: ['#0099B5', '#FFFFFF', '#1EB53A'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#CE1126' },
  KG: { colors: ['#E8112D', '#FFEF00'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#FFEF00' },
  TJ: { colors: ['#CC0000', '#FFFFFF', '#006600'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#F8C300' },
  TM: { colors: ['#00843D', '#D22630'], proportions: [0.75, 0.25], direction: 'vertical', accent: '#FFFFFF' },
  AF: { colors: ['#000000', '#D32011', '#007A36'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FFFFFF' },
  IR: { colors: ['#239F40', '#FFFFFF', '#DA0000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#DA0000' },
  IQ: { colors: ['#CE1126', '#FFFFFF', '#000000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#007A3D' },
  SY: { colors: ['#CE1126', '#FFFFFF', '#000000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#007A3D' },
  LB: { colors: ['#EE161F', '#FFFFFF', '#EE161F'], proportions: [0.25, 0.5, 0.25], direction: 'horizontal', accent: '#00A651' },
  JO: { colors: ['#000000', '#FFFFFF', '#007A3D'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#CE1126' },
  IL: { colors: ['#FFFFFF', '#0038B8'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#0038B8' },
  SA: { colors: ['#006C35', '#FFFFFF'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  AE: { colors: ['#FF0000', '#00732F', '#FFFFFF', '#000000'], proportions: [0.25, 0.25, 0.25, 0.25], direction: 'vertical', accent: '#FF0000' },
  QA: { colors: ['#8A1538', '#FFFFFF'], proportions: [0.7, 0.3], direction: 'vertical', accent: '#FFFFFF' },
  KW: { colors: ['#007A3D', '#FFFFFF', '#CE1126'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000000' },
  OM: { colors: ['#FFFFFF', '#008000', '#DB161B'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#DB161B' },
  YE: { colors: ['#CE1126', '#FFFFFF', '#000000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000000' },
  BH: { colors: ['#CE1126', '#FFFFFF'], proportions: [0.7, 0.3], direction: 'vertical', accent: '#FFFFFF' },
  // ── Africa ──
  ZA: { colors: ['#007A4D', '#FFB612', '#DE3831'], proportions: [0.4, 0.3, 0.3], direction: 'diagonal', accent: '#FFB612' },
  EG: { colors: ['#CE1126', '#FFFFFF', '#000000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#C09300' },
  MA: { colors: ['#C1272D', '#006233'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#006233' },
  DZ: { colors: ['#006233', '#FFFFFF'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#D21034' },
  TN: { colors: ['#E70013', '#FFFFFF'], proportions: [0.72, 0.28], direction: 'horizontal', accent: '#FFFFFF' },
  LY: { colors: ['#CE1126', '#FFFFFF', '#239E46'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  SD: { colors: ['#D21034', '#FFFFFF', '#000000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#007229' },
  ET: { colors: ['#078930', '#FCDD09', '#DA121A'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0F47AF' },
  KE: { colors: ['#000000', '#BB0000', '#006600'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  TZ: { colors: ['#1EB53A', '#000000', '#00A3DD'], proportions: [0.4, 0.3, 0.3], direction: 'diagonal', accent: '#FCD116' },
  UG: { colors: ['#000000', '#FCDC04', '#D90000'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  NG: { colors: ['#008751', '#FFFFFF', '#008751'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#008751' },
  GH: { colors: ['#CE1126', '#FCD116', '#006B3F'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000000' },
  SN: { colors: ['#00853F', '#FDEF42', '#E31B23'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#00853F' },
  CI: { colors: ['#F77F00', '#FFFFFF', '#009E60'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#009E60' },
  CM: { colors: ['#007A5E', '#CE1126', '#FCD116'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FCD116' },
  ZM: { colors: ['#198A00', '#DE2010', '#000000', '#EF7D00'], proportions: [0.7, 0.1, 0.1, 0.1], direction: 'vertical', accent: '#EF7D00' },
  ZW: { colors: ['#006400', '#FFD200', '#D40000', '#000000'], proportions: [0.25, 0.25, 0.25, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  MZ: { colors: ['#007168', '#000000', '#FCE100'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#D21034' },
  AO: { colors: ['#CC092F', '#000000'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#F9D616' },
  NA: { colors: ['#003580', '#D21034', '#009543'], proportions: [0.4, 0.3, 0.3], direction: 'diagonal', accent: '#FFCE00' },
  BW: { colors: ['#6DA9D2', '#000000', '#FFFFFF'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#000000' },
  MG: { colors: ['#FC3D32', '#007E3A', '#FFFFFF'], proportions: [0.4, 0.4, 0.2], direction: 'vertical', accent: '#FFFFFF' },
  CD: { colors: ['#007FFF', '#F7D618', '#CE1021'], proportions: [0.4, 0.3, 0.3], direction: 'diagonal', accent: '#F7D618' },
  RW: { colors: ['#00A1DE', '#FAD201', '#20603D'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#E5BE01' },
  MU: { colors: ['#EA2839', '#1A206D', '#FFD500', '#00A551'], proportions: [0.25, 0.25, 0.25, 0.25], direction: 'horizontal', accent: '#00A551' },
  SC: { colors: ['#003F87', '#FCD856', '#D62828', '#FFFFFF', '#007A3D'], proportions: [0.2, 0.2, 0.2, 0.2, 0.2], direction: 'horizontal', accent: '#007A3D' },
  CV: { colors: ['#003893', '#FFFFFF', '#CF2027'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#F7D116' },
  GM: { colors: ['#CE1126', '#0C1C8C', '#3A7728'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  SL: { colors: ['#1EB53A', '#FFFFFF', '#0072C6'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0072C6' },
  LR: { colors: ['#BF0A30', '#FFFFFF', '#002868'], proportions: [0.4, 0.2, 0.4], direction: 'horizontal', accent: '#FFFFFF' },
  TG: { colors: ['#006A4E', '#FFCE00', '#D21034'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  BJ: { colors: ['#008751', '#FCD116', '#E8112D'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FCD116' },
  BF: { colors: ['#EF2B2D', '#009E49'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FCD116' },
  ML: { colors: ['#14B53A', '#FCD116', '#CE1126'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#FCD116' },
  NE: { colors: ['#E05206', '#FFFFFF', '#0DB02B'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#E05206' },
  TD: { colors: ['#002664', '#FECB00', '#C60C30'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#C60C30' },
  CF: { colors: ['#003082', '#FFFFFF', '#289728', '#FFCE00'], proportions: [0.25, 0.25, 0.25, 0.25], direction: 'horizontal', accent: '#D21034' },
  CG: { colors: ['#009543', '#FBDE4A', '#DC241F'], proportions: [0.4, 0.3, 0.3], direction: 'diagonal', accent: '#FBDE4A' },
  GA: { colors: ['#009E60', '#FCD116', '#3A75C4'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FCD116' },
  GQ: { colors: ['#3E9A00', '#FFFFFF', '#E32118'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#0073CE' },
  ST: { colors: ['#12AD2B', '#FFCE00', '#12AD2B'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#D21034' },
  GW: { colors: ['#CE1126', '#FCD116', '#009E49'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000000' },
  GN: { colors: ['#CE1126', '#FCD116', '#009460'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#CE1126' },
  MR: { colors: ['#00A95C', '#FFD700'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#D01C1F' },
  ER: { colors: ['#12AD2B', '#EA0437', '#4189DD'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFC726' },
  DJ: { colors: ['#6AB2E7', '#12AD2B'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#D7141A' },
  SO: { colors: ['#4189DD', '#FFFFFF'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  SS: { colors: ['#000000', '#DA121A', '#078930'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FCDD09' },
  LS: { colors: ['#00209F', '#FFFFFF', '#009543'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#000000' },
  SZ: { colors: ['#3E5EB9', '#FFD900', '#B10C0C'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FCD116' },
  MW: { colors: ['#000000', '#CE1126', '#339E35'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#CE1126' },
  BI: { colors: ['#CE1126', '#FFFFFF', '#1EB53A'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#FFFFFF' },
  KM: { colors: ['#FFC61E', '#FFFFFF', '#CE1126', '#3A75C4'], proportions: [0.25, 0.25, 0.25, 0.25], direction: 'horizontal', accent: '#3A75C4' },
  // ── Oceania ──
  AU: { colors: ['#00008B', '#FFFFFF', '#FF0000'], proportions: [0.6, 0.2, 0.2], direction: 'horizontal', accent: '#FFFFFF' },
  NZ: { colors: ['#00247D', '#CC142B'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#CC142B' },
  FJ: { colors: ['#68BFE5', '#00247D'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#FFFFFF' },
  PG: { colors: ['#CE1126', '#000000'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FCD116' },
  SB: { colors: ['#0051BA', '#215B33'], proportions: [0.6, 0.4], direction: 'diagonal', accent: '#FCD116' },
  VU: { colors: ['#D21034', '#009543'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FDCE12' },
  WS: { colors: ['#CE1126', '#002B7F'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#FFFFFF' },
  TO: { colors: ['#C10000', '#FFFFFF'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  KI: { colors: ['#CE1126', '#003F87'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FCD116' },
  FM: { colors: ['#6DA9D2', '#FFFFFF'], proportions: [0.75, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  MH: { colors: ['#003893', '#DD7500', '#FFFFFF'], proportions: [0.5, 0.25, 0.25], direction: 'horizontal', accent: '#FFFFFF' },
  PW: { colors: ['#4AADD6', '#FFDE00'], proportions: [0.7, 0.3], direction: 'horizontal', accent: '#FFDE00' },
  NR: { colors: ['#002B7F', '#FFC726'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FFFFFF' },
  TV: { colors: ['#5B97B1', '#FCD116', '#CE1126'], proportions: [0.6, 0.2, 0.2], direction: 'horizontal', accent: '#CE1126' },
};

// Deterministic, WCAG AA-safe fallback palettes for the long tail of ISO codes.
const FALLBACK_PALETTES = [
  { colors: ['#2C3E50', '#45B0A8'], proportions: [0.6, 0.4], direction: 'horizontal', accent: '#45B0A8' },
  { colors: ['#FF6B35', '#2C3E50'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#FF6B35' },
  { colors: ['#F59E0B', '#1E293B'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#F59E0B' },
  { colors: ['#6366F1', '#E2E8F0'], proportions: [0.4, 0.6], direction: 'diagonal', accent: '#6366F1' },
  { colors: ['#45B0A8', '#F8FAFC'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#2C3E50' },
  { colors: ['#E11D48', '#0F172A'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#E11D48' },
  { colors: ['#8B5CF6', '#F59E0B'], proportions: [0.6, 0.4], direction: 'horizontal', accent: '#F59E0B' },
  { colors: ['#0EA5E9', '#1E293B'], proportions: [0.5, 0.5], direction: 'vertical', accent: '#0EA5E9' },
  { colors: ['#16A34A', '#F8FAFC', '#2C3E50'], proportions: [0.33, 0.34, 0.33], direction: 'horizontal', accent: '#16A34A' },
  { colors: ['#9333EA', '#FDE68A'], proportions: [0.5, 0.5], direction: 'diagonal', accent: '#FDE68A' },
  { colors: ['#DC2626', '#FFFFFF', '#1E293B'], proportions: [0.33, 0.34, 0.33], direction: 'vertical', accent: '#DC2626' },
  { colors: ['#0D9488', '#FACC15'], proportions: [0.5, 0.5], direction: 'horizontal', accent: '#FACC15' },
];

const hashIso2 = (iso2 = '') => {
  let h = 0;
  for (let i = 0; i < iso2.length; i += 1) {
    h = (h * 31 + iso2.charCodeAt(i)) >>> 0;
  }
  return h;
};

const resolvePalette = (iso2) => {
  const curated = PALETTES[iso2];
  if (curated) return { ...curated, colors: [...curated.colors], proportions: [...curated.proportions] };
  const picked = FALLBACK_PALETTES[hashIso2(iso2) % FALLBACK_PALETTES.length];
  return { ...picked, colors: [...picked.colors], proportions: [...picked.proportions] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────────────────────
const ringBounds = (ring) => {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const point of ring) {
    const lng = point[0];
    const lat = point[1];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    span: Math.hypot(maxLng - minLng, maxLat - minLat),
  };
};

const ringArea = (ring) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area) / 2;
};

/**
 * Drops distant overseas subpaths (< 5% of the largest polygon area with a
 * centroid far from the mainland), preventing French Guiana / Canary Islands /
 * Pacific atolls from shrinking the silhouette. Compact archipelagos are exempt.
 */
const filterOutlierPolygons = (polygons, iso2) => {
  if (!Array.isArray(polygons) || polygons.length <= 1) return polygons || [];

  const infos = polygons.map((rings, index) => {
    const bounds = ringBounds(rings[0]);
    const rawArea = ringArea(rings[0]);
    const area = Math.max(rawArea * Math.abs(Math.cos((bounds.center[1] * Math.PI) / 180)), 1e-9);
    return { index, rings, area, center: bounds.center, span: bounds.span };
  });

  const main = infos.reduce((best, cur) => (cur.area > best.area ? cur : best), infos[0]);
  if (ARCHIPELAGO_PRESERVE.has(iso2)) return polygons;

  const kept = infos.filter((info) => {
    if (info === main) return true;

    // Polar-archipelago outliers (e.g. Svalbard for Norway): when the mainland
    // centroid is temperate, drop far-north islands so Mercator distortion never
    // shrinks/splits the primary landmass.
    if (main.center[1] < 68 && info.center[1] > 72) return false;

    // Overseas territories far outside the mainland latitude band (French
    // Guiana, Caribbean islands, Réunion, Mayotte) would otherwise anchor the
    // bounding box and shrink the metropolitan silhouette into a speck.
    if (
      OVERSEAS_LAT_BAND.has(iso2) &&
      Math.abs(info.center[1] - main.center[1]) > OVERSEAS_LAT_TOLERANCE
    ) {
      return false;
    }

    const areaRatio = info.area / main.area;
    const rawDLng = Math.abs(info.center[0] - main.center[0]);
    const dLng = Math.min(rawDLng, 360 - rawDLng);
    const dLat = Math.abs(info.center[1] - main.center[1]);
    const distance = Math.hypot(dLng, dLat);
    const isFar = main.span > 0 ? distance / main.span > 0.75 : false;
    const isTiny = areaRatio < 0.05;
    return !(isTiny && isFar);
  });

  return kept.map((info) => info.rings);
};

const normalizePolygons = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Douglas-Peucker simplification (planar px space) — keeps 50m silhouettes crisp
// while staying inside the catalog size budget. geoPath emits absolute M/L/Z.
// ─────────────────────────────────────────────────────────────────────────────
const DP_EPSILON_DEFAULT = 0.45;
let dpTolerance = DP_EPSILON_DEFAULT;

const perpendicularDistance = (point, start, end) => {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (magnitude * magnitude)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
};

const douglasPeucker = (points, tolerance) => {
  if (points.length <= 2) return points;
  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
};

/** Simplifies each M…L…Z ring of a projected SVG path with Douglas-Peucker. */
const simplifySvgPath = (svgPathD, tolerance = dpTolerance) => {
  if (!svgPathD) return '';
  const tokens = svgPathD.match(/[MLZmlz]|-?\d+(?:\.\d+)?/g);
  if (!tokens) return svgPathD;

  const output = [];
  let ring = [];
  let index = 0;

  const flushRing = () => {
    if (ring.length >= 2) {
      const simplified = douglasPeucker(ring, tolerance);
      output.push(`M${simplified.map(([x, y]) => `${x},${y}`).join('L')}Z`);
    }
    ring = [];
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (/^[mlz]$/i.test(token)) {
      const command = token.toUpperCase();
      if (command === 'M' || command === 'L') {
        if (command === 'M') flushRing();
        index += 1;
        const x = Number(tokens[index]);
        const y = Number(tokens[index + 1]);
        index += 2;
        if (Number.isFinite(x) && Number.isFinite(y)) ring.push([x, y]);
      } else {
        flushRing();
        index += 1;
      }
    } else {
      index += 1;
    }
  }
  flushRing();
  return output.join('');
};

/** Rounds every decimal coordinate to 1 decimal place and normalizes whitespace. */
const roundPath = (d) => {
  if (!d) return '';
  return d
    .replace(/-?\d+\.\d+/g, (match) => String(Math.round(Number(match) * 10) / 10))
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Drops degenerate rings whose projected bounding box is smaller than
 * `minSize` px (e.g. sub-pixel Aleutian atolls collapsed by DP rounding),
 * preventing noise like `M229,159Z` from bloating the path string.
 */
const dropDegenerateRings = (d, minSize = 0.5) => {
  if (!d) return '';
  const rings = d.split('M').filter(Boolean).map((ring) => `M${ring}`);
  const kept = rings.filter((ring) => {
    const nums = ring.match(/-?\d+(?:\.\d+)?/g) || [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = Number(nums[i]);
      const y = Number(nums[i + 1]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return maxX - minX >= minSize || maxY - minY >= minSize;
  });
  return kept.length > 0 ? kept.join('') : d;
};

const buildIsoMaps = () => {
  const numericToIso2 = new Map();
  const meta = {};
  for (const country of worldCountries) {
    if (!country || !country.cca2) continue;
    const iso2 = String(country.cca2).toUpperCase();

    // Numeric map must cover EVERY feature (including territories) so we can
    // resolve each geometry before filtering it out.
    if (country.ccn3) {
      numericToIso2.set(String(country.ccn3).padStart(3, '0'), iso2);
      numericToIso2.set(String(Number(country.ccn3)), iso2);
    }

    // Metadata is restricted to the 195 sovereign UN countries.
    if (!UN_COUNTRY_SET.has(iso2)) continue;

    meta[iso2] = {
      iso3: country.cca3 || null,
      continent: country.subregion || country.region || 'World',
      latlng: Array.isArray(country.latlng) ? country.latlng : null,
    };
  }
  return { numericToIso2, meta };
};

const buildEntryFromFeature = (feature, iso2, meta) => {
  const isMicrostate = MICROSTATES.has(iso2);

  // Antarctica cannot be projected with Mercator (poles); use the clean shield.
  if (iso2 === 'AQ') {
    return {
      iso2,
      iso3: meta?.iso3 || null,
      type: 'country',
      continent: meta?.continent || 'Antarctica',
      isMicrostate: false,
      viewBox: VIEWBOX,
      svgPath: FALLBACK_SHIELD,
      palette: resolvePalette(iso2),
    };
  }

  // United States — canonical Albers USA composite: CONUS at true equal-area
  // scale, Alaska inset (~35%) and Hawaii placed by d3. Bypasses the outlier
  // filter so Hawaii and the Aleutian chain survive (Albers handles the 180°
  // wrap natively).
  if (iso2 === 'US' && feature.geometry) {
    let usPath = '';
    try {
      const featureObj = { type: 'Feature', geometry: feature.geometry };
      const projection = geoAlbersUsa().fitExtent(EXTENT, featureObj);
      usPath = roundPath(
        dropDegenerateRings(
          simplifySvgPath(geoPath().projection(projection)(featureObj), dpTolerance),
        ),
      );
    } catch {
      usPath = '';
    }
    if (!usPath) usPath = FALLBACK_SHIELD;

    return {
      iso2,
      iso3: meta?.iso3 || 'USA',
      type: 'country',
      continent: meta?.continent || 'North America',
      isMicrostate: false,
      viewBox: VIEWBOX,
      svgPath: usPath,
      palette: resolvePalette(iso2),
    };
  }

  const polygons = normalizePolygons(feature.geometry);
  const kept = filterOutlierPolygons(polygons, iso2);
  let svgPath = '';

  if (kept.length > 0) {
    const featureObj = { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: kept } };
    const centerLng = meta?.latlng?.[1] ?? ringBounds(kept[0][0]).center[0];
    try {
      const projection = geoMercator().rotate([-centerLng, 0]).fitExtent(EXTENT, featureObj);
      svgPath = roundPath(simplifySvgPath(geoPath().projection(projection)(featureObj), dpTolerance));
    } catch {
      svgPath = '';
    }
    if (!svgPath) {
      try {
        const projection = geoMercator().fitExtent(EXTENT, featureObj);
        svgPath = roundPath(simplifySvgPath(geoPath().projection(projection)(featureObj), dpTolerance));
      } catch {
        svgPath = '';
      }
    }
  }

  if (!svgPath) svgPath = FALLBACK_SHIELD;

  return {
    iso2,
    iso3: meta?.iso3 || null,
    type: 'country',
    continent: meta?.continent || 'World',
    isMicrostate,
    viewBox: VIEWBOX,
    svgPath,
    palette: resolvePalette(iso2),
  };
};

const buildCatalog = (tolerance = DP_EPSILON_DEFAULT) => {
  dpTolerance = tolerance;
  const topology = JSON.parse(fs.readFileSync(TOPO_PATH, 'utf8'));
  const collection = topojson.feature(topology, topology.objects.countries);
  const { numericToIso2, meta } = buildIsoMaps();

  // Index every TopoJSON feature by resolved ISO-2. Territories are indexed too
  // (so we can resolve them), then filtered out: FK/GL/PR/HK/AQ are not in the
  // 195 sovereign set, so they never become independent emblems.
  const featureMap = new Map();
  for (const feature of collection.features || []) {
    if (!feature || feature.id == null) continue;
    const rawId = String(feature.id);
    const iso2 =
      numericToIso2.get(rawId.padStart(3, '0')) ||
      numericToIso2.get(rawId) ||
      numericToIso2.get(String(Number(rawId)));
    if (!iso2 || !UN_COUNTRY_SET.has(iso2) || featureMap.has(iso2)) continue;
    featureMap.set(iso2, feature);
  }

  // Iterate the canonical 195 UN list so EVERY sovereign is always emitted —
  // even when Natural Earth 50m has no polygon (e.g. Monaco).
  const catalogCountries = [];
  for (const countryCode of UN_195_COUNTRIES) {
    const countryMeta = meta[countryCode];
    const feature = featureMap.get(countryCode);

    if (CURATED_MICROSTATE_PATHS[countryCode]) {
      catalogCountries.push({
        iso2: countryCode,
        iso3: countryMeta?.iso3 || getCountryISO3(countryCode) || countryCode,
        type: 'country',
        continent: countryMeta?.continent || getCountryContinent(countryCode) || 'World',
        isMicrostate: true,
        viewBox: VIEWBOX,
        svgPath: CURATED_MICROSTATE_PATHS[countryCode],
        palette: resolvePalette(countryCode),
      });
      continue;
    }

    if (feature) {
      catalogCountries.push(buildEntryFromFeature(feature, countryCode, countryMeta));
      continue;
    }

    // Absent from 50m: clean shield fallback, still a 195 sovereign entry.
    catalogCountries.push({
      iso2: countryCode,
      iso3: countryMeta?.iso3 || getCountryISO3(countryCode) || countryCode,
      type: 'country',
      continent: countryMeta?.continent || getCountryContinent(countryCode) || 'World',
      isMicrostate: MICROSTATES.has(countryCode),
      viewBox: VIEWBOX,
      svgPath: FALLBACK_SHIELD,
      palette: resolvePalette(countryCode),
    });
  }

  // UN_195_COUNTRIES is ISO-2 sorted, so insertion order is deterministic.
  const ordered = {};
  for (const entry of catalogCountries) ordered[entry.iso2] = entry;

  return {
    version: 1,
    source: `Natural Earth 50m (world-atlas@2) · 195 UN sovereign countries · d3-geo Mercator fit-extent 256x256 (Albers USA for US) · DP ${tolerance}px`,
    viewBox: VIEWBOX,
    padding: PAD,
    totalCountries: catalogCountries.length,
    countries: ordered,
  };
};

const writeCatalog = (catalog, json, tolerance) => {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, json, 'utf8');
  const microstates = Object.values(catalog.countries).filter((entry) => entry.isMicrostate).length;
  const bytes = Buffer.byteLength(json);
  const kb = (bytes / 1024).toFixed(1);
  console.log(
    `✔ 50m Catalog generated successfully: ${catalog.totalCountries} countries (${microstates} microstates), ${kb} KB (dp tolerance ${tolerance}px)`,
  );
  if (catalog.totalCountries !== UN_195_COUNTRIES.length) {
    console.error(
      `✖ Catalog must contain exactly ${UN_195_COUNTRIES.length} UN sovereign countries (got ${catalog.totalCountries}).`,
    );
    process.exitCode = 1;
  }
  if (bytes > 450 * 1024) {
    console.error('✖ Catalog exceeds the 450 KB budget even at maximum simplification.');
    process.exitCode = 1;
  }
};

// Generate with the default tolerance; if the catalog exceeds the 450 KB
// budget, retry deterministically with a coarser 0.6px Douglas-Peucker tolerance.
let dpToleranceUsed = DP_EPSILON_DEFAULT;
let catalog = buildCatalog(dpToleranceUsed);
let catalogJson = `${JSON.stringify(catalog, null, 2)}\n`;
if (Buffer.byteLength(catalogJson) > 450 * 1024) {
  dpToleranceUsed = 0.6;
  catalog = buildCatalog(dpToleranceUsed);
  catalogJson = `${JSON.stringify(catalog, null, 2)}\n`;
}
writeCatalog(catalog, catalogJson, dpToleranceUsed);


