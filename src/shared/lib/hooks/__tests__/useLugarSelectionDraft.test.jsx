/** @vitest-environment jsdom */
import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLugarSelectionDraft } from '../useLugarSelectionDraft';

// The hook now performs router navigation (deep-link the draft via ?new=true),
// so it must run inside a Router context.
const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

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
    }), { wrapper });

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
    }), { wrapper });

    act(() => {
      result.current({
        isCountry: false,
        name: 'Madrid',
        coordinates: [40.4168, -3.7038],
        countryCode: 'ES',
        countryName: 'Espana',
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

  test('normaliza codigo ISO3 de pais a ISO2', () => {
    const closeBuscador = vi.fn();
    const setFiltro = vi.fn();
    const setViajeBorrador = vi.fn();
    const setCiudadInicialBorrador = vi.fn();

    const { result } = renderHook(() => useLugarSelectionDraft({
      closeBuscador,
      setFiltro,
      setViajeBorrador,
      setCiudadInicialBorrador,
    }), { wrapper });

    act(() => {
      result.current({
        isCountry: true,
        code: 'SVK',
        name: 'Slovakia',
        coordinates: [19.699, 48.669],
      });
    });

    expect(setViajeBorrador).toHaveBeenCalledWith(expect.objectContaining({
      code: 'SK',
    }));

    expect(setCiudadInicialBorrador).toHaveBeenCalledWith(expect.objectContaining({
      paisCodigo: 'SK',
    }));
  });
});
