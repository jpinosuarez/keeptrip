/**
 * Runtime accessor for the pre-processed Country Emblems catalog.
 *
 * The heavy geometry (Natural Earth silhouettes projected to a 256×256 canvas)
 * is generated at BUILD TIME by `scripts/build-country-emblems.mjs` and shipped
 * as static JSON. This module performs ZERO network calls and ZERO Firestore
 * reads — it is a pure, synchronous lookup and is fully available under
 * Kill-Switch levels L1–L4.
 */

import catalogData from './data/countryEmblemsCatalog.json';
import { normalizeCountryCode, getCountryISO3 } from '@shared/lib/utils/countryUtils';

export const COUNTRY_EMBLEM_VIEWBOX = '0 0 256 256';

const CATALOG = catalogData?.countries || {};

// Clean 256×256 geometric shield used for unknown ISO codes.
const FALLBACK_SHIELD =
  'M128,24 L200,52 L200,148 C200,196 166,220 128,232 C90,220 56,196 56,148 L56,52 Z';

// Deterministic, high-contrast fallback palette for codes absent from the catalog.
const FALLBACK_PALETTE = Object.freeze({
  colors: ['#2C3E50', '#45B0A8'],
  proportions: [0.6, 0.4],
  direction: 'horizontal',
  accent: '#45B0A8',
});

const buildFallbackSpec = (iso2) => ({
  iso2: iso2 || null,
  iso3: iso2 ? getCountryISO3(iso2) : null,
  type: 'country',
  continent: 'World',
  isMicrostate: false,
  viewBox: COUNTRY_EMBLEM_VIEWBOX,
  svgPath: FALLBACK_SHIELD,
  palette: {
    ...FALLBACK_PALETTE,
    colors: [...FALLBACK_PALETTE.colors],
    proportions: [...FALLBACK_PALETTE.proportions],
  },
});

/**
 * Resolves a country emblem spec from an ISO-2 or ISO-3 code.
 * Returns the catalog entry when known, or a clean geometric shield fallback.
 *
 * @param {string} codeOrIso - ISO-2 (`AR`) or ISO-3 (`ARG`) country code.
 * @returns {{
 *   iso2: string|null, iso3: string|null, type: 'country', continent: string,
 *   isMicrostate: boolean, viewBox: string, svgPath: string,
 *   palette: { colors: string[], proportions: number[], direction: string, accent: string }
 * }}
 */
export const getCountryEmblemSpec = (codeOrIso) => {
  const iso2 = normalizeCountryCode(codeOrIso);
  if (iso2 && CATALOG[iso2]) return CATALOG[iso2];
  return buildFallbackSpec(iso2);
};

/** Returns every catalog entry as an array (deterministically ISO-2 sorted). */
export const getAllCatalogCountries = () => Object.values(CATALOG);
