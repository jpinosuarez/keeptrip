import i18n from '../../../i18n';
import { normalizeCountryCode } from './countryUtils';

/**
 * Returns a localized country name from i18n namespace "countries".
 * Accepts alpha-2 or alpha-3 ISO codes and normalizes to alpha-2 (territories
 * resolve to their sovereign first, e.g. "FK" → Argentina).
 *
 * Resolution order: project dictionary (countries.json) → native
 * `Intl.DisplayNames` → normalized ISO-2 key. Raw codes like "AI" or "AQ" never
 * leak as unparsed 2-letter strings when the platform can localize them.
 *
 * @param {string} code - ISO 3166-1 alpha-2/alpha-3 country code (e.g. "AR" or "ARG")
 * @param {string} lang - Language code ('es' | 'en')
 * @param {(key: string, options?: object) => string} [t] - Optional translation function
 * @returns {string} Localized country name, or empty string if code is invalid
 */
export const getLocalizedCountryName = (code, lang = 'es', t) => {
  const normalizedCode = normalizeCountryCode(code);
  if (!normalizedCode) return '';

  const key = normalizedCode.toUpperCase();

  // 1) Project dictionaries (countries.json) — never accept the key as a value.
  let dictionaryName = '';
  if (typeof t === 'function') {
    dictionaryName = t(`countries:${key}`, { defaultValue: '' });
  } else {
    dictionaryName = i18n.t(`countries:${key}`, {
      lng: lang,
      defaultValue: '',
    });
  }
  if (dictionaryName && dictionaryName !== key) return dictionaryName;

  // 2) Native Intl region display names (covers AI, AQ, AS, PS, missing keys…).
  try {
    const displayNames = new Intl.DisplayNames([lang || 'es'], { type: 'region' });
    const localized = displayNames.of(key);
    const isUnknownRegion = /unknown|desconocid/i.test(localized || '');
    if (localized && localized !== key && !isUnknownRegion) return localized;
  } catch {
    // Intl unavailable or unsupported locale: fall through to the ISO key.
  }

  // 3) Last resort: normalized ISO-2 code (still never a raw/untrimmed input).
  return key;
};

export const getCountryNameKey = (code) => {
  const normalizedCode = normalizeCountryCode(code);
  return normalizedCode ? `countries:${normalizedCode}` : '';
};
