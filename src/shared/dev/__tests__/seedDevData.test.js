/**
 * Targeted unit tests for the DEV data seeder (Phase A refactor).
 *
 * Covers:
 *  - `empty` / `mateo` / `rich` scenario writes (batch paths, counts, ownership)
 *  - invalid uid guard
 *  - non-DEV environment guard (early return, zero writes)
 *  - `clearDevData` wipe + onboarding reset
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { batchInstances, getDocsMock } = vi.hoisted(() => {
  const batchInstances = [];
  const getDocsMock = vi.fn();
  return { batchInstances, getDocsMock };
});

vi.mock('@shared/firebase', () => ({
  db: { __mockDb: true },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  collection: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  writeBatch: vi.fn(() => {
    const batch = {
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    batchInstances.push(batch);
    return batch;
  }),
  getDocs: (...args) => getDocsMock(...args),
}));

import { clearDevData, seedDevData } from '../seedDevData';
import { MOCK_TRIPS_MATEO, MOCK_TRIPS_RICH, MOCK_USER_PROFILES } from '../mockTravelerData';

const countStops = (trips) => trips.reduce((acc, trip) => acc + (trip.paradas?.length || 0), 0);

describe('seedDevData', () => {
  beforeEach(() => {
    batchInstances.length = 0;
    getDocsMock.mockReset();
    getDocsMock.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('seeds the "mateo" persona with profile + 3 trips + stops in a single batch', async () => {
    const result = await seedDevData('user-1', 'mateo');

    expect(result).toEqual({ success: true, count: 3, scenario: 'mateo', deletedCount: 0 });
    expect(batchInstances).toHaveLength(1);

    const [batch] = batchInstances;
    const expectedWrites = 1 + MOCK_TRIPS_MATEO.length + countStops(MOCK_TRIPS_MATEO);
    expect(batch.set).toHaveBeenCalledTimes(expectedWrites);
    expect(batch.commit).toHaveBeenCalledTimes(1);

    // Profile document (merge-preserving).
    expect(batch.set).toHaveBeenCalledWith(
      { path: 'usuarios/user-1' },
      MOCK_USER_PROFILES.mateo,
      { merge: true }
    );

    // Trip documents carry the ownerId required by firestore.rules.
    expect(batch.set).toHaveBeenCalledWith(
      { path: 'usuarios/user-1/viajes/trip-europa-central' },
      expect.objectContaining({ ownerId: 'user-1' }),
      { merge: true }
    );

    // Stops land in their subcollection (never nested inside the trip doc).
    expect(batch.set).toHaveBeenCalledWith(
      { path: 'usuarios/user-1/viajes/trip-europa-central/paradas/stop-budapest' },
      expect.objectContaining({ id: 'stop-budapest' }),
      { merge: true }
    );

    // No wipe needed for non-empty personas.
    expect(getDocsMock).not.toHaveBeenCalled();
  });

  it('seeds the "rich" persona with 10 trips and the 4 cardinal extremes', async () => {
    const result = await seedDevData('user-1', 'rich');

    expect(result.success).toBe(true);
    expect(result.count).toBe(10);
    expect(result.scenario).toBe('rich');

    const [batch] = batchInstances;
    expect(batch.set).toHaveBeenCalledTimes(1 + MOCK_TRIPS_RICH.length + countStops(MOCK_TRIPS_RICH));

    const stopCoordinates = MOCK_TRIPS_RICH.flatMap((trip) =>
      trip.paradas.map((parada) => parada.coordenadas)
    );
    const latitudes = stopCoordinates.map(([, lat]) => lat);
    const longitudes = stopCoordinates.map(([lng]) => lng);

    expect(Math.max(...latitudes)).toBeGreaterThan(69); // North — Tromsø
    expect(Math.min(...latitudes)).toBeLessThan(-54); // South — Ushuaia
    expect(Math.max(...longitudes)).toBeGreaterThan(179); // East — Taveuni
    expect(Math.min(...longitudes)).toBeLessThan(-155); // West — Kailua-Kona
  });

  it('wipes the archive and seeds "empty" with the onboarding flag pending', async () => {
    getDocsMock.mockResolvedValue({
      docs: [{ id: 'trip-old', ref: { path: 'usuarios/user-1/viajes/trip-old' } }],
    });

    const result = await seedDevData('user-1', 'empty');

    expect(result).toEqual({ success: true, count: 0, scenario: 'empty', deletedCount: 1 });
    expect(getDocsMock).toHaveBeenCalled();

    // First batch = wipe of the previous trip, last batch = profile reset.
    const [wipeBatch, profileBatch] = batchInstances;
    expect(wipeBatch.delete).toHaveBeenCalledWith({ path: 'usuarios/user-1/viajes/trip-old' });
    expect(profileBatch.set).toHaveBeenCalledWith(
      { path: 'usuarios/user-1' },
      MOCK_USER_PROFILES.empty,
      { merge: true }
    );
    expect(MOCK_USER_PROFILES.empty.hasCompletedOnboarding).toBe(false);
  });

  it('falls back to the default scenario for unknown values', async () => {
    const result = await seedDevData('user-1', 'does-not-exist');

    expect(result.scenario).toBe('mateo');
    expect(result.count).toBe(MOCK_TRIPS_MATEO.length);
  });

  it('returns a failed result without writing when the uid is missing', async () => {
    const result = await seedDevData(null, 'mateo');

    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(batchInstances).toHaveLength(0);
  });

  it('bails out early when the environment is not DEV', async () => {
    vi.stubEnv('DEV', false);

    const result = await seedDevData('user-1', 'mateo');

    expect(result.success).toBe(false);
    expect(batchInstances).toHaveLength(0);
    expect(getDocsMock).not.toHaveBeenCalled();
  });
});

describe('clearDevData', () => {
  beforeEach(() => {
    batchInstances.length = 0;
    getDocsMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('deletes every trip with its stops and resets the onboarding flag', async () => {
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          { id: 'trip-a', ref: { path: 'usuarios/user-1/viajes/trip-a' } },
          { id: 'trip-b', ref: { path: 'usuarios/user-1/viajes/trip-b' } }
        ]
      })
      .mockResolvedValue({
        docs: [{ id: 'parada-1', ref: { path: 'usuarios/user-1/viajes/trip-a/paradas/parada-1' } }]
      });

    const result = await clearDevData('user-1');

    expect(result).toEqual({ success: true, deletedCount: 2 });

    const deletePaths = batchInstances
      .flatMap((batch) => batch.delete.mock.calls)
      .map(([ref]) => ref.path);

    expect(deletePaths).toContain('usuarios/user-1/viajes/trip-a');
    expect(deletePaths).toContain('usuarios/user-1/viajes/trip-b');
    expect(deletePaths).toContain('usuarios/user-1/viajes/trip-a/paradas/parada-1');

    const profileBatch = batchInstances[batchInstances.length - 1];
    expect(profileBatch.set).toHaveBeenCalledWith(
      { path: 'usuarios/user-1' },
      expect.objectContaining({ hasCompletedOnboarding: false }),
      { merge: true }
    );
  });

  it('bails out early when the environment is not DEV', async () => {
    vi.stubEnv('DEV', false);

    const result = await clearDevData('user-1');

    expect(result).toEqual({ success: false, deletedCount: 0 });
    expect(batchInstances).toHaveLength(0);
  });
});
