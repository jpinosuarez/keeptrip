import { describe, it, expect } from 'vitest';
import { ViajeSchemaBase, ParadaSchema, validarParada, validarViaje, validarParadasEnViaje } from './viajeSchema';

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