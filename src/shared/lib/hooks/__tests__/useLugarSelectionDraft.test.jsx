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

    const { result } = renderHook(() => useLugarSelectionDraft({
      closeBuscador,
      setFiltro,
      setViajeBorrador,
      setCiudadInicialBorrador,
    }));

    act(() => {
      result.current({
        isCountry: true,
        code: 'US',
        name: 'United States',
        coordinates: [37.0902, -95.7129],
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
    expect(setCiudadInicialBorrador).toHaveBeenCalledWith(expect.objectContaining({
      paisCodigo: 'US',
    }));
  });

  test('crea borrador de ciudad con ciudad inicial', () => {
    const closeBuscador = vi.fn();
    const setFiltro = vi.fn();
    const setViajeBorrador = vi.fn();
    const setCiudadInicialBorrador = vi.fn();

    const { result } = renderHook(() => useLugarSelectionDraft({
      closeBuscador,
      setFiltro,
      setViajeBorrador,
      setCiudadInicialBorrador,
    }));

    act(() => {
      result.current({
        isCountry: false,
        name: 'Madrid',
        coordinates: [40.4168, -3.7038],
        countryCode: 'ES',
        countryName: 'España',
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
