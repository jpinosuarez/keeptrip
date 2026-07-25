import { getCountryISO3, getFlagUrl, normalizeCountryCode } from './countryUtils';
import { getLocalizedCountryName } from './countryI18n';

export const EXTERNAL_API_TIMEOUT_MS = 3000;

// ─── Meses abreviados ES/EN para parseo flexible ───
const MESES_ES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
const MESES_EN = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const ALL_MONTHS = { ...MESES_ES, ...MESES_EN };

/**
 * Parsea una fecha flexible (texto libre) → ISO string (YYYY-MM-DD).
 * Acepta: "15/03/2024", "15-03-2024", "15.03.2024", "2024-03-15", "15 Mar 2024", etc.
 * @returns {string|null} ISO date o null si no pudo parsear
 */
export const parseFlexibleDate = (input) => {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  // Helper: construye YYYY-MM-DD sin timezone issues
  const toIso = (y, m, d) => {
    const date = new Date(y, m, d);
    if (isNaN(date) || date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
    return `${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Ya es ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const slashMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return toIso(+y, +m - 1, +d);
  }

  // "DD Mes YYYY" o "DD Mes"
  const currentYear = new Date().getFullYear();
  const textMatch = s.toLowerCase().match(/^(\d{1,2})\s+([a-záéíóú]+)(?:\s+(\d{4}))?$/);
  if (textMatch) {
    const [, d, monthStr, y] = textMatch;
    const month = ALL_MONTHS[monthStr.substring(0, 3)];
    if (month !== undefined) {
      return toIso(y ? +y : currentYear, month, +d);
    }
  }

  // "Mes DD, YYYY" o "Mes DD YYYY"
  const textMatch2 = s.toLowerCase().match(/^([a-záéíóú]+)\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (textMatch2) {
    const [, monthStr, d, y] = textMatch2;
    const month = ALL_MONTHS[monthStr.substring(0, 3)];
    if (month !== undefined) {
      return toIso(y ? +y : currentYear, month, +d);
    }
  }

  return null;
};

/**
 * Formatea una fecha ISO → texto humano corto (ej: "15 mar 2024").
 * @param {string} isoDate YYYY-MM-DD
 * @returns {string}
 */
export const formatDateHuman = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T12:00:00');
  if (isNaN(date)) return isoDate;
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

/**
 * Formatea una fecha ISO → dd/mm/yyyy para inputs de edición.
 * @param {string} isoDate YYYY-MM-DD
 * @returns {string}
 */
export const formatDateSlash = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T12:00:00');
  if (isNaN(date)) return isoDate;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Formatea rango de fechas para display en tarjetas.
 * Acepta ISO (YYYY-MM-DD) o texto flexible. 
 * Ej: "Mar 2024", "15–20 Mar 2024", "15 Mar – 3 Abr 2024"
 */
export const formatDateRange = (start, end) => {
  const toIso = (v) => parseFlexibleDate(v) || v;
  const startIso = toIso(start);
  if (!startIso) return '';
  const fmt = (d) => new Date(d + 'T12:00:00');
  const s = fmt(startIso);
  if (isNaN(s)) return start || '';
  const fmtShort = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
  const fmtYear = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMonthYear = new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' });

  const endIso = toIso(end);
  if (!endIso || startIso === endIso) return fmtYear.format(s);

  const e = fmt(endIso);
  if (isNaN(e)) return fmtYear.format(s);

  // Mismo mes y año → "15–20 Mar 2024"
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${fmtMonthYear.format(s)}`;
  }

  // Distinto mes → "15 Mar – 3 Abr 2024"
  return `${fmtShort.format(s)} – ${fmtYear.format(e)}`;
};

/**
 * Formatea fechas para metadata narrativa de tarjetas.
 * - mismo mes/año: "abril 2026"
 * - distinto mes/mismo año: "abril - mayo 2026"
 * - distinto año: "dic 2025 - ene 2026"
 */
export const formatStorytellingDate = (startDate, endDate, language = 'es') => {
  const locale = language || 'es';
  const toDate = (value) => {
    const iso = parseFlexibleDate(value) || value;
    if (!iso || typeof iso !== 'string') return null;
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const start = toDate(startDate);
  if (!start) return '';

  const end = toDate(endDate);
  const monthLong = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthShort = new Intl.DateTimeFormat(locale, { month: 'short' });

  if (!end) {
    return `${monthLong.format(start)} ${start.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${monthLong.format(start)} ${start.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${monthLong.format(start)} - ${monthLong.format(end)} ${start.getFullYear()}`;
  }

  const normalizeShortMonth = (date) => monthShort.format(date).replace('.', '');
  return `${normalizeShortMonth(start)} ${start.getFullYear()} - ${normalizeShortMonth(end)} ${end.getFullYear()}`;
};

/**
 * Resume ciudades para pills de metadata.
 */
export const formatCitiesSummary = (paradas = [], t) => {
  const translate =
    typeof t === 'function'
      ? t
      : (key, options = {}) => {
          if (key === 'and') return options.defaultValue ?? '&';
          if (key === 'andMore') {
            const city = options.city ?? '';
            const count = Number(options.count) || 0;
            return `${city} & ${count} more`;
          }
          return options.defaultValue ?? key;
        };

  const cityNames = [...new Set(
    (Array.isArray(paradas) ? paradas : [])
      .map((parada) => {
        if (typeof parada === 'string') return parada.trim();
        if (!parada || typeof parada !== 'object') return '';
        return String(parada.nombre || parada.name || parada.city || '').trim();
      })
      .filter(Boolean)
  )];

  if (cityNames.length === 0) return '';
  if (cityNames.length === 1) return cityNames[0];
  if (cityNames.length === 2) {
    return `${cityNames[0]} ${translate('and', { ns: 'common', defaultValue: '&' })} ${cityNames[1]}`;
  }

  return translate('andMore', {
    ns: 'common',
    city: cityNames[0],
    count: cityNames.length - 1,
    defaultValue: '{{city}} & {{count}} more',
  });
};

/**
 * Calcula duración inclusiva del viaje.
 */
export const calculateTripDays = (startDate, endDate) => {
  const toDate = (value) => {
    const iso = parseFlexibleDate(value) || value;
    if (!iso || typeof iso !== 'string') return null;
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const start = toDate(startDate);
  if (!start) return 0;

  const end = toDate(endDate);
  if (!end) return 1;

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / 86400000) + 1;
  return Math.max(1, diffInDays);
};


export const FOTO_DEFAULT_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%231f2937'/><stop offset='100%' stop-color='%230f766e'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><circle cx='180' cy='160' r='90' fill='rgba(255,255,255,0.15)'/><path d='M100 650 L420 360 L600 560 L780 420 L1100 700 L100 700 Z' fill='rgba(255,255,255,0.18)'/><text x='80' y='120' fill='white' font-size='56' font-family='Arial, sans-serif' opacity='0.9'>Viaje</text></svg>";

export const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

export const construirBitacoraData = (viajes = [], todasLasParadas = []) => {
  const stopsByTrip = new Map();

  (Array.isArray(todasLasParadas) ? todasLasParadas : []).forEach((parada) => {
    const tripId = parada?.viajeId;
    if (!tripId) return;
    const currentStops = stopsByTrip.get(tripId) || [];
    currentStops.push(parada);
    stopsByTrip.set(tripId, currentStops);
  });

  return viajes.reduce((acc, viaje) => {
    acc[viaje.id] = {
      ...viaje,
      paradas: stopsByTrip.get(viaje.id) || [],
    };
    return acc;
  }, {});
};

export const obtenerPaisesVisitados = (bitacora = [], todasLasParadas = []) => {
  const codigos = new Set();
  const viajesConParadas = new Set();

  todasLasParadas.forEach((parada) => {
    if (parada.viajeId) viajesConParadas.add(parada.viajeId);
    if (parada.tripId) viajesConParadas.add(parada.tripId);
    const iso3 = getCountryISO3(parada.paisCodigo);
    if (iso3) codigos.add(iso3);
  });

  bitacora.forEach((viaje) => {
    if (!viajesConParadas.has(viaje.id)) {
      const iso3 = getCountryISO3(viaje.code);
      if (iso3) codigos.add(iso3);
    }
  });

  return [...codigos].filter(Boolean);
};

const AUTO_TITLE_FALLBACK = {
  'editor.autoTitle.empty': () => 'Borrador de viaje',
  'editor.autoTitle.single': ({ city }) => `Viaje a ${city}`,
  'editor.autoTitle.twoCities': ({ city1, city2 }) => `Viaje a ${city1} y ${city2}`,
  'editor.autoTitle.twoCountries': ({ country1, country2 }) => `Viaje por ${country1} y ${country2}`,
  'editor.autoTitle.countryTour': ({ country }) => `Gran tour por ${country}`,
  'editor.autoTitle.multiCountry': ({ countries }) => `Aventura por ${countries}`,
  'editor.autoTitle.expedition': ({ country1, country2 }) => `Expedición por ${country1}, ${country2} y más destinos`,
};

export const generarTituloInteligente = (paradas = [], t, language = 'es') => {
  const translate = (key, options = {}) => {
    if (typeof t === 'function') {
      const result = t(key, options);
      // If i18next can't find the key, it returns the key string itself. We catch that here:
      if (result !== key) return result;
    }
    // Fallback
    const fallback = AUTO_TITLE_FALLBACK[key];
    return typeof fallback === 'function' ? fallback(options) : (fallback || key);
  };

  if (!paradas || paradas.length === 0) {
    return translate('editor.autoTitle.empty');
  }

  const resolveCountryName = (code) => {
    const normalizedCode = normalizeCountryCode(code);
    if (!normalizedCode) return '';
    const localized = typeof t === 'function'
      ? getLocalizedCountryName(normalizedCode, language, translate)
      : getLocalizedCountryName(normalizedCode, language);
    return localized && localized !== normalizedCode ? localized : normalizedCode;
  };

  const ciudadesUnicas = [...new Set(paradas.map((p) => p.nombre).filter(Boolean))];
  const paisesUnicos = [...new Set(paradas.map((p) => p.paisCodigo).filter(Boolean))];
  const nombresPaises = paisesUnicos.map((c) => resolveCountryName(c)).filter(Boolean);

  // 1 stop
  if (ciudadesUnicas.length === 1) {
    return translate('editor.autoTitle.single', { city: ciudadesUnicas[0] });
  }

  // 2 stops
  if (ciudadesUnicas.length === 2) {
    if (paisesUnicos.length === 1) {
      // Same country
      return translate('editor.autoTitle.twoCities', { city1: ciudadesUnicas[0], city2: ciudadesUnicas[1] });
    } else {
      // Different countries
      if (nombresPaises.length === 2) {
        return translate('editor.autoTitle.twoCountries', { country1: nombresPaises[0], country2: nombresPaises[1] });
      }
    }
  }

  // 3+ stops
  if (paisesUnicos.length === 1) {
    // All same country
    return translate('editor.autoTitle.countryTour', { country: nombresPaises[0] });
  }

  if (paisesUnicos.length >= 2 && paisesUnicos.length <= 3) {
    const listFormat = new Intl.ListFormat(language, { style: 'long', type: 'conjunction' });
    const formattedList = listFormat.format(nombresPaises);
    return translate('editor.autoTitle.multiCountry', { countries: formattedList });
  }

  if (paisesUnicos.length > 3) {
    return translate('editor.autoTitle.expedition', { country1: nombresPaises[0], country2: nombresPaises[1] });
  }

  // Fallback
  return translate('editor.autoTitle.empty');
};

export const construirBanderasViaje = (codigoPaisBase, paradas = []) => {
  const banderasParadas = paradas.map((parada) => getFlagUrl(parada.paisCodigo)).filter(Boolean);
  const banderasBase = [getFlagUrl(codigoPaisBase)].filter(Boolean);
  return banderasParadas.length > 0 ? [...new Set(banderasParadas)] : banderasBase;
};

export const construirCiudadesViaje = (paradas = []) => [...new Set(paradas.map((p) => p.nombre))].join(', ');

/**
 * Obtiene iniciales (máx 2 caracteres) de un nombre o email.
 * - Nombre: "Juan Pérez" → "JP"
 * - Email: "juan@gmail.com" → "J"
 * - Vacío/null: "?"
 */
export const getInitials = (nameOrEmail) => {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return '?';
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return '?';
  // Es email → primera letra del local-part
  if (trimmed.includes('@')) {
    return trimmed.split('@')[0][0]?.toUpperCase() || '?';
  }
  // Es nombre → primeras letras de cada palabra (máx 2)
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
};

export const construirParadaPayload = (parada, fechaUso, climaInfo) => ({
  nombre: parada.nombre,
  coordenadas: parada.coordenadas,
  fecha: fechaUso,
  fechaLlegada: parseFlexibleDate(parada.fechaLlegada) || parada.fechaLlegada || '',
  fechaSalida: parseFlexibleDate(parada.fechaSalida) || parada.fechaSalida || '',
  paisCodigo: parada.paisCodigo || '',
  clima: climaInfo,
  tipo: 'place',
  // Nuevos campos para storytelling/logística
  transporte: parada.transporte || null,
  notaCorta: parada.notaCorta || null
});

export const construirViajePayload = ({
  datosViaje,
  titulo,
  banderas,
  ciudades,
  foto,
  fotoCredito,
  ownerId = null,
}) => {
  const hoy = getTodayIsoDate();

  return {
    code: datosViaje.code || '',
    nombreEspanol: datosViaje.nombreEspanol || 'Viaje',
    titulo: datosViaje.titulo || titulo,
    ownerId,
    fechaInicio: datosViaje.fechaInicio || hoy,
    fechaFin: datosViaje.fechaFin || hoy,
    texto: datosViaje.texto || '',
    rating: 5,
    foto: foto || FOTO_DEFAULT_URL,
    fotoCredito: fotoCredito || null,
    // Storytelling fields (passthrough desde formData)
    presupuesto: datosViaje.presupuesto || null,
    vibe: datosViaje.vibe || [],
    highlights: datosViaje.highlights || null,
    companions: datosViaje.companions || [],
    banderas,
    ciudades
  };
};
