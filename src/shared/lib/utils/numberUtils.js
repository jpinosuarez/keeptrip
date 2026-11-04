/**
 * numberUtils — locale-aware numeric formatting (Block 2.3 refinement).
 *
 * NOTE: Spanish (es-*) CLDR sets `minimumGroupingDigits: 2`, so a bare
 * `Intl.NumberFormat('es-ES').format(3304)` returns "3304". Passing
 * `useGrouping: true` explicitly forces grouping and yields "3.304".
 */

const resolveLocale = (language) =>
  typeof language === 'string' && language.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES';

export const formatLocalizedNumber = (value, language = 'es', { decimals = 0 } = {}) => {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const fractionDigits = Number.isFinite(decimals) && decimals > 0 ? Math.trunc(decimals) : 0;

  return new Intl.NumberFormat(resolveLocale(language), {
    useGrouping: true,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};

export const formatKmValue = (value, language = 'es') =>
  formatLocalizedNumber(value, language, { decimals: 0 });
