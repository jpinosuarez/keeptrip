import { describe, it, expect } from 'vitest';
import { ViajeSchemaBase, ParadaSchema, validarParada, validarViaje, validarParadasEnViaje, validarCoordenadas } from './viajeSchema';

describe('viajeSchema - nuevos campos de storytelling y sharing', () => {
  it('ViajeSchemaBase acepta campos: presupuesto, vibe, highlights, companions, sharedWith', () => {
    const sample = {
      code: 'AR',
      nombreEspanol: 'Argentina',
      titulo: 'Roadtrip por la Patagonia',
      fechaInicio: '2025-01-10',
      fechaFin: '2025-01-20',
      presupuesto: 'Mochilero',
      vibe: ['Aventura', 'Naturaleza'],
      highlights: { topFood: 'Asado', topView: 'Fitz Roy', topTip: 'Ir temprano' },
      companions: [{ name: 'María', email: 'maria@example.com', status: 'pending' }],
      sharedWith: ['uid-123'],
      fotoCredito: null
    };

    const parsed = ViajeSchemaBase.parse(sample);
    expect(parsed.presupuesto).toBe('Mochilero');
    expect(parsed.vibe).toEqual(['Aventura', 'Naturaleza']);
    expect(parsed.highlights.topView).toBe('Fitz Roy');
    expect(Array.isArray(parsed.companions)).toBe(true);
    expect(parsed.sharedWith).toEqual(['uid-123']);
  });

  it('ParadaSchema acepta transporte y notaCorta', () => {
    const p = {
      nombre: 'El Calafate',
      coordenadas: [-72.27, -50.33],
      fecha: '2025-01-12',
      transporte: 'auto',
      notaCorta: 'Noche increíble con estrellas'
    };

    const parsed = ParadaSchema.parse(p);
    expect(parsed.transporte).toBe('auto');
    expect(parsed.notaCorta).toBe('Noche increíble con estrellas');
  });

  it('validarParada reconoce parada válida con transporte', () => {
    const resultado = validarParada({
      nombre: 'Test',
      coordenadas: [0, 0],
      transporte: 'bus'
    });
    expect(resultado.esValido).toBe(true);
  });

  it('validarViaje acepta objeto minimal que incluye nuevos campos (no estricta)', () => {
    const datos = {
      code: 'AR',
      nombreEspanol: 'Argentina',
      titulo: 'Corto',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-02-05',
      vibe: ['Relax']
    };

    const resultado = validarViaje(datos, false);
    expect(resultado.esValido).toBe(true);
  });
});

describe('ParadaSchema & validarParadasEnViaje - superposición y límites maestros', () => {
  it('ParadaSchema rechaza fechaSalida anterior a fechaLlegada', () => {
    const paradaInvalida = {
      nombre: 'Madrid',
      coordenadas: [40.4168, -3.7038],
      fechaLlegada: '2026-05-10',
      fechaSalida: '2026-05-01'
    };

    const resultado = validarParada(paradaInvalida);
    expect(resultado.esValido).toBe(false);
    expect(resultado.mensaje).toContain('fecha de salida');
  });

  it('ParadaSchema rechaza fechaSalida anterior a fecha (legacy key)', () => {
    const paradaInvalida = {
      nombre: 'Madrid',
      coordenadas: [40.4168, -3.7038],
      fecha: '2026-05-10',
      fechaSalida: '2026-05-01'
    };

    const resultado = validarParada(paradaInvalida);
    expect(resultado.esValido).toBe(false);
    expect(resultado.mensaje).toContain('fecha de salida');
  });

  it('ParadaSchema acepta parada de un solo día (fechaLlegada === fechaSalida)', () => {
    const paradaUnDia = {
      nombre: 'Toledo',
      coordenadas: [39.8628, -4.0273],
      fechaLlegada: '2026-05-04',
      fechaSalida: '2026-05-04'
    };

    const resultado = validarParada(paradaUnDia);
    expect(resultado.esValido).toBe(true);
  });

  it('validarParadasEnViaje permite paradas superpuestas y excursiones contenidas dentro del rango del viaje', () => {
    const paradas = [
      {
        nombre: 'Madrid (Base)',
        coordenadas: [40.4168, -3.7038],
        fechaLlegada: '2026-05-01',
        fechaSalida: '2026-05-10'
      },
      {
        nombre: 'Toledo (Excursión)',
        coordenadas: [39.8628, -4.0273],
        fechaLlegada: '2026-05-04',
        fechaSalida: '2026-05-04'
      },
      {
        nombre: 'Segovia (Excursión)',
        coordenadas: [40.9429, -4.1088],
        fechaLlegada: '2026-05-06',
        fechaSalida: '2026-05-07'
      }
    ];

    const viajeFechas = { fechaInicio: '2026-05-01', fechaFin: '2026-05-10' };
    const resultado = validarParadasEnViaje(paradas, viajeFechas);
    expect(resultado.esValido).toBe(true);
  });

  it('validarParadasEnViaje rechaza paradas antes del inicio general del viaje', () => {
    const paradas = [
      {
        nombre: 'Toledo Temprano',
        coordenadas: [39.8628, -4.0273],
        fechaLlegada: '2026-04-28',
        fechaSalida: '2026-04-30'
      }
    ];

    const viajeFechas = { fechaInicio: '2026-05-01', fechaFin: '2026-05-10' };
    const resultado = validarParadasEnViaje(paradas, viajeFechas);
    expect(resultado.esValido).toBe(false);
    expect(resultado.mensaje).toContain('no puede comenzar antes');
  });

  it('validarParadasEnViaje rechaza paradas después del fin general del viaje', () => {
    const paradas = [
      {
        nombre: 'Valencia Tardía',
        coordenadas: [39.4699, -0.3763],
        fechaLlegada: '2026-05-09',
        fechaSalida: '2026-05-12'
      }
    ];

    const viajeFechas = { fechaInicio: '2026-05-01', fechaFin: '2026-05-10' };
    const resultado = validarParadasEnViaje(paradas, viajeFechas);
    expect(resultado.esValido).toBe(false);
    expect(resultado.mensaje).toContain('no puede finalizar después');
  });
});

describe('Block 2.4 — Micro-stop chronicles & companions schema', () => {
  it('ParadaSchema acepta transporte canónico, esFavorita, titular, nota, vibes y lugares', () => {
    const parada = {
      nombre: 'Budapest',
      coordenadas: [19.0402, 47.4979],
      fechaLlegada: '2026-09-26',
      fechaSalida: '2026-09-28',
      transporte: 'plane',
      esFavorita: true,
      titular: 'El Parlamento al atardecer',
      nota: 'Cruzamos el Danubio caminando y terminamos cenando junto al río.',
      vibes: ['caminable', 'gastronomia', 'fotogenica'],
      lugares: [
        { id: 'poi-1', nombre: 'Parlamento', categoria: 'monumento' },
        { id: 'poi-2', nombre: 'Mercado Central', categoria: 'gastronomia' }
      ]
    };

    const parsed = ParadaSchema.parse(parada);
    expect(parsed.transporte).toBe('plane');
    expect(parsed.esFavorita).toBe(true);
    expect(parsed.titular).toBe('El Parlamento al atardecer');
    expect(parsed.vibes).toEqual(['caminable', 'gastronomia', 'fotogenica']);
    expect(parsed.lugares).toHaveLength(2);
    expect(parsed.lugares[1].categoria).toBe('gastronomia');
  });

  it('ParadaSchema rechaza un lugar con categoría inválida', () => {
    const parada = {
      nombre: 'Roma',
      coordenadas: [12.4964, 41.9028],
      lugares: [{ id: 'poi-x', nombre: 'Coliseo', categoria: 'inventada' }]
    };

    expect(() => ParadaSchema.parse(parada)).toThrow();
  });

  it('ViajeSchemaBase acepta companionType y companions nominales (strings) y objetos', () => {
    const viaje = {
      code: 'HU',
      nombreEspanol: 'Hungría',
      titulo: 'Escapada a Budapest',
      fechaInicio: '2026-09-26',
      fechaFin: '2026-09-28',
      companionType: 'couple',
      companions: ['Ana', { name: 'Luis', email: 'luis@example.com' }],
      fotoCredito: null
    };

    const parsed = ViajeSchemaBase.parse(viaje);
    expect(parsed.companionType).toBe('couple');
    expect(parsed.companions).toHaveLength(2);
    expect(parsed.companions[0]).toBe('Ana');
    expect(parsed.companions[1].name).toBe('Luis');
  });

  it('ViajeSchemaBase rechaza un companionType desconocido', () => {
    const viaje = {
      code: 'HU',
      nombreEspanol: 'Hungría',
      titulo: 'Escapada a Budapest',
      fechaInicio: '2026-09-26',
      fechaFin: '2026-09-28',
      companionType: 'crowd'
    };

    expect(() => ViajeSchemaBase.parse(viaje)).toThrow();
  });
});

describe('Block 2.4 Final — zero-Zod-block save sanitization', () => {
  const baseTrip = {
    code: 'ES',
    nombreEspanol: 'España',
    titulo: 'Escapada a Toledo',
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-03',
    fotoCredito: null,
  };

  it('ViajeSchemaBase tolerates empty strings in optional fields (destino/texto/presupuesto)', () => {
    const parsed = ViajeSchemaBase.parse({
      ...baseTrip,
      destino: '',
      texto: '',
      presupuesto: '',
      portadaUrl: ''
    });

    expect(parsed.destino ?? undefined).toBeUndefined();
    expect(parsed.texto ?? undefined).toBeUndefined();
    expect(parsed.presupuesto ?? undefined).toBeUndefined();
    expect(parsed.portadaUrl ?? undefined).toBeUndefined();
  });

  it('ViajeSchemaBase accepts empty highlights without throwing', () => {
    const viaje = {
      ...ViajeSchemaBase.parse({
        code: 'HU',
        nombreEspanol: 'Hungría',
        titulo: 'Budapest',
        fechaInicio: '2026-09-26',
        fechaFin: '2026-09-28',
        fotoCredito: null,
        highlights: { topFood: '', topView: '', topTip: '' },
      }),
    };
    expect(viaje.highlights?.topFood ?? undefined).toBeUndefined();
    expect(() =>
      ViajeSchemaBase.parse({
        code: 'HU',
        nombreEspanol: 'Hungría',
        titulo: 'Budapest',
        fechaInicio: '2026-09-26',
        fechaFin: '2026-09-28',
        fotoCredito: null,
        highlights: {},
      })
    ).not.toThrow();
  });

  it('companions and vibe filter out blank entries', () => {
    const parsed = ViajeSchemaBase.parse({
      code: 'AR',
      nombreEspanol: 'Argentina',
      titulo: 'Ruta',
      fechaInicio: '2026-02-01',
      fechaFin: '2026-02-05',
      fotoCredito: null,
      vibe: ['', 'Relax'],
      companions: ['', '   ', 'Ana', { name: 'Luis' }]
    });

    expect(parsed.vibe).toEqual(['Relax']);
    expect(parsed.companions).toHaveLength(2);
    expect(parsed.companions[0]).toBe('Ana');
    expect(parsed.companions[1].name).toBe('Luis');
  });

  it('ParadaSchema accepts empty-string ciudad and stops where ciudad equals nombre', () => {
    const withEmptyCiudad = ParadaSchema.parse({
      nombre: 'Santiago',
      ciudad: '',
      coordenadas: [-70.6693, -33.4489],
    });
    expect(withEmptyCiudad.ciudad).toBeUndefined();

    const withMatchingCiudad = ParadaSchema.parse({
      nombre: 'Buenos Aires',
      ciudad: 'Buenos Aires',
      coordenadas: [-58.3816, -34.6037],
    });
    expect(withMatchingCiudad.ciudad).toBe('Buenos Aires');
    expect(withMatchingCiudad.nombre).toBe('Buenos Aires');
  });
});

describe('Block 2.4 — country name optional (paisCodigo-only saves)', () => {
  it('validarViaje accepts a trip with only paisCodigo/code and no nombreEspanol', () => {
    const resultado = validarViaje(
      {
        code: 'IS',
        titulo: 'Anillo de Fuego y Hielo',
        fechaInicio: '2026-03-01',
        fechaFin: '2026-03-08',
      },
      false
    );
    expect(resultado.esValido).toBe(true);
  });

  it('validarViaje tolerates an empty nombreEspanol', () => {
    const resultado = validarViaje(
      {
        code: 'IS',
        nombreEspanol: '',
        titulo: 'Anillo de Fuego y Hielo',
        fechaInicio: '2026-03-01',
        fechaFin: '2026-03-05',
      },
      false
    );
    expect(resultado.esValido).toBe(true);
  });

  it('validarParada accepts a stop with only paisCodigo (no pais)', () => {
    const resultado = validarParada({
      nombre: 'Reikiavik',
      coordenadas: [-21.9426, 64.1466],
      paisCodigo: 'IS',
    });
    expect(resultado.esValido).toBe(true);
  });

  it('ParadaSchema tolerates an empty pais with a valid paisCodigo', () => {
    const parsed = ParadaSchema.parse({
      nombre: 'Reikiavik',
      coordenadas: [-21.9426, 64.1466],
      pais: '',
      paisCodigo: 'IS',
    });
    expect(parsed.pais === undefined || parsed.pais === '').toBe(true);
    expect(parsed.paisCodigo).toBe('IS');
  });

  it('ViajeSchemaBase accepts a trip without nombreEspanol and tolerates pais', () => {
    const parsed = ViajeSchemaBase.parse({
      code: 'IS',
      pais: '',
      titulo: 'Anillo de Fuego y Hielo',
      fechaInicio: '2026-03-01',
      fechaFin: '2026-03-08',
      fotoCredito: null,
    });
    expect(parsed.nombreEspanol).toBeUndefined();
    expect(parsed.pais).toBeUndefined();
  });
});

describe('Block 2.4 — coordinates are [longitude, latitude]', () => {
  it('accepts Americas cities with negative longitude below -90', () => {
    expect(validarParada({ nombre: 'San Francisco', coordenadas: [-122.4, 37.77] }).esValido).toBe(true);
    expect(validarParada({ nombre: 'San Diego', coordenadas: [-117.16, 32.71] }).esValido).toBe(true);
  });

  it('still accepts European coordinates (positive longitude)', () => {
    expect(validarParada({ nombre: 'Budapest', coordenadas: [19.04, 47.5] }).esValido).toBe(true);
  });

  it('accepts boundary coordinates', () => {
    expect(validarParada({ nombre: 'Edge East/North', coordenadas: [180, 90] }).esValido).toBe(true);
    expect(validarParada({ nombre: 'Edge West/South', coordenadas: [-180, -90] }).esValido).toBe(true);
  });

  it('rejects out-of-range coordinates', () => {
    expect(validarParada({ nombre: 'Bad lng', coordenadas: [180.1, 0] }).esValido).toBe(false);
    expect(validarParada({ nombre: 'Bad lat', coordenadas: [0, 90.1] }).esValido).toBe(false);
  });

  it('validarCoordenadas accepts a negative longitude and rejects a bad latitude', () => {
    expect(validarCoordenadas([-122.4, 37.77]).esValido).toBe(true);
    expect(validarCoordenadas([0, 91]).esValido).toBe(false);
  });
});

describe('Block 2.4 — trip titular & POI emoji', () => {
  it('ViajeSchemaBase accepts an optional titular headline', () => {
    const parsed = ViajeSchemaBase.parse({
      code: 'IS',
      nombreEspanol: 'Islandia',
      titulo: 'Anillo de Fuego y Hielo',
      fechaInicio: '2026-03-01',
      fechaFin: '2026-03-08',
      fotoCredito: null,
      titular: 'Diez días de hielo y fuego',
    });
    expect(parsed.titular).toBe('Diez días de hielo y fuego');
  });

  it('ViajeSchemaBase tolerates an empty titular', () => {
    const parsed = ViajeSchemaBase.parse({
      code: 'IS',
      nombreEspanol: 'Islandia',
      titulo: 'Anillo de Fuego y Hielo',
      fechaInicio: '2026-03-01',
      fechaFin: '2026-03-02',
      fotoCredito: null,
      titular: '',
    });
    expect(parsed.titular).toBeUndefined();
  });

  it('ParadaSchema accepts lugares with an optional emoji', () => {
    const parsed = ParadaSchema.parse({
      nombre: 'Reykjavik',
      coordenadas: [-21.94, 64.15],
      lugares: [{ id: 'l1', nombre: 'Café', categoria: 'gastronomia', emoji: '☕' }],
    });
    expect(parsed.lugares[0].emoji).toBe('☕');
  });
});