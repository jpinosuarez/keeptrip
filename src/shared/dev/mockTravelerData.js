// src/shared/dev/mockTravelerData.js
/**
 * Deterministic mock personas for the DEV data seeder.
 *
 * Every coordinate follows the canonical city record order `[lng, lat]`
 * (see `@shared/lib/geo` + `haversineKm`), so the Block 2.3 analytics engine
 * (poles, odometer, seasonality, continents) computes real values out of the box.
 */
import { MOCK_TRIPS_RICH } from './mockRichTrips';

/** Fixed timestamp so seeded documents stay deterministic across runs/tests. */
export const MOCK_UPDATED_AT = new Date('2026-01-01T00:00:00.000Z');

export const DEV_SCENARIOS = ['empty', 'mateo', 'rich'];

/* ── Persona: Mateo (expat, roots in Bariloche, base in Berlin) ──────────── */
const MATEO_PROFILE = {
  displayName: 'Mateo (Dev)',
  birthCountry: 'AR',
  residenceCountry: 'DE',
  birthCity: {
    name: 'Bariloche',
    coordinates: [-71.3082, -41.1335],
    countryCode: 'AR'
  },
  baseCity: {
    name: 'Berlín',
    coordinates: [13.405, 52.52],
    countryCode: 'DE'
  },
  hasCompletedOnboarding: true,
  updatedAt: MOCK_UPDATED_AT
};

/* ── Persona: Valeria "Trotamundos" (rich dataset, 2023-2026, 5 continents) ─ */
const RICH_PROFILE = {
  displayName: 'Valeria (Dev)',
  birthCountry: 'AR',
  residenceCountry: 'DE',
  birthCity: {
    name: 'Buenos Aires',
    coordinates: [-58.3816, -34.6037],
    countryCode: 'AR'
  },
  baseCity: {
    name: 'Berlín',
    coordinates: [13.405, 52.52],
    countryCode: 'DE'
  },
  hasCompletedOnboarding: true,
  updatedAt: MOCK_UPDATED_AT
};

/* ── Persona: brand-new explorer (empty archive + onboarding pending) ────── */
const EMPTY_PROFILE = {
  displayName: 'Nuevo Explorador (Dev)',
  hasCompletedOnboarding: false,
  updatedAt: MOCK_UPDATED_AT
};

export const MOCK_USER_PROFILES = {
  empty: EMPTY_PROFILE,
  mateo: MATEO_PROFILE,
  rich: RICH_PROFILE
};

/* ── Trips: Mateo (3 trips) ──────────────────────────────────────────────── */
export const MOCK_TRIPS_MATEO = [
  {
    id: 'trip-europa-central',
    titulo: 'Viaje por Hungría y Chequia',
    destino: 'Budapest & Praga',
    fechaInicio: '2026-10-01',
    fechaFin: '2026-10-09',
    paisCodigo: 'HU',
    banderas: ['https://flagcdn.com/w40/hu.png', 'https://flagcdn.com/w40/cz.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&auto=format&fit=crop&q=80',
    texto: 'Una travesía inolvidable recorriendo el Danubio y Bohemia.',
    highlights: {
      topFood: 'Goulash tradicional',
      topView: 'Puente de Carlos al amanecer',
      topTip: 'Caminar temprano para evitar multitudes'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Cultural', 'Fotografía'],
    paradas: [
      {
        id: 'stop-budapest',
        nombre: 'Budapest',
        ciudad: 'Budapest',
        paisCodigo: 'HU',
        coordenadas: [19.0402, 47.4979],
        fechaLlegada: '2026-10-01',
        fechaSalida: '2026-10-04',
        nota: 'Termas Széchenyi y vistas del Parlamento.',
        orden: 1
      },
      {
        id: 'stop-praga',
        nombre: 'Praga',
        ciudad: 'Praga',
        paisCodigo: 'CZ',
        coordenadas: [14.4378, 50.0755],
        fechaLlegada: '2026-10-04',
        fechaSalida: '2026-10-09',
        nota: 'Castillo y callejones medievales.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-alemania-local',
    titulo: 'Aventura en Baviera',
    destino: 'Múnich',
    fechaInicio: '2025-06-10',
    fechaFin: '2025-06-18',
    paisCodigo: 'DE',
    banderas: ['https://flagcdn.com/w40/de.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&auto=format&fit=crop&q=80',
    texto: 'Escapada local explorando los castillos del sur.',
    highlights: {
      topFood: 'Pretzel con mostaza dulce',
      topView: 'Neuschwanstein',
      topTip: 'Comprar billete regional de tren'
    },
    companions: [],
    vibe: ['Naturaleza'],
    paradas: [
      {
        id: 'stop-munich',
        nombre: 'Múnich',
        ciudad: 'Múnich',
        paisCodigo: 'DE',
        coordenadas: [11.582, 48.1351],
        fechaLlegada: '2025-06-10',
        fechaSalida: '2025-06-18',
        nota: 'Marienplatz y jardines cerveceros.',
        orden: 1
      }
    ]
  },
  {
    id: 'trip-patagonia-sur',
    titulo: 'Ruta Austral en Patagonia',
    destino: 'Ushuaia',
    fechaInicio: '2024-01-05',
    fechaFin: '2024-01-20',
    paisCodigo: 'AR',
    banderas: ['https://flagcdn.com/w40/ar.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=80',
    texto: 'Viaje al fin del mundo recorriendo glaciares.',
    highlights: {
      topFood: 'Cordero fueguino',
      topView: 'Canal Beagle',
      topTip: 'Ropa en capas impermeables'
    },
    companions: [{ name: 'Familia', status: 'accepted' }],
    vibe: ['Aventura', 'Naturaleza'],
    paradas: [
      {
        id: 'stop-bariloche',
        nombre: 'Bariloche',
        ciudad: 'Bariloche',
        paisCodigo: 'AR',
        coordenadas: [-71.3082, -41.1335],
        fechaLlegada: '2024-01-05',
        fechaSalida: '2024-01-10',
        nota: 'Lagos y Circuito Chico.',
        orden: 1
      },
      {
        id: 'stop-ushuaia',
        nombre: 'Ushuaia',
        ciudad: 'Ushuaia',
        paisCodigo: 'AR',
        coordenadas: [-68.303, -54.8019],
        fechaLlegada: '2024-01-10',
        fechaSalida: '2024-01-20',
        nota: 'Faro Les Éclaireurs y Parque Nacional.',
        orden: 2
      }
    ]
  }
];

/* ── Scenario registry ───────────────────────────────────────────────────── */

/** Trips keyed by DEV scenario (`empty` ships an intentionally empty archive). */
export const MOCK_TRIPS_BY_SCENARIO = {
  empty: [],
  mateo: MOCK_TRIPS_MATEO,
  rich: MOCK_TRIPS_RICH
};

/* Backwards-compatible aliases for the previous single-persona API. */
export const MOCK_USER_PROFILE = MOCK_USER_PROFILES.mateo;
export const MOCK_TRIPS = MOCK_TRIPS_MATEO;

export { MOCK_TRIPS_RICH };

export default {
  DEV_SCENARIOS,
  MOCK_UPDATED_AT,
  MOCK_USER_PROFILES,
  MOCK_TRIPS_BY_SCENARIO,
  MOCK_TRIPS_MATEO,
  MOCK_TRIPS_RICH
};
