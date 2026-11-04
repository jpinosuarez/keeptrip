// src/shared/dev/seedDevData.js
/**
 * DEV-only Firestore seeder for the "Digital Travel Archive" mock personas.
 *
 * Contract (Phase A refactor):
 *   - Pure Firestore operations: NO `window.location.reload()`, no navigation.
 *     Callers own the side effects (toast + SPA navigation).
 *   - Every exported function returns a result object so the UI can report
 *     accurate counts and degrade gracefully on errors.
 *   - Strictly guarded by `import.meta.env.DEV`; production builds tree-shake
 *     the whole flow out (see DevLaunchDock / DevSeedControls lazy guards).
 *
 * Firestore rules require `request.auth.uid === userId` for `usuarios/{uid}`,
 * so the seeder can only ever write into the currently authenticated account.
 */
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@shared/firebase';
import {
  DEV_SCENARIOS,
  MOCK_TRIPS_BY_SCENARIO,
  MOCK_USER_PROFILES
} from './mockTravelerData';

const DEFAULT_SCENARIO = 'mateo';

/** Resolves any incoming scenario into a known one (defaults to `mateo`). */
export const normalizeDevScenario = (scenario) =>
  DEV_SCENARIOS.includes(scenario) ? scenario : DEFAULT_SCENARIO;

/**
 * Deletes every trip (and its `paradas` subcollection) owned by `userUid`.
 * One batch per trip keeps each commit small and avoids N+1 write loops.
 * @returns {Promise<number>} number of deleted trip documents
 */
const deleteAllUserTrips = async (userUid) => {
  const tripsSnap = await getDocs(collection(db, 'usuarios', userUid, 'viajes'));
  const tripDocs = tripsSnap?.docs || [];
  let deletedCount = 0;

  for (const tripDoc of tripDocs) {
    const paradasSnap = await getDocs(
      collection(db, 'usuarios', userUid, 'viajes', tripDoc.id, 'paradas')
    );
    const batch = writeBatch(db);
    (paradasSnap?.docs || []).forEach((paradaDoc) => batch.delete(paradaDoc.ref));
    batch.delete(tripDoc.ref);
    await batch.commit();
    deletedCount += 1;
  }

  return deletedCount;
};

/**
 * Seeds a mock persona into the current account.
 * @param {string} userUid - Authenticated uid (Firestore ownership is enforced by rules).
 * @param {'empty'|'mateo'|'rich'} [scenario]
 * @returns {Promise<{success:boolean, count:number, scenario:string, deletedCount:number}>}
 */
export async function seedDevData(userUid, scenario = DEFAULT_SCENARIO) {
  const resolvedScenario = normalizeDevScenario(scenario);

  if (!userUid || !import.meta.env.DEV) {
    return { success: false, count: 0, scenario: resolvedScenario, deletedCount: 0 };
  }

  try {
    const profile = MOCK_USER_PROFILES[resolvedScenario];
    const trips = MOCK_TRIPS_BY_SCENARIO[resolvedScenario] || [];

    // The `empty` persona must land on a truly empty archive (fresh onboarding).
    const deletedCount = resolvedScenario === 'empty'
      ? await deleteAllUserTrips(userUid)
      : 0;

    const batch = writeBatch(db);
    batch.set(doc(db, 'usuarios', userUid), profile, { merge: true });

    trips.forEach((trip) => {
      const { paradas, ...tripBase } = trip;
      batch.set(
        doc(db, 'usuarios', userUid, 'viajes', trip.id),
        { ...tripBase, ownerId: userUid },
        { merge: true }
      );
      (paradas || []).forEach((parada) => {
        batch.set(
          doc(db, 'usuarios', userUid, 'viajes', trip.id, 'paradas', parada.id),
          parada,
          { merge: true }
        );
      });
    });

    await batch.commit();

    return { success: true, count: trips.length, scenario: resolvedScenario, deletedCount };
  } catch (error) {
    console.error('[seedDevData] Failed to seed scenario', { scenario: resolvedScenario, error });
    return { success: false, count: 0, scenario: resolvedScenario, deletedCount: 0 };
  }
}

/**
 * Wipes every trip of the current account and resets the onboarding flag so the
 * onboarding flow can be replayed from scratch.
 * @param {string} userUid
 * @returns {Promise<{success:boolean, deletedCount:number}>}
 */
export async function clearDevData(userUid) {
  if (!userUid || !import.meta.env.DEV) {
    return { success: false, deletedCount: 0 };
  }

  try {
    const deletedCount = await deleteAllUserTrips(userUid);

    const batch = writeBatch(db);
    batch.set(
      doc(db, 'usuarios', userUid),
      { hasCompletedOnboarding: false, updatedAt: new Date() },
      { merge: true }
    );
    await batch.commit();

    return { success: true, deletedCount };
  } catch (error) {
    console.error('[clearDevData] Failed to wipe trips', error);
    return { success: false, deletedCount: 0 };
  }
}
