/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViajeCrudHandlers } from '../useViajeCrudHandlers';

function buildParams(overrides = {}) {
  return {
    guardarNuevoViaje: vi.fn(),
    actualizarDetallesViaje: vi.fn(),
    actualizarParadaHook: vi.fn(),
    eliminarViaje: vi.fn(),
    agregarParada: vi.fn(),
    ciudadInicialBorrador: null,
    setViajeBorrador: vi.fn(),
    setCiudadInicialBorrador: vi.fn(),
    pushToast: vi.fn(),
    confirmarEliminacion: null,
    setConfirmarEliminacion: vi.fn(),
    onAfterDelete: vi.fn(),
    ...overrides,
  };
}

describe('useViajeCrudHandlers', () => {
  test('guarda viaje nuevo, limpia borrador y retorna el id', async () => {
    const params = buildParams({
      ciudadInicialBorrador: { nombre: 'Madrid', paisCodigo: 'ES' },
      guardarNuevoViaje: vi.fn().mockResolvedValue('trip-1'),
    });

    const { result } = renderHook(() => useViajeCrudHandlers(params));

    let response;
    await act(async () => {
      response = await result.current.handleGuardarModal('new', {
        titulo: 'Mi viaje',
        paradasNuevas: [{ id: 'temp-1', nombre: 'Paris' }],
      });
    });

    expect(response).toBe('trip-1');
    expect(params.guardarNuevoViaje).toHaveBeenCalledTimes(1);
    expect(params.guardarNuevoViaje.mock.calls[0][0]).toEqual({ titulo: 'Mi viaje' });
    expect(params.guardarNuevoViaje.mock.calls[0][1][0]).toMatchObject({ nombre: 'Madrid' });
    expect(params.setViajeBorrador).toHaveBeenCalledWith(null);
    expect(params.setCiudadInicialBorrador).toHaveBeenCalledWith(null);
  });

  test('elimina viaje confirmado, llama onAfterDelete y limpia confirmación', async () => {
    const params = buildParams({
      confirmarEliminacion: 'trip-42',
      eliminarViaje: vi.fn().mockResolvedValue(true),
    });

    const { result } = renderHook(() => useViajeCrudHandlers(params));

    let response;
    await act(async () => {
      response = await result.current.handleDeleteViaje();
    });

    expect(response).toBe(true);
    expect(params.eliminarViaje).toHaveBeenCalledWith('trip-42');
    expect(params.onAfterDelete).toHaveBeenCalledTimes(1);
    expect(params.setConfirmarEliminacion).toHaveBeenCalledWith(null);
  });
});
