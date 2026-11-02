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
