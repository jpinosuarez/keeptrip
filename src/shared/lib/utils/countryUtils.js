// Fuente de verdad para banderas y códigos.
// Usamos flagcdn.com para asegurar compatibilidad total (Windows/Mac/Android).

export const getFlagUrl = (countryCode) => {
  if (!countryCode) return null;
  // flagcdn usa códigos de 2 letras en minúscula
  return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
};

// Convierte código Alpha-2 (ej: AR) a Alpha-3 (ej: ARG) para Mapbox
export const getCountryISO3 = (code2) => {
  if (!code2) return null;
  const country = COUNTRIES_DATA.find(c => c.code === code2.toUpperCase());
  return country ? country.iso3 : code2.toUpperCase();
};

export const getCountryName = (code) => {
  if (!code) return '';
  const country = COUNTRIES_DATA.find(c => c.code === code.toUpperCase() || c.iso3 === code.toUpperCase());
  return country ? country.name : code;
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