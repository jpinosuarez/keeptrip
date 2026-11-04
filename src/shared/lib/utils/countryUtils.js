// Fuente de verdad para banderas y códigos.
// Usamos flagcdn.com para asegurar compatibilidad total (Windows/Mac/Android).

export const normalizeCountryCode = (code) => {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized.length === 2) return normalized;

  if (normalized.length === 3) {
    const country = COUNTRIES_DATA.find((item) => item.iso3 === normalized);
    return country?.code || null;
  }

  return null;
};

export const getFlagUrl = (countryCode) => {
  if (!countryCode) return null;
  if (typeof countryCode === 'string' && /^https?:\/\//i.test(countryCode)) return countryCode;

  // flagcdn usa códigos de 2 letras en minúscula
  const normalizedCode = normalizeCountryCode(countryCode);
  if (!normalizedCode) return null;
  return `https://flagcdn.com/${normalizedCode.toLowerCase()}.svg`;
};
export const getCountryISO2 = (code) => {
  return normalizeCountryCode(code);
};

// ─────────────────────────────────────────────────────────────────────────────
// Classical 5-Continent Taxonomy (Block 2.3 — Deep Travel Analytics)
// Deterministic ISO-2 → continent lookup WITHOUT political subdivisions.
// EU 44 + AM 35 + AS 48 + AF 54 + OC 14 = 195 sovereign countries.
// ─────────────────────────────────────────────────────────────────────────────
export const CONTINENT_COUNTRY_CODES = {
  EU: [
    'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI',
    'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT',
    'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS',
    'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA',
  ],
  AM: [
    'AG', 'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO', 'CR', 'CU',
    'DM', 'DO', 'EC', 'SV', 'GD', 'GT', 'GY', 'HT', 'HN', 'JM', 'MX', 'NI',
    'PA', 'PY', 'PE', 'KN', 'LC', 'VC', 'SR', 'TT', 'US', 'UY', 'VE',
  ],
  AS: [
    'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN',
    'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY',
    'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG',
    'KR', 'LK', 'SY', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE',
  ],
  AF: [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD',
    'CG', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN',
    'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ',
    'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD',
    'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
  ],
  OC: [
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO',
    'TV', 'VU',
  ],
};

export const CONTINENT_TOTALS = { EU: 44, AM: 35, AS: 48, AF: 54, OC: 14 };

export const CONTINENT_MAP = Object.entries(CONTINENT_COUNTRY_CODES).reduce(
  (acc, [continent, codes]) => {
    codes.forEach((iso2) => {
      acc[iso2] = continent;
    });
    return acc;
  },
  {}
);

/**
 * Maps an ISO-2/ISO-3 country code to one of the 5 classical continents.
 * @param {string} iso2OrIso3
 * @returns {'EU'|'AM'|'AS'|'AF'|'OC'|null}
 */
export const getCountryContinent = (iso2OrIso3) => {
  const iso2 = normalizeCountryCode(iso2OrIso3);
  if (!iso2) return null;
  return CONTINENT_MAP[iso2] || null;
};

// Coordenadas centroide [longitud, latitud] para cámaras y mapas (Mapbox usa [lng, lat])
export const COUNTRY_CENTROIDS = {
  AR: [-63.6167, -38.4161],
  DE: [10.4515, 51.1657],
  ES: [-3.7492, 40.4637],
  FR: [2.2137, 46.2276],
  IT: [12.5674, 41.8719],
  GB: [-3.436, 55.3781],
  US: [-95.7129, 37.0902],
  MX: [-102.5528, 23.6345],
  BR: [-51.9253, -14.235],
  CL: [-71.543, -35.6751],
  UY: [-55.7658, -32.5228],
  CO: [-74.2973, 4.5709],
  PE: [-75.0152, -9.1899],
  JP: [138.2529, 36.2048],
  CN: [104.1954, 35.8617],
  AU: [133.7751, -25.2744],
  PT: [-8.2245, 39.3999],
  NL: [5.2913, 52.1326],
  CH: [8.2275, 46.8182],
  AT: [14.5501, 47.5162],
  BE: [4.4699, 50.5039],
  GR: [21.8243, 39.0742],
  TR: [35.2433, 38.9637],
  TH: [100.9925, 15.87],
  CA: [-106.3468, 56.1304],
  NZ: [174.886, -40.9006],
  IE: [-8.2439, 53.4129],
  NO: [8.4689, 60.472],
  SE: [18.6435, 60.1282],
  DK: [9.5018, 56.2639],
  FI: [25.7482, 61.9241],
  PL: [19.1451, 51.9194],
  CZ: [15.473, 49.8175],
  ZA: [22.9375, -30.5595],
  IN: [78.9629, 20.5937],
  KR: [127.7669, 35.9078],
  ID: [113.9213, -0.7893],
  VN: [108.2772, 14.0583],
  EG: [30.8025, 26.8206],
  MA: [-7.0926, 31.7917],
};

export const getCountryCentroid = (code) => {
  if (!code) return null;
  const iso2 = normalizeCountryCode(code);
  if (!iso2) return null;
  return COUNTRY_CENTROIDS[iso2] || null;
};

/**
 * Simplified country bounding boxes: [minLng, minLat, maxLng, maxLat].
 * The boxes are intentionally generous so the camera never crops a country
 * when framing a trip route (Block 2.1 — Country-Framed Route Map).
 */
export const COUNTRY_BOUNDS = {
  AR: [-73.6, -55.1, -53.6, -21.8],
  AU: [112.9, -43.7, 153.6, -10.7],
  AT: [9.5, 46.4, 17.2, 49.0],
  BE: [2.5, 49.5, 6.4, 51.5],
  BO: [-69.7, -22.9, -57.5, -9.7],
  BR: [-73.9, -33.8, -34.8, 5.3],
  BG: [22.4, 41.2, 28.6, 44.2],
  CA: [-141.0, 41.7, -52.6, 83.1],
  CH: [5.9, 45.8, 10.5, 47.8],
  CL: [-75.7, -55.9, -66.9, -17.5],
  CN: [73.5, 18.2, 134.8, 53.6],
  CO: [-79.0, -4.2, -66.9, 12.5],
  CR: [-85.9, 8.0, -82.5, 11.3],
  CU: [-85.0, 19.8, -74.1, 23.3],
  CY: [32.2, 34.5, 34.6, 35.7],
  CZ: [12.1, 48.6, 18.9, 51.1],
  DE: [5.9, 47.3, 15.0, 55.1],
  DK: [8.0, 54.5, 12.7, 57.8],
  DO: [-72.0, 17.5, -68.3, 19.9],
  EC: [-81.1, -5.0, -75.2, 1.5],
  EG: [24.7, 22.0, 36.9, 31.7],
  ES: [-9.3, 36.0, 3.3, 43.8],
  FI: [19.5, 59.8, 31.6, 70.1],
  FR: [-5.1, 41.3, 9.6, 51.1],
  GB: [-8.6, 49.9, 1.8, 60.9],
  GR: [19.4, 34.8, 28.2, 41.8],
  HR: [13.5, 42.4, 19.4, 46.6],
  HU: [16.1, 45.7, 22.9, 48.6],
  ID: [95.3, -11.0, 141.1, 6.1],
  IE: [-10.5, 51.4, -6.0, 55.4],
  IL: [34.3, 29.5, 35.9, 33.4],
  IN: [68.1, 8.0, 97.4, 35.5],
  IS: [-24.5, 63.3, -13.5, 66.6],
  IT: [6.6, 36.6, 18.5, 47.1],
  JP: [122.9, 24.0, 146.0, 45.5],
  KH: [102.3, 10.4, 107.6, 14.7],
  KR: [125.1, 33.1, 129.6, 38.6],
  MA: [-17.1, 27.7, -1.0, 35.9],
  MX: [-118.4, 14.5, -86.7, 32.7],
  MY: [99.6, 0.9, 119.3, 7.4],
  NL: [3.3, 50.7, 7.2, 53.6],
  NO: [4.6, 57.9, 31.1, 71.2],
  NZ: [166.4, -47.3, 178.6, -34.4],
  PE: [-81.3, -18.4, -68.7, 0.0],
  PH: [116.9, 4.6, 126.6, 21.1],
  PL: [14.1, 49.0, 24.2, 54.9],
  PT: [-9.5, 36.9, -6.2, 42.2],
  PY: [-62.6, -27.6, -54.3, -19.3],
  RO: [20.3, 43.6, 29.7, 48.3],
  RU: [-180.0, 41.2, 180.0, 81.9],
  SE: [11.1, 55.3, 24.2, 69.1],
  SG: [103.6, 1.1, 104.1, 1.5],
  SK: [16.8, 47.7, 22.6, 49.6],
  TH: [97.3, 5.6, 105.6, 20.5],
  TR: [26.0, 35.8, 44.8, 42.1],
  UA: [22.1, 44.4, 40.2, 52.4],
  US: [-171.8, 18.9, -66.9, 71.4],
  UY: [-58.5, -35.0, -53.1, -30.1],
  VE: [-73.4, 0.6, -59.8, 12.2],
  VN: [102.1, 8.6, 109.5, 23.4],
  ZA: [16.4, -34.9, 32.9, -22.1],
};

/**
 * Returns the [minLng, minLat, maxLng, maxLat] box for a country code.
 * Falls back to a padded centroid box (±8°) so the camera never fails or
 * crops when a country has no explicit bounds entry.
 */
export const getCountryBounds = (code) => {
  const iso2 = normalizeCountryCode(code);
  if (!iso2) return null;

  const bounds = COUNTRY_BOUNDS[iso2];
  if (bounds) return [...bounds];

  const centroid = COUNTRY_CENTROIDS[iso2];
  if (!centroid) return null;

  const [lng, lat] = centroid;
  return [
    Math.max(-180, lng - 8),
    Math.max(-85, lat - 8),
    Math.min(180, lng + 8),
    Math.min(85, lat + 8),
  ];
};

// Convierte código Alpha-2 (ej: AR) a Alpha-3 (ej: ARG) para Mapbox
export const getCountryISO3 = (code2) => {
  if (!code2) return null;

  const normalizedAlpha2 = normalizeCountryCode(code2);
  if (normalizedAlpha2) {
    const country = COUNTRIES_DATA.find((c) => c.code === normalizedAlpha2);
    if (country?.iso3) return country.iso3;
  }

  const raw = typeof code2 === 'string' ? code2.trim().toUpperCase() : '';
  return raw.length === 3 ? raw : null;
};

export const getCountryName = (code) => {
  if (!code) return '';
  const country = COUNTRIES_DATA.find(c => c.code === code.toUpperCase() || c.iso3 === code.toUpperCase());
  return country ? country.name : code;
};
export const getCountryFlagEmoji = (code) => {
  if (!code) return '🌍';
  const normalized = normalizeCountryCode(code);
  if (!normalized) return '🌍';
  if (normalized.length !== 2) return '🌍';
  const first = normalized.charCodeAt(0) - 65 + 0x1F1E6;
  const second = normalized.charCodeAt(1) - 65 + 0x1F1E6;
  if (first < 0x1F1E6 || second < 0x1F1E6) return '🌍';
  return String.fromCodePoint(first, second);
};
// LISTA ESTÁNDAR ISO 3166-1 (Selección principal)
export const COUNTRIES_DATA = [
  { code: 'AF', iso3: 'AFG', name: 'Afganistán' },
  { code: 'AL', iso3: 'ALB', name: 'Albania' },
  { code: 'DE', iso3: 'DEU', name: 'Alemania' },
  { code: 'AD', iso3: 'AND', name: 'Andorra' },
  { code: 'AO', iso3: 'AGO', name: 'Angola' },
  { code: 'SA', iso3: 'SAU', name: 'Arabia Saudita' },
  { code: 'DZ', iso3: 'DZA', name: 'Argelia' },
  { code: 'AR', iso3: 'ARG', name: 'Argentina' },
  { code: 'AM', iso3: 'ARM', name: 'Armenia' },
  { code: 'AU', iso3: 'AUS', name: 'Australia' },
  { code: 'AT', iso3: 'AUT', name: 'Austria' },
  { code: 'AZ', iso3: 'AZE', name: 'Azerbaiyán' },
  { code: 'BD', iso3: 'BGD', name: 'Bangladesh' },
  { code: 'BB', iso3: 'BRB', name: 'Barbados' },
  { code: 'BE', iso3: 'BEL', name: 'Bélgica' },
  { code: 'BZ', iso3: 'BLZ', name: 'Belice' },
  { code: 'BO', iso3: 'BOL', name: 'Bolivia' },
  { code: 'BA', iso3: 'BIH', name: 'Bosnia y Herzegovina' },
  { code: 'BW', iso3: 'BWA', name: 'Botsuana' },
  { code: 'BR', iso3: 'BRA', name: 'Brasil' },
  { code: 'BG', iso3: 'BGR', name: 'Bulgaria' },
  { code: 'KH', iso3: 'KHM', name: 'Camboya' },
  { code: 'CM', iso3: 'CMR', name: 'Camerún' },
  { code: 'CA', iso3: 'CAN', name: 'Canadá' },
  { code: 'QA', iso3: 'QAT', name: 'Catar' },
  { code: 'CL', iso3: 'CHL', name: 'Chile' },
  { code: 'CN', iso3: 'CHN', name: 'China' },
  { code: 'CY', iso3: 'CYP', name: 'Chipre' },
  { code: 'CO', iso3: 'COL', name: 'Colombia' },
  { code: 'KR', iso3: 'KOR', name: 'Corea del Sur' },
  { code: 'CR', iso3: 'CRI', name: 'Costa Rica' },
  { code: 'HR', iso3: 'HRV', name: 'Croacia' },
  { code: 'CU', iso3: 'CUB', name: 'Cuba' },
  { code: 'DK', iso3: 'DNK', name: 'Dinamarca' },
  { code: 'EC', iso3: 'ECU', name: 'Ecuador' },
  { code: 'EG', iso3: 'EGY', name: 'Egipto' },
  { code: 'SV', iso3: 'SLV', name: 'El Salvador' },
  { code: 'AE', iso3: 'ARE', name: 'Emiratos Árabes Unidos' },
  { code: 'ES', iso3: 'ESP', name: 'España' },
  { code: 'US', iso3: 'USA', name: 'Estados Unidos' },
  { code: 'EE', iso3: 'EST', name: 'Estonia' },
  { code: 'PH', iso3: 'PHL', name: 'Filipinas' },
  { code: 'FI', iso3: 'FIN', name: 'Finlandia' },
  { code: 'FR', iso3: 'FRA', name: 'Francia' },
  { code: 'GR', iso3: 'GRC', name: 'Grecia' },
  { code: 'GT', iso3: 'GTM', name: 'Guatemala' },
  { code: 'HT', iso3: 'HTI', name: 'Haití' },
  { code: 'HN', iso3: 'HND', name: 'Honduras' },
  { code: 'HU', iso3: 'HUN', name: 'Hungría' },
  { code: 'IN', iso3: 'IND', name: 'India' },
  { code: 'ID', iso3: 'IDN', name: 'Indonesia' },
  { code: 'IQ', iso3: 'IRQ', name: 'Irak' },
  { code: 'IE', iso3: 'IRL', name: 'Irlanda' },
  { code: 'IS', iso3: 'ISL', name: 'Islandia' },
  { code: 'IL', iso3: 'ISR', name: 'Israel' },
  { code: 'IT', iso3: 'ITA', name: 'Italia' },
  { code: 'JM', iso3: 'JAM', name: 'Jamaica' },
  { code: 'JP', iso3: 'JPN', name: 'Japón' },
  { code: 'JO', iso3: 'JOR', name: 'Jordania' },
  { code: 'KE', iso3: 'KEN', name: 'Kenia' },
  { code: 'KW', iso3: 'KWT', name: 'Kuwait' },
  { code: 'LB', iso3: 'LBN', name: 'Líbano' },
  { code: 'MY', iso3: 'MYS', name: 'Malasia' },
  { code: 'MA', iso3: 'MAR', name: 'Marruecos' },
  { code: 'MX', iso3: 'MEX', name: 'México' },
  { code: 'MC', iso3: 'MCO', name: 'Mónaco' },
  { code: 'NP', iso3: 'NPL', name: 'Nepal' },
  { code: 'NI', iso3: 'NIC', name: 'Nicaragua' },
  { code: 'NO', iso3: 'NOR', name: 'Noruega' },
  { code: 'NZ', iso3: 'NZL', name: 'Nueva Zelanda' },
  { code: 'NL', iso3: 'NLD', name: 'Países Bajos' },
  { code: 'PA', iso3: 'PAN', name: 'Panamá' },
  { code: 'PY', iso3: 'PRY', name: 'Paraguay' },
  { code: 'PE', iso3: 'PER', name: 'Perú' },
  { code: 'PL', iso3: 'POL', name: 'Polonia' },
  { code: 'PT', iso3: 'PRT', name: 'Portugal' },
  { code: 'GB', iso3: 'GBR', name: 'Reino Unido' },
  { code: 'DO', iso3: 'DOM', name: 'República Dominicana' },
  { code: 'CZ', iso3: 'CZE', name: 'República Checa' },
  { code: 'RU', iso3: 'RUS', name: 'Rusia' },
  { code: 'SG', iso3: 'SGP', name: 'Singapur' },
  { code: 'SK', iso3: 'SVK', name: 'Eslovaquia' },
  { code: 'ZA', iso3: 'ZAF', name: 'Sudáfrica' },
  { code: 'SE', iso3: 'SWE', name: 'Suecia' },
  { code: 'CH', iso3: 'CHE', name: 'Suiza' },
  { code: 'TH', iso3: 'THA', name: 'Tailandia' },
  { code: 'TR', iso3: 'TUR', name: 'Turquía' },
  { code: 'UA', iso3: 'UKR', name: 'Ucrania' },
  { code: 'UY', iso3: 'URY', name: 'Uruguay' },
  { code: 'VE', iso3: 'VEN', name: 'Venezuela' },
  { code: 'VN', iso3: 'VNM', name: 'Vietnam' }
];