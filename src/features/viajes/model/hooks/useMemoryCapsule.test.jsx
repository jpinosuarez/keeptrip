/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { setDevMemoryMode, getDevMemoryMode, resetSeenToday } from '@shared/dev/devMemoryOverride';
import { useMemoryCapsule } from './useMemoryCapsule';

const obtenerFotosViajeMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/firebase', () => ({ db: {} }));
vi.mock('@shared/api/services/viajes/galeriaService', () => ({
  obtenerFotosViaje: obtenerFotosViajeMock,
}));

const REFERENCE_DATE = new Date(2026, 4, 4, 12, 0, 0);

const makeTrips = () => ([
  { id: 't-madrid', titulo: 'Ruta España', fechaInicio: '2024-05-01', fechaFin: '2024-05-10', paisCodigo: 'ES' },
  { id: 't-lisboa', titulo: 'Lisboa', fechaInicio: '2023-05-20', fechaFin: '2023-05-25', paisCodigo: 'PT' },
  { id: 't-paris', titulo: 'París', fechaInicio: '2023-06-20', fechaFin: '2023-06-25', paisCodigo: 'FR' },
  { id: 't-wish', titulo: 'Deseo', fechaInicio: '2022-01-01', fechaFin: '2022-01-05', status: 'wishlist' },
]);

const makeTripDataMap = () => ({
  't-madrid': { paradas: [{ id: 'madrid', nombre: 'Madrid', ciudad: 'Madrid', paisCodigo: 'ES', fechaLlegada: '2024-05-01', fechaSalida: '2024-05-10' }] },
  't-lisboa': { paradas: [{ id: 'lisboa', nombre: 'Lisboa', ciudad: 'Lisboa', paisCodigo: 'PT', fechaLlegada: '2023-05-20', fechaSalida: '2023-05-25' }] },
  't-paris': { paradas: [{ id: 'paris', nombre: 'París', ciudad: 'París', paisCodigo: 'FR', fechaLlegada: '2023-06-20', fechaSalida: '2023-06-25' }] },
});

const LocationProbe = ({ locationRef }) => {
  locationRef.current = useLocation();
  return null;
};

const renderCapsule = (props = {}, initialEntries = ['/dashboard']) => {
  const locationRef = { current: null };
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <LocationProbe locationRef={locationRef} />
      {children}
    </MemoryRouter>
  );
  const utils = renderHook(() => useMemoryCapsule({
    trips: makeTrips(),
    tripDataMap: makeTripDataMap(),
    userUid: 'uid-1',
    referenceDate: REFERENCE_DATE,
    ...props,
  }), { wrapper: Wrapper });
  return { ...utils, locationRef };
};

beforeEach(() => {
  obtenerFotosViajeMock.mockReset();
  obtenerFotosViajeMock.mockResolvedValue([
    { id: 'photo-1', url: 'https://example.com/madrid.jpg', paradaId: 'madrid' },
  ]);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  setDevMemoryMode('auto');
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('useMemoryCapsule · daily selection & seen state', () => {
  it('computes the daily capsule from in-memory data only', () => {
    const { result } = renderCapsule();

    expect(result.current.dateKey).toBe('2026-05-04');
    expect(result.current.capsule.matchType).toBe('exact_day');
    expect(result.current.capsule.tripId).toBe('t-madrid');
    expect(result.current.totalCandidates).toBe(5);
    expect(result.current.isSeenToday).toBe(false);
    expect(obtenerFotosViajeMock).not.toHaveBeenCalled();
  });

  it('marks and resets the seen-today status via localStorage', () => {
    const { result } = renderCapsule();

    act(() => result.current.markAsSeen());

    expect(window.localStorage.getItem('keeptrip_memory_seen_2026-05-04')).toContain(result.current.capsule.id);
    expect(result.current.isSeenToday).toBe(true);

    act(() => result.current.resetSeenStatus());

    expect(window.localStorage.getItem('keeptrip_memory_seen_2026-05-04')).toBeNull();
    expect(result.current.isSeenToday).toBe(false);
  });

  it('shuffleMemory advances to a different capsule', () => {
    const thematicTrips = ['x', 'y', 'z'].map((id) => ({
      id: `t-${id}`,
      titulo: `Trip ${id}`,
      fechaInicio: '2026-01-05',
      fechaFin: '2026-01-08',
    }));
    const tripDataMap = thematicTrips.reduce((acc, trip) => {
      acc[trip.id] = { paradas: [{ id: `stop-${trip.id}`, nombre: `Stop ${trip.id}` }] };
      return acc;
    }, {});

    const { result } = renderCapsule({ trips: thematicTrips, tripDataMap });
    const firstId = result.current.capsule.id;

    act(() => result.current.shuffleMemory());

    expect(result.current.capsule.id).not.toBe(firstId);
  });
});

describe('useMemoryCapsule · on-demand memory story', () => {
  it('lazily fetches gallery photos once and caches them per trip', async () => {
    const { result } = renderCapsule();

    await act(async () => {
      await result.current.openMemoryStory();
    });

    await waitFor(() => expect(result.current.isStoryOpen).toBe(true));

    expect(obtenerFotosViajeMock).toHaveBeenCalledTimes(1);
    expect(obtenerFotosViajeMock).toHaveBeenCalledWith({ db: {}, userId: 'uid-1', viajeId: 't-madrid' });
    expect(result.current.isLoadingStoryPhotos).toBe(false);
    expect(result.current.capsule).not.toBeNull();
    expect(result.current.storySlides[0].type).toBe('memory-cover');
    expect(result.current.storySlides.some((slide) => slide.type === 'closing')).toBe(true);
    expect(result.current.isSeenToday).toBe(true);

    await act(async () => {
      await result.current.openMemoryStory();
    });

    expect(obtenerFotosViajeMock).toHaveBeenCalledTimes(1);
  });

  it('degrades gracefully when the gallery fetch fails', async () => {
    obtenerFotosViajeMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderCapsule();

    await act(async () => {
      await result.current.openMemoryStory();
    });

    await waitFor(() => expect(result.current.isStoryOpen).toBe(true));
    expect(result.current.storySlides.length).toBeGreaterThanOrEqual(2);
    expect(result.current.storySlides[0].type).toBe('memory-cover');
  });
});


describe('useMemoryCapsule · URL deep-link support', () => {
  it('auto-opens ?memory=&stop= and cleans the query params on close', async () => {
    const { result, locationRef } = renderCapsule({}, ['/dashboard?memory=t-paris&stop=paris']);

    await waitFor(() => expect(result.current.isStoryOpen).toBe(true));

    expect(result.current.capsule.tripId).toBe('t-paris');
    expect(result.current.capsule.stopId).toBe('paris');
    expect(obtenerFotosViajeMock).toHaveBeenCalledWith({ db: {}, userId: 'uid-1', viajeId: 't-paris' });

    act(() => result.current.closeMemoryStory());

    await waitFor(() => expect(result.current.isStoryOpen).toBe(false));
    expect(locationRef.current.search).not.toContain('memory=');
    expect(locationRef.current.search).not.toContain('stop=');
  });
});

describe('useMemoryCapsule · DEV memory override', () => {
  it('devMemoryOverride store persists valid modes and clears seen keys', () => {
    expect(getDevMemoryMode()).toBe('auto');

    setDevMemoryMode('same_month');
    expect(getDevMemoryMode()).toBe('same_month');

    setDevMemoryMode('not-a-real-mode');
    expect(getDevMemoryMode()).toBe('auto');

    window.localStorage.setItem('keeptrip_memory_seen_2026-05-04', '["x"]');
    resetSeenToday();
    expect(window.localStorage.getItem('keeptrip_memory_seen_2026-05-04')).toBeNull();
  });

  it('reacts to DEV mode switches and seen resets', async () => {
    const { result } = renderCapsule();

    await waitFor(() => expect(result.current.devMode).toBe('auto'));
    expect(result.current.capsule.matchType).toBe('exact_day');

    act(() => setDevMemoryMode('same_month'));

    await waitFor(() => expect(result.current.devMode).toBe('same_month'));
    expect(result.current.capsule.matchType).toBe('same_month');
    expect(result.current.capsule.tripId).toBe('t-lisboa');

    act(() => result.current.markAsSeen());
    expect(result.current.isSeenToday).toBe(true);

    act(() => resetSeenToday());

    await waitFor(() => expect(result.current.isSeenToday).toBe(false));
  });
});

