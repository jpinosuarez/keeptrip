import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Configuracion por entorno (con fallback a valores actuales).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "keeptrip-app-b06b3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "keeptrip-app-b06b3",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "keeptrip-app-b06b3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcde"
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
const isTestEnv = import.meta.env.MODE === 'test';
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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

// Advertencia si las credenciales son de ejemplo o vacías
const missingFirebaseConfig = (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'demo-key' ||
  firebaseConfig.authDomain === '' ||
  firebaseConfig.projectId === ''
);

if (missingFirebaseConfig) {
  const message = '[Firebase] ⚠️ Las credenciales parecen ser de ejemplo o están vacías. Verifica tu archivo .env y configuración.';
  if (isTestEnv) {
    // Evita ruido en test output: la config demo es esperada en suites locales.
  } else if (useEmulators) {
    console.info(`${message} (Usas emulators, pero el SDK igual requiere config.)`);
  } else {
    console.warn(message);
  }
}

const app = initializeApp(firebaseConfig);
if (useEmulators && isLocalhost) {
  // Prevent stale persisted auth sessions from trying to refresh against emulator with demo config.
  clearStaleEmulatorAuthState();
}
const auth = getAuth(app);
// Inicializar Firestore con caché persistente multi-tab (offline-first).
// Usa IndexedDB para que queries funcionen sin conexión y escrituras se encolen.
const useMemoryCache = isTestEnv || useEmulators;
const firestoreSettings = {
  localCache: useMemoryCache
    ? memoryLocalCache()
    : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
};

if (useEmulators) {
  // Playwright + Emulator can intermittently fail WebChannel streams; long polling is more stable in CI/E2E.
  firestoreSettings.experimentalAutoDetectLongPolling = true;
  firestoreSettings.useFetchStreams = false;
}

const db = initializeFirestore(app, firestoreSettings);
const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Detectar localhost/127.0.0.1 y conectar a Emuladores
if (isLocalhost && useEmulators) {
  const EMULATOR_HOST = '127.0.0.1';
  if (!isTestEnv) {
    console.log(`🔧 Conectando a Firebase Emulators (${EMULATOR_HOST})...`);
  }
  // Nota: disableWarnings ayuda a limpiar la consola en desarrollo
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8081);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}

export { auth, db, storage };