/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLugarSelectionDraft } from '../useLugarSelectionDraft';

describe('useLugarSelectionDraft', () => {
  test('crea borrador de pais y limpia buscador/filtro', () => {
    const closeBuscador = vi.fn();
    const setFiltro = vi.fn();
    const setViajeBorrador = vi.fn();
    const setCiudadInicialBorrador = vi.fn();
    const setViajeEnEdicionId = vi.fn();
    const setViajeExpandidoId = vi.fn();

    const { result } = renderHook(() => useLugarSelectionDraft({
      closeBuscador,
      setFiltro,
      setViajeBorrador,
      setCiudadInicialBorrador,
      setViajeEnEdicionId,
      setViajeExpandidoId,
    }));

    act(() => {
      result.current({
        esPais: true,
        code: 'US',
        nombre: 'Estados Unidos',
        coordenadas: [37.0902, -95.7129],
      });
    });

    expect(closeBuscador).toHaveBeenCalledTimes(1);
    expect(setFiltro).toHaveBeenCalledWith('');
    expect(setViajeBorrador).toHaveBeenCalledTimes(1);
    expect(setViajeBorrador.mock.calls[0][0]).toMatchObject({
      id: 'new',
      code: 'US',
      continente: 'Mundo',
      foto: null,
      latlng: [37.0902, -95.7129],
    });
    expect(setViajeEnEdicionId).toHaveBeenCalledWith(null);
    expect(setViajeExpandidoId).toHaveBeenCalledWith(null);
    expect(setCiudadInicialBorrador).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Estados Unidos',
      paisCodigo: 'US',
    }));
  });

  test('crea borrador de ciudad con ciudad inicial', () => {
    const closeBuscador = vi.fn();
    const setFiltro = vi.fn();
    const setViajeBorrador = vi.fn();
    const setCiudadInicialBorrador = vi.fn();
    const setViajeEnEdicionId = vi.fn();
    const setViajeExpandidoId = vi.fn();

    const { result } = renderHook(() => useLugarSelectionDraft({
      closeBuscador,
      setFiltro,
      setViajeBorrador,
      setCiudadInicialBorrador,
      setViajeEnEdicionId,
      setViajeExpandidoId,
    }));

    act(() => {
      result.current({
        esPais: false,
        nombre: 'Madrid',
        coordenadas: [40.4168, -3.7038],
        paisCodigo: 'ES',
        paisNombre: 'Espana',
      });
    });

    expect(setViajeBorrador).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new',
      code: 'ES',
      coordenadas: [40.4168, -3.7038],
    }));

    expect(setCiudadInicialBorrador).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Madrid',
      paisCodigo: 'ES',
    }));
  });
});
