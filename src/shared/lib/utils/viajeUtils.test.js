import { describe, it, expect } from 'vitest';
import {
  FOTO_DEFAULT_URL,
  generarTituloInteligente,
  construirBanderasViaje,
  construirCiudadesViaje,
  construirParadaPayload,
  construirViajePayload,
  construirBitacoraData,
  obtenerPaisesVisitados,
  parseFlexibleDate,
  formatDateSlash,
  formatDateRange
} from './viajeUtils';

describe('viajeUtils', () => {
  it('genera titulo por ciudad unica', () => {
    const titulo = generarTituloInteligente([{ nombre: 'Madrid', paisCodigo: 'ES' }]);
    expect(titulo).toBe('Viaje a Madrid');
  });

  it('genera titulo por dos ciudades', () => {
    const titulo = generarTituloInteligente([
      { nombre: 'Madrid', paisCodigo: 'ES' },
      { nombre: 'Barcelona', paisCodigo: 'ES' }
    ]);
    expect(titulo).toBe('Viaje a Madrid y Barcelona');
  });

  it('genera titulo por pais cuando hay varias ciudades del mismo pais', () => {
    const titulo = generarTituloInteligente([
      { nombre: 'Madrid', paisCodigo: 'ES' },
      { nombre: 'Sevilla', paisCodigo: 'ES' },
      { nombre: 'Valencia', paisCodigo: 'ES' }
    ]);
    expect(titulo).toBe('Gran tour por España');
  });

  it('genera titulo para dos paises', () => {
    const titulo = generarTituloInteligente([
      { nombre: 'Madrid', paisCodigo: 'ES' },
      { nombre: 'Paris', paisCodigo: 'FR' }
    ]);
    expect(titulo).toBe('Viaje por España y Francia');
  });

  it('genera titulo para multiples paises (3 paises)', () => {
    const titulo = generarTituloInteligente([
      { nombre: 'Madrid', paisCodigo: 'ES' },
      { nombre: 'Paris', paisCodigo: 'FR' },
      { nombre: 'Roma', paisCodigo: 'IT' }
    ]);
    expect(titulo).toBe('Aventura por España, Francia e Italia');
  });

  it('genera titulo para mas de tres paises', () => {
    const titulo = generarTituloInteligente([
      { nombre: 'Uno', paisCodigo: 'ES' },
      { nombre: 'Dos', paisCodigo: 'FR' },
      { nombre: 'Tres', paisCodigo: 'IT' },
      { nombre: 'Cuatro', paisCodigo: 'DE' }
    ]);
    expect(titulo).toBe('Expedición por España, Francia y más destinos');
  });

  it('prioriza banderas de paradas y elimina duplicados', () => {
    const banderas = construirBanderasViaje('AR', [
      { paisCodigo: 'ES' },
      { paisCodigo: 'ES' },
      { paisCodigo: 'FR' }
    ]);
    expect(banderas).toEqual(['https://flagcdn.com/es.svg', 'https://flagcdn.com/fr.svg']);
  });

  it('acepta codigo ISO3 al construir banderas', () => {
    const banderas = construirBanderasViaje('SVK', []);
    expect(banderas).toEqual(['https://flagcdn.com/sk.svg']);
  });

  it('construye string de ciudades unicas', () => {
    const ciudades = construirCiudadesViaje([{ nombre: 'Lima' }, { nombre: 'Cusco' }, { nombre: 'Lima' }]);
    expect(ciudades).toBe('Lima, Cusco');
  });

  it('construye payload de parada con defaults y campos nuevos', () => {
    const payload = construirParadaPayload(
      { nombre: 'Lima', coordenadas: [-77.04, -12.04], paisCodigo: 'PE', transporte: 'tren', notaCorta: 'Comer ceviche' },
      '2026-02-11',
      { desc: 'Nublado', max: 26, code: 4 }
    );

    expect(payload).toEqual({
      nombre: 'Lima',
      coordenadas: [-77.04, -12.04],
      fecha: '2026-02-11',
      fechaLlegada: '',
      fechaSalida: '',
      paisCodigo: 'PE',
      clima: { desc: 'Nublado', max: 26, code: 4 },
      tipo: 'place',
      transporte: 'tren',
      notaCorta: 'Comer ceviche'
    });
  });

  it('construye payload de viaje con fallbacks', () => {
    const payload = construirViajePayload({
      datosViaje: { code: 'AR', nombreEspanol: 'Argentina' },
      titulo: 'Mi viaje',
      banderas: ['https://flagcdn.com/ar.svg'],
      ciudades: 'Buenos Aires',
      foto: null,
      fotoCredito: null
    });

    expect(payload.code).toBe('AR');
    expect(payload.nombreEspanol).toBe('Argentina');
    expect(payload.titulo).toBe('Mi viaje');
    expect(payload.rating).toBe(5);
    expect(payload.foto).toBe(FOTO_DEFAULT_URL);
    expect(payload.banderas).toEqual(['https://flagcdn.com/ar.svg']);
    expect(payload.ciudades).toBe('Buenos Aires');
  });

  it('construye payload de viaje incluyendo presupuesto y vibe', () => {
    const payload = construirViajePayload({
      datosViaje: { code: 'AR', nombreEspanol: 'Argentina', presupuesto: 'Lujo', vibe: ['Gastronómico'] },
      titulo: 'Mi viaje',
      banderas: ['https://flagcdn.com/ar.svg'],
      ciudades: 'Buenos Aires',
      foto: null,
      fotoCredito: null
    });

    expect(payload.presupuesto).toBe('Lujo');
    expect(payload.vibe).toEqual(['Gastronómico']);
  });

  it('obtiene paises visitados en ISO3 desde bitacora y paradas', () => {
    const paises = obtenerPaisesVisitados(
      [{ code: 'AR' }, { code: 'ES' }],
      [{ paisCodigo: 'FR' }, { paisCodigo: 'AR' }]
    );
    expect(paises).toEqual(expect.arrayContaining(['ARG', 'ESP', 'FRA']));
    expect(paises.length).toBe(3);
  });

  it('convierte Eslovaquia de ISO2 a ISO3 para mapas', () => {
    const paises = obtenerPaisesVisitados([{ code: 'SK' }], []);
    expect(paises).toEqual(['SVK']);
  });

  it('construye bitacoraData con paradas indexadas por viaje', () => {
    const bitacoraData = construirBitacoraData(
      [
        { id: 'v1', titulo: 'A' },
        { id: 'v2', titulo: 'B' }
      ],
      [
        { id: 'p1', viajeId: 'v1', nombre: 'Madrid' },
        { id: 'p2', viajeId: 'v1', nombre: 'Sevilla' },
        { id: 'p3', viajeId: 'v2', nombre: 'Lima' }
      ]
    );

    expect(bitacoraData.v1.paradas).toHaveLength(2);
    expect(bitacoraData.v2.paradas).toHaveLength(1);
  });

  // ─── parseFlexibleDate ───
  describe('parseFlexibleDate', () => {
    it('parsea ISO directo', () => {
      expect(parseFlexibleDate('2024-03-15')).toBe('2024-03-15');
    });

    it('parsea dd/mm/yyyy', () => {
      expect(parseFlexibleDate('15/03/2024')).toBe('2024-03-15');
    });

    it('parsea dd-mm-yyyy', () => {
      expect(parseFlexibleDate('15-03-2024')).toBe('2024-03-15');
    });

    it('parsea dd.mm.yyyy', () => {
      expect(parseFlexibleDate('15.03.2024')).toBe('2024-03-15');
    });

    it('parsea texto "15 Mar 2024"', () => {
      expect(parseFlexibleDate('15 Mar 2024')).toBe('2024-03-15');
    });

    it('parsea texto en español "15 Dic 2023"', () => {
      expect(parseFlexibleDate('15 Dic 2023')).toBe('2023-12-15');
    });

    it('retorna null para input vacío', () => {
      expect(parseFlexibleDate('')).toBeNull();
      expect(parseFlexibleDate(null)).toBeNull();
    });

    it('retorna null para texto no parseable', () => {
      expect(parseFlexibleDate('hola mundo')).toBeNull();
    });
  });

  // ─── formatDateSlash ───
  describe('formatDateSlash', () => {
    it('formatea ISO a dd/mm/yyyy', () => {
      expect(formatDateSlash('2024-03-15')).toBe('15/03/2024');
    });

    it('formatea con padding de ceros', () => {
      expect(formatDateSlash('2024-01-05')).toBe('05/01/2024');
    });

    it('retorna vacío para null', () => {
      expect(formatDateSlash(null)).toBe('');
    });
  });

  // ─── formatDateRange ───
  describe('formatDateRange', () => {
    it('muestra solo fecha cuando inicio = fin', () => {
      const result = formatDateRange('2024-03-15', '2024-03-15');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('muestra rango compacto para mismo mes', () => {
      const result = formatDateRange('2024-03-15', '2024-03-20');
      expect(result).toMatch(/15.20/);
      expect(result).toContain('2024');
    });

    it('muestra rango extendido para distinto mes', () => {
      const result = formatDateRange('2024-03-15', '2024-04-03');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('acepta formato dd/mm/yyyy como input', () => {
      const result = formatDateRange('15/03/2024', '20/03/2024');
      expect(result).toMatch(/15.20/);
    });

    it('retorna vacío para null', () => {
      expect(formatDateRange(null, null)).toBe('');
    });
  });
});
