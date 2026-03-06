import { COUNTRIES_DB } from '../assets/sellos/index';

const indexByCode = Object.fromEntries(COUNTRIES_DB.map(c => [c.code, c]));

/**
 * Returns the localized country name based on language.
 * @param {string} code - ISO 3166-1 alpha-3 country code (e.g. "ARG")
 * @param {string} lang - Language code ('es' | 'en')
 * @returns {string} Localized country name, or the code if not found.
 */
export const getLocalizedCountryName = (code, lang = 'es') => {
  const country = indexByCode[code];
  if (!country) return code;
  return lang === 'es' ? country.nombreEspanol : country.name;
};
