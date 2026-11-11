import { describe, it, expect } from 'vitest';
import { buildTripStoryDeck, formatKmLabel, getHomeConnectionStatus } from './buildTripStoryDeck';

const baseViaje = {
  id: 't1',
  titulo: 'Ruta España',
  fechaInicio: '2026-05-01',
  fechaFin: '2026-05-10',
  paisCodigo: 'ES',
};

const eightStops = Array.from({ length: 8 }, (_, index) => ({
  id: `s${index}`,
  nombre: `Stop ${index + 1}`,
  coordenadas: [index, index],
  fechaLlegada: '2026-05-01',
  fechaSalida: '2026-05-02',
}));

describe('buildTripStoryDeck', () => {
  it('always produces at least 3 slides (cover, route, finale) even without stops', () => {
    const deck = buildTripStoryDeck({ viaje: baseViaje, paradasOrdenadas: [], photos: [] });

    expect(deck.length).toBe(3);
    expect(deck.map((slide) => slide.type)).toEqual(['cover', 'route', 'finale']);
  });

  it('never exceeds 7 slides and caps stop slides with a context slide present', () => {
    const deck = buildTripStoryDeck({
      viaje: { ...baseViaje, highlights: { topFood: 'Paella' }, companions: [{ name: 'Ana' }] },
      paradasOrdenadas: eightStops,
      photos: [{ url: 'https://example.com/1.jpg' }],
      telemetry: { totalKm: 1240, totalDays: 10, totalStops: 8 },
    });

    expect(deck.length).toBe(7);
    expect(deck.map((slide) => slide.type)).toEqual([
      'cover',
      'route',
      'stop',
      'stop',
      'stop',
      'context',
      'finale',
    ]);
  });

  it('omits the context slide when no highlights, companions or weather exist', () => {
    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: [{ id: 'a', nombre: 'Madrid' }],
      photos: [],
    });

    expect(deck.some((slide) => slide.type === 'context')).toBe(false);
  });

  it('STOP-FIRST: cover/route slides ignore stale root country (HU/CZ vs DE)', () => {
    const deck = buildTripStoryDeck({
      viaje: { ...baseViaje, paisCodigo: 'DE' },
      paradasOrdenadas: [
        { id: 'budapest', nombre: 'Budapest', paisCodigo: 'HU' },
        { id: 'praga', nombre: 'Praga', countryCode: 'CZ' },
      ],
      photos: [],
    });

    const cover = deck.find((slide) => slide.type === 'cover');
    const route = deck.find((slide) => slide.type === 'route');

    expect(cover.countryCode).toBe('HU');
    expect(route.countryCode).toBe('HU');
    expect(cover.countryCode).not.toBe('DE');
    expect(route.countryCode).not.toBe('DE');
  });

  it('adds the day-trip badge for a nested excursion inside the base stay', () => {
    const base = {
      id: 'madrid',
      nombre: 'Madrid',
      fechaLlegada: '2026-05-01',
      fechaSalida: '2026-05-10',
    };
    const excursion = {
      id: 'toledo',
      nombre: 'Toledo',
      fechaLlegada: '2026-05-04',
      fechaSalida: '2026-05-04',
    };

    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: [base, excursion],
      photos: [],
    });

    const stopSlides = deck.filter((slide) => slide.type === 'stop');
    expect(stopSlides).toHaveLength(2);
    expect(stopSlides[0].dayTripFrom).toBeNull();
    expect(stopSlides[1].dayTripFrom).toBe('Madrid');
  });

  it('computes the finale XP from stops and photos', () => {
    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: [{ id: 'a' }, { id: 'b' }],
      photos: [{ url: 'https://example.com/1.jpg' }],
    });

    const finale = deck.find((slide) => slide.type === 'finale');
    expect(finale.xp).toBe(100 + 2 * 50 + 1 * 10);
  });

  it('formats kilometres with Spanish thousands separators', () => {
    expect(formatKmLabel(1240)).toBe('1.240 km');
    expect(formatKmLabel(0)).toBe('0 km');
  });
});

describe('getHomeConnectionStatus', () => {
  it('returns null without a user profile', () => {
    expect(getHomeConnectionStatus({ viaje: baseViaje, paradasOrdenadas: [] })).toBeNull();
  });

  it('marks a local adventure when the trip country matches residence', () => {
    expect(
      getHomeConnectionStatus({
        viaje: baseViaje,
        paradasOrdenadas: [],
        userProfile: { residenceCountry: 'ES' },
      })
    ).toEqual({ type: 'local' });
  });

  it('marks distance from base city for international trips', () => {
    const status = getHomeConnectionStatus({
      viaje: { ...baseViaje, paisCodigo: 'FR' },
      paradasOrdenadas: [{ coordenadas: [2.35, 48.85] }],
      userProfile: {
        residenceCountry: 'ES',
        baseCity: { name: 'Madrid', coordinates: [-3.7, 40.4] },
      },
    });

    expect(status.type).toBe('distance');
    expect(status.distanceKm).toBeGreaterThan(1000);
    expect(status.baseCityName).toBe('Madrid');
  });
});

describe('buildTripStoryDeck · memory mode', () => {
  const memoryStops = [
    { id: 's1', nombre: 'Madrid', fechaLlegada: '2026-05-01', fechaSalida: '2026-05-03', esFavorita: true, vibes: ['tapas'], lugares: [{ id: 'p1', nombre: 'Mercado', categoria: 'gastronomia' }] },
    { id: 's2', nombre: 'Toledo', fechaLlegada: '2026-05-04', fechaSalida: '2026-05-04' },
    { id: 's3', nombre: 'Valencia', fechaLlegada: '2026-05-05', fechaSalida: '2026-05-07' },
    { id: 's4', nombre: 'Sevilla', fechaLlegada: '2026-05-08', fechaSalida: '2026-05-10' },
  ];

  const memoryPhotos = [
    { id: 'photo-1', url: 'https://example.com/madrid.jpg', paradaId: 's1' },
    { id: 'photo-2', url: 'https://example.com/toledo.jpg', paradaId: 's2' },
  ];

  const memoryCapsule = {
    tripId: 't1',
    stopId: 's1',
    matchType: 'exact_day',
    tierLevel: 1,
    yearsAgo: 2,
    stopCity: 'Madrid',
    tripTitle: 'Ruta España',
    countryCodes: ['ES'],
    coverUrl: 'https://example.com/cover.jpg',
    headline: 'Tarde de tapas',
    highlights: { topFood: 'Paella', topView: 'Sagrada', topTip: null },
    companions: ['Ana'],
    tripDateRange: { start: '2026-05-01', end: '2026-05-10' },
    deepLink: '/dashboard?memory=t1&stop=s1',
  };

  it('builds a max-6-slide memory deck with cover, matched stop, trilogy and closing', () => {
    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: memoryStops,
      photos: memoryPhotos,
      mode: 'memory',
      memoryCapsule,
    });

    expect(deck.length).toBeLessThanOrEqual(6);
    expect(deck.map((slide) => slide.type)).toEqual([
      'memory-cover',
      'stop',
      'stop',
      'stop',
      'trilogy',
      'closing',
    ]);

    const cover = deck[0];
    expect(cover.memoryBadge).toEqual({ matchType: 'exact_day', yearsAgo: 2, tierLevel: 1 });
    expect(cover.kenBurnsEffect).toBe(true);
    expect(cover.headline).toBe('Tarde de tapas');
    expect(cover.companions).toEqual(['Ana']);
    expect(cover.countryCode).toBe('ES');
    expect(cover.countryCodes).toEqual(['ES']);
    expect(cover.deepLink).toBe('/dashboard?memory=t1&stop=s1');
    expect(cover.image).toBe('https://example.com/cover.jpg');

    const firstStop = deck[1];
    expect(firstStop.isMemoryStop).toBe(true);
    expect(firstStop.memoryStopId).toBe('s1');
    expect(firstStop.title).toBe('Madrid');
    expect(firstStop.photos).toEqual(['https://example.com/madrid.jpg']);
    expect(firstStop.image).toBe('https://example.com/madrid.jpg');
    expect(firstStop.favorite).toBe(true);
    expect(firstStop.vibes).toEqual(['tapas']);
    expect(firstStop.lugares[0]).toMatchObject({ nombre: 'Mercado', emoji: '🍽️' });

    const complementary = deck.slice(2, 4);
    expect(complementary.every((slide) => slide.isMemoryStop === false)).toBe(true);
    expect(complementary.map((slide) => slide.title)).toEqual(['Toledo', 'Valencia']);

    const trilogy = deck.find((slide) => slide.type === 'trilogy');
    expect(trilogy.highlights).toEqual({ topFood: 'Paella', topView: 'Sagrada', topTip: null });
    expect(trilogy.icons).toEqual({ topFood: '🍽️', topView: '🌅', topTip: '✨' });

    const closing = deck[deck.length - 1];
    expect(closing.type).toBe('closing');
    expect(closing.fullTripUrl).toBe('/trips/t1');
    expect(closing.isMemoryMode).toBe(true);
    expect(typeof closing.xpEarned).toBe('number');
  });

  it('omits the trilogy slide when the trip has no curated highlights', () => {
    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: memoryStops,
      photos: memoryPhotos,
      mode: 'memory',
      memoryCapsule: { ...memoryCapsule, highlights: {} },
    });

    expect(deck.map((slide) => slide.type)).toEqual(['memory-cover', 'stop', 'stop', 'stop', 'closing']);
    expect(deck.length).toBe(5);
  });

  it('falls back to the default deck when mode is memory but no capsule is provided', () => {
    const deck = buildTripStoryDeck({
      viaje: baseViaje,
      paradasOrdenadas: [],
      photos: [],
      mode: 'memory',
      memoryCapsule: null,
    });

    expect(deck.map((slide) => slide.type)).toEqual(['cover', 'route', 'finale']);
  });
});

