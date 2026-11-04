// src/shared/dev/ensureDevSession.js
/**
 * One-click DEV session bootstrap (Phase B).
 *
 * Firestore rules only allow writing `usuarios/{uid}` when
 * `request.auth.uid === uid`, so the seeder cannot target an arbitrary UID.
 * This module therefore guarantees a session first:
 *
 *   1. Reuse `auth.currentUser` when a session already exists.
 *   2. Otherwise sign in with the emulator test credentials
 *      (`VITE_EMULATOR_TEST_EMAIL` / `VITE_EMULATOR_TEST_PASSWORD`).
 *   3. If the account does not exist yet, create it on the fly.
 *   4. Seed the requested scenario into the resolved account.
 *   5. Sync the local session/onboarding flags so the SPA boots straight into
 *      the right state (no hard reload → no `getAuth` sign-out loop).
 *
 * Strictly DEV-only (`import.meta.env.DEV`).
 */
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isEmulator } from '@shared/firebase';
import { seedDevData } from './seedDevData';

const SESSION_FLAG_KEY = 'keeptrip_has_session';
const ONBOARDED_FLAG_PREFIX = 'keeptrip_onboarded_';
const FALLBACK_DEV_EMAIL = 'dev@keeptrip.local';
const FALLBACK_DEV_PASSWORD = 'password123';

/** Resolves the DEV credentials (env override → deterministic fallback). */
export const getDevCredentials = () => ({
  email: import.meta.env.VITE_EMULATOR_TEST_EMAIL || FALLBACK_DEV_EMAIL,
  password: import.meta.env.VITE_EMULATOR_TEST_PASSWORD || FALLBACK_DEV_PASSWORD
});

/**
 * Keeps `localStorage` in sync with the seeded persona:
 *  - `keeptrip_has_session` avoids a landing flash for returning explorers.
 *  - `keeptrip_onboarded_{uid}` prevents the onboarding modal for `mateo`/`rich`
 *    and removes it for `empty` so the onboarding flow auto-opens.
 */
const syncLocalSessionFlags = (uid, scenario) => {
  if (typeof window === 'undefined' || !uid) return;
  try {
    window.localStorage.setItem(SESSION_FLAG_KEY, 'true');
    const onboardedKey = `${ONBOARDED_FLAG_PREFIX}${uid}`;
    if (scenario === 'empty') {
      window.localStorage.removeItem(onboardedKey);
    } else {
      window.localStorage.setItem(onboardedKey, 'true');
    }
  } catch {
    // Ignore storage access issues (private mode / strict policies).
  }
};

/**
 * @returns {Promise<import('firebase/auth').User>} an authenticated Firebase user
 */
const resolveDevAuthUser = async () => {
  if (auth.currentUser) return auth.currentUser;

  const { email, password } = getDevCredentials();

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (signInError) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      return user;
    } catch (createError) {
      console.error('[ensureDevSession] Could not sign in or provision the dev account', {
        email,
        signInError,
        createError
      });
      throw createError;
    }
  }
};

/**
 * Ensures a DEV session, seeds the requested persona and syncs local flags.
 * @param {'empty'|'mateo'|'rich'} [scenario]
 * @returns {Promise<{uid:string|null, scenario:string, count:number, success:boolean, deletedCount:number}>}
 */
export async function ensureDevSession(scenario = 'mateo') {
  if (!import.meta.env.DEV) {
    return { uid: null, scenario, count: 0, success: false, deletedCount: 0 };
  }

  if (!isEmulator) {
    console.warn(
      '[ensureDevSession] Firebase emulators are not active. Seeding will target the configured project — ' +
      'start the emulators (VITE_USE_FIREBASE_EMULATOR=true) before using DEV personas.'
    );
  }

  const user = await resolveDevAuthUser();
  const result = await seedDevData(user.uid, scenario);
  syncLocalSessionFlags(user.uid, result.scenario);

  return {
    uid: user.uid,
    scenario: result.scenario,
    count: result.count,
    success: result.success,
    deletedCount: result.deletedCount
  };
}

export default ensureDevSession;
