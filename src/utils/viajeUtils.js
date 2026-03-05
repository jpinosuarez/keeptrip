import { getCountryISO3, getCountryName, getFlagUrl } from './countryUtils';

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

export const FOTO_DEFAULT_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%231f2937'/><stop offset='100%' stop-color='%230f766e'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><circle cx='180' cy='160' r='90' fill='rgba(255,255,255,0.15)'/><path d='M100 650 L420 360 L600 560 L780 420 L1100 700 L100 700 Z' fill='rgba(255,255,255,0.18)'/><text x='80' y='120' fill='white' font-size='56' font-family='Arial, sans-serif' opacity='0.9'>Viaje</text></svg>";

export const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

export const construirBitacoraData = (viajes = []) =>
  viajes.reduce((acc, viaje) => {
    acc[viaje.id] = { ...viaje };
    return acc;
  }, {});

export const obtenerPaisesVisitados = (bitacora = [], todasLasParadas = []) => {
  const codigos = new Set();

  bitacora.forEach((viaje) => {
    const iso3 = getCountryISO3(viaje.code);
    if (iso3) codigos.add(iso3);
  });

  todasLasParadas.forEach((parada) => {
    const iso3 = getCountryISO3(parada.paisCodigo);
    if (iso3) codigos.add(iso3);
  });

  return [...codigos].filter(Boolean);
};

export const generarTituloInteligente = (nombreBase, paradas = []) => {
  if (!paradas || paradas.length === 0) return nombreBase || 'Nuevo Viaje';

  const ciudadesUnicas = [...new Set(paradas.map((p) => p.nombre).filter(Boolean))];
  const paisesUnicos = [...new Set(paradas.map((p) => p.paisCodigo).filter(Boolean))];

  // Si hay exactamente 2 países distintos, priorizar ese título (ej: España y Francia)
  if (paisesUnicos.length === 2) {
    const nombresPaises = paisesUnicos.map((c) => getCountryName(c)).filter(Boolean);
    if (nombresPaises.length === 2) return `Aventura entre ${nombresPaises[0]} y ${nombresPaises[1]}`;
  }

  // Priorizar títulos por ciudad cuando quedan claros y cortos
  if (ciudadesUnicas.length === 1) return `Escapada a ${ciudadesUnicas[0]}`;
  if (ciudadesUnicas.length === 2) return `${ciudadesUnicas[0]} y ${ciudadesUnicas[1]}`;

  // Construir nombres de países legibles
  const nombresPaises = paisesUnicos.map((c) => getCountryName(c)).filter(Boolean);

  // Reglas de storytelling por país
  if (paisesUnicos.length === 1) {
    const nombrePais = nombresPaises[0] || nombreBase;
    return `Ruta por ${nombrePais}`; // claro y directo
  }

  if (paisesUnicos.length === 3) {
    // Listado evocador pero legible
    return `Travesía por ${nombresPaises.join(', ')}`;
  }

  if (paisesUnicos.length > 3) {
    // Mantener título corto y sugerir escala
    const firstTwo = nombresPaises.slice(0, 2).join(', ');
    const others = nombresPaises.length - 2;
    return `Gran travesía por ${firstTwo} y ${others} más`;
  }

  return nombreBase || 'Nuevo Viaje';
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
  fotoCredito
}) => {
  const hoy = getTodayIsoDate();

  return {
    code: datosViaje.code || '',
    nombreEspanol: datosViaje.nombreEspanol || 'Viaje',
    titulo: datosViaje.titulo || titulo,
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
