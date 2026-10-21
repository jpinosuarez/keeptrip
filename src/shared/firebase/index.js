import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signOut } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const isTestEnv = import.meta.env.MODE === 'test';
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isEmulatorRequested = 
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' || 
  import.meta.env.VITE_USE_EMULATORS === 'true';

// Emulators are strictly prohibited on non-localhost domains (e.g. *.web.app, *.firebaseapp.com)
export const isEmulator = isLocalhost && isEmulatorRequested;

const DEMO_KEY = ['demo', 'key'].join('-');
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const isDummyKey = rawApiKey === DEMO_KEY;

// Guardrail: Never fallback to dummy key on remote hosts.
const apiKey = isLocalhost
  ? (rawApiKey || DEMO_KEY)
  : (isDummyKey ? '' : rawApiKey);

if (!isLocalhost && (!apiKey || isDummyKey)) {
  console.error('[Firebase] Critical: Valid cloud VITE_FIREBASE_API_KEY is required on remote hosts.');
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "keeptrip-app-b06b3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "keeptrip-app-b06b3",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "keeptrip-app-b06b3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcde"
};

const clearStaleEmulatorAuthState = () => {
  if (!isBrowser) return;

  const appName = '[DEFAULT]';
  const storageKeys = [
    `firebase:authUser:${firebaseConfig.apiKey}:${appName}`,
    `firebase:redirectUser:${firebaseConfig.apiKey}:${appName}`,
  ];

  try {
    storageKeys.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  } catch {
    // Ignore storage access issues (private mode / strict policies).
  }
};

const missingFirebaseConfig = (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === DEMO_KEY ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
);

if (missingFirebaseConfig) {
  const message = '[Firebase] ⚠️ Credentials appear to be empty or placeholder. Check your .env and environment settings.';
  if (isTestEnv) {
    // Avoid noisy output during local test suites where placeholder config is expected.
  } else if (isEmulator) {
    console.debug(`${message} (Running with emulators; placeholder config is expected.)`);
  } else {
    console.warn(message);
  }
}

const app = initializeApp(firebaseConfig);

if (isEmulator) {
  // Prevent stale persisted auth sessions from trying to refresh against emulator with demo config.
  clearStaleEmulatorAuthState();
}

const auth = getAuth(app);

if (isEmulator) {
  // For emulator development, force a neutral session to avoid bad refresh token issues.
  signOut(auth).catch(() => {
    // Ignore when there is no initial session.
  });
}

// Initialize Firestore with persistent multi-tab cache (offline-first).
const useMemoryCache = isTestEnv || isEmulator;
const firestoreSettings = {
  localCache: useMemoryCache
    ? memoryLocalCache()
    : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
};

if (isEmulator) {
  // Playwright + Emulator can intermittently fail WebChannel streams; long polling is more stable in CI/E2E.
  firestoreSettings.experimentalAutoDetectLongPolling = true;
  firestoreSettings.useFetchStreams = false;
}

const db = initializeFirestore(app, firestoreSettings);
const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to emulators strictly if isEmulator is true
if (isEmulator) {
  const EMULATOR_HOST = '127.0.0.1';
  if (!isTestEnv) {
    console.log(`🔧 Connecting to Firebase Emulators (${EMULATOR_HOST})...`);
  }
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8081);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}

export { auth, db, storage };