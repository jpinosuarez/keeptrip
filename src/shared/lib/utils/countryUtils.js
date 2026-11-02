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