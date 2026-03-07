/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mocked = vi.hoisted(() => ({
  useViajeCrudHandlers: vi.fn(),
  useLugarSelectionDraft: vi.fn(),
  useAppViewGuards: vi.fn(),
}));

vi.mock('../useViajeCrudHandlers', () => ({
  useViajeCrudHandlers: mocked.useViajeCrudHandlers,
}));

vi.mock('../useLugarSelectionDraft', () => ({
  useLugarSelectionDraft: mocked.useLugarSelectionDraft,
}));

vi.mock('../useAppViewGuards', () => ({
  useAppViewGuards: mocked.useAppViewGuards,
}));

import { useAppShellComposition } from '../useAppShellComposition';

function buildInput(overrides = {}) {
  const base = {
    ui: {
      vistaActiva: 'home',
      mobileDrawerOpen: false,
      setMobileDrawerOpen: vi.fn(),
      setVistaActiva: vi.fn(),
      mostrarBuscador: true,
      closeBuscador: vi.fn(),
      viajeEnEdicionId: 'v1',
      setViajeEnEdicionId: vi.fn(),
      viajeExpandidoId: 'v2',
      setViajeExpandidoId: vi.fn(),
      viajeBorrador: { id: 'new' },
      setViajeBorrador: vi.fn(),
      ciudadInicialBorrador: { nombre: 'Madrid' },
      setCiudadInicialBorrador: vi.fn(),
      confirmarEliminacion: 'v3',
      setConfirmarEliminacion: vi.fn(),
      abrirVisor: vi.fn(),
    },
    search: {
      busqueda: 'roma',
      setBusqueda: vi.fn(),
      filtro: 'es',
      setFiltro: vi.fn(),
    },
    viajes: {
      paisesVisitados: ['ES'],
      bitacora: [{ id: 'v1' }],
      bitacoraData: { v1: { id: 'v1' } },
      todasLasParadas: [{ id: 'p1' }],
      loadingViajes: false,
      guardarNuevoViaje: vi.fn(),
      actualizarDetallesViaje: vi.fn(),
      actualizarParadaHook: vi.fn(),
      eliminarViaje: vi.fn(),
      agregarParada: vi.fn(),
    },
    permissions: {
      isAdmin: true,
      isMobile: false,
    },
    feedback: {
      pushToast: vi.fn(),
    },
    gamification: {
      achievementsWithProgress: [{ id: 'a1' }],
      achievementStats: { total: 1 },
    },
    invitations: {
      invitations: [{ id: 'i1' }, { id: 'i2' }],
      acceptInvitation: vi.fn(),
      declineInvitation: vi.fn(),
    },
  };

  return {
    ...base,
    ...overrides,
  };
}

describe('useAppShellComposition', () => {
  beforeEach(() => {
    const onLugarSeleccionado = vi.fn();

    mocked.useViajeCrudHandlers.mockReturnValue({
      isSavingModal: false,
      isSavingViewer: false,
      viajesEliminando: new Set(['v5']),
      isDeletingViaje: vi.fn((id) => id === 'v5'),
      handleGuardarModal: vi.fn(),
      handleGuardarDesdeVisor: vi.fn(),
      solicitarEliminarViaje: vi.fn(),
      handleDeleteViaje: vi.fn(),
    });
    mocked.useLugarSelectionDraft.mockReturnValue(onLugarSeleccionado);
    mocked.useAppViewGuards.mockImplementation(() => {});
  });

  test('compone controllers y expone invitationsCount', () => {
    const input = buildInput();

    const { result } = renderHook(() => useAppShellComposition(input));

    expect(mocked.useViajeCrudHandlers).toHaveBeenCalledTimes(1);
    expect(mocked.useLugarSelectionDraft).toHaveBeenCalledTimes(1);
    expect(mocked.useAppViewGuards).toHaveBeenCalledTimes(1);

    expect(result.current.invitationsCount).toBe(2);
    expect(result.current.modalController).toMatchObject({
      mostrarBuscador: true,
      viajeEnEdicionId: 'v1',
      confirmarEliminacion: 'v3',
    });

    expect(result.current.modalData).toMatchObject({
      bitacora: [{ id: 'v1' }],
      bitacoraData: { v1: { id: 'v1' } },
    });

    expect(result.current.activeViewController.view).toMatchObject({
      vistaActiva: 'home',
      isAdmin: true,
      isMobile: false,
    });

    expect(result.current.activeViewController.data).toMatchObject({
      paisesVisitados: ['ES'],
      loadingViajes: false,
    });

    expect(result.current.activeViewController.gamification).toMatchObject({
      achievementStats: { total: 1 },
    });

    expect(result.current.activeViewController.invitations).toBe(input.invitations);
    expect(result.current.onLugarSeleccionado).toBe(mocked.useLugarSelectionDraft.mock.results[0].value);
  });

  test('invitationsCount cae a 0 cuando no hay lista', () => {
    const input = buildInput({ invitations: {} });

    const { result } = renderHook(() => useAppShellComposition(input));

    expect(result.current.invitationsCount).toBe(0);
  });
});
