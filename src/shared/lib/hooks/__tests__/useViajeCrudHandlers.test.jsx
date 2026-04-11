/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViajeCrudHandlers } from '../useViajeCrudHandlers';

function buildParams(overrides = {}) {
  return {
    guardarNuevoViaje: vi.fn(),
    actualizarDetallesViaje: vi.fn(),
    actualizarParadaHook: vi.fn(),
    eliminarParadaHook: vi.fn(),
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
    expect(params.guardarNuevoViaje.mock.calls[0][0]).toMatchObject({
      titulo: 'Mi viaje',
      ciudades: 'Madrid, Paris',
    });
    expect(params.guardarNuevoViaje.mock.calls[0][0].banderas).toEqual(['https://flagcdn.com/es.svg']);
    expect(params.guardarNuevoViaje.mock.calls[0][0].flags).toEqual(['https://flagcdn.com/es.svg']);
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

  test('en edición existente persiste altas, actualizaciones y bajas de paradas en paralelo', async () => {
    const params = buildParams({
      actualizarDetallesViaje: vi.fn().mockResolvedValue(true),
      agregarParada: vi.fn().mockResolvedValue(true),
      actualizarParadaHook: vi.fn().mockResolvedValue(true),
      eliminarParadaHook: vi.fn().mockResolvedValue(true),
    });

    const { result } = renderHook(() => useViajeCrudHandlers(params));

    let response;
    await act(async () => {
      response = await result.current.handleGuardarDesdeVisor('trip-99', {
        titulo: 'Trip actualizado',
        paradasNuevas: [
          { id: 'temp-1', nombre: 'Paris' },
          { id: 'stop-2', nombre: 'Lyon' },
        ],
        deletedStopIds: ['stop-3'],
      });
    });

    expect(response).toBe('trip-99');
    expect(params.actualizarDetallesViaje).toHaveBeenCalledWith(
      'trip-99',
      expect.objectContaining({ titulo: 'Trip actualizado' })
    );
    expect(params.agregarParada).toHaveBeenCalledWith(expect.objectContaining({ id: 'temp-1' }), 'trip-99');
    expect(params.actualizarParadaHook).toHaveBeenCalledWith(expect.objectContaining({ id: 'stop-2' }), 'trip-99');
    expect(params.eliminarParadaHook).toHaveBeenCalledWith('trip-99', 'stop-3');
  });
});
