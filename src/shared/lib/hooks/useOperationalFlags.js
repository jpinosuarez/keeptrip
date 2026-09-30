import { useSyncExternalStore } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@shared/firebase';

const OPERATIONAL_FLAGS_PATH = ['system', 'operational_flags'];
const MIN_OPERATIONAL_LEVEL = 0;
const MAX_OPERATIONAL_LEVEL = 4;

export const DEFAULT_OPERATIONAL_FLAGS = Object.freeze({
  level: 0,
  appReadonlyMode: false,
  appMaintenanceMode: false,
  messageEs: '',
  messageEn: '',
  reason: '',
  updatedBy: null,
  updatedAt: null,
  source: 'fallback',
});

export const OPERATIONAL_WRITES_DISABLED_ERROR =
  '[OPERATIONAL] Firebase writes are temporarily disabled by Admin.';

const DEFAULT_HOOK_STATE = Object.freeze({
  flags: DEFAULT_OPERATIONAL_FLAGS,
  loading: true,
  error: null,
});

let currentState = DEFAULT_HOOK_STATE;
let firestoreUnsubscribe = null;
const subscribers = new Set();

const emitChange = () => {
  subscribers.forEach((callback) => callback());
};

const setState = (nextState) => {
  currentState = nextState;
  emitChange();
};

const normalizeLevel = (inputLevel) => {
  const parsedLevel = Number(inputLevel);
  if (!Number.isInteger(parsedLevel)) return DEFAULT_OPERATIONAL_FLAGS.level;
  if (parsedLevel < MIN_OPERATIONAL_LEVEL || parsedLevel > MAX_OPERATIONAL_LEVEL) {
    return DEFAULT_OPERATIONAL_FLAGS.level;
  }
  return parsedLevel;
};

const normalizeOperationalFlags = (rawFlags = {}) => {
  return {
    ...DEFAULT_OPERATIONAL_FLAGS,
    level: normalizeLevel(rawFlags.level),
    appReadonlyMode: Boolean(rawFlags.app_readonly_mode),
    appMaintenanceMode: Boolean(rawFlags.app_maintenance_mode),
    messageEs: typeof rawFlags.message_es === 'string' ? rawFlags.message_es : '',
    messageEn: typeof rawFlags.message_en === 'string' ? rawFlags.message_en : '',
    reason: typeof rawFlags.reason === 'string' ? rawFlags.reason : '',
    updatedBy: typeof rawFlags.updated_by === 'string' ? rawFlags.updated_by : null,
    updatedAt: rawFlags.updated_at ?? null,
    source: 'firestore',
  };
};

const startGlobalListener = () => {
  if (firestoreUnsubscribe || typeof window === 'undefined') return;

  const operationalFlagsRef = doc(db, ...OPERATIONAL_FLAGS_PATH);
  firestoreUnsubscribe = onSnapshot(
    operationalFlagsRef,
    (snapshot) => {
      const flags = snapshot.exists()
        ? normalizeOperationalFlags(snapshot.data())
        : DEFAULT_OPERATIONAL_FLAGS;

      setState({ flags, loading: false, error: null });
    },
    (error) => {
      setState({ flags: DEFAULT_OPERATIONAL_FLAGS, loading: false, error });
    }
  );
};

const stopGlobalListenerIfIdle = () => {
  // Intentionally leaving the listener alive.
  // Unsubscribing during fast route transitions causes Firebase Emulator crash (ID: ca9).
};

const subscribe = (callback) => {
  subscribers.add(callback);
  startGlobalListener();

  return () => {
    subscribers.delete(callback);
    stopGlobalListenerIfIdle();
  };
};

const getSnapshot = () => currentState;
const getServerSnapshot = () => DEFAULT_HOOK_STATE;

export const ensureOperationalFlagsListener = () => {
  startGlobalListener();
};

export const getOperationalFlagsSnapshot = () => currentState.flags;

export const getOperationalLevelSnapshot = () => currentState.flags.level;

export const isOperationalReadOnlySnapshot = () => {
  const flags = getOperationalFlagsSnapshot();
  const level = Number(flags?.level || 0);
  return Boolean(flags?.appReadonlyMode) || level >= 3;
};

export const assertOperationalWritesEnabled = () => {
  ensureOperationalFlagsListener();
  if (!isOperationalReadOnlySnapshot()) return;

  const error = new Error(OPERATIONAL_WRITES_DISABLED_ERROR);
  error.name = 'OperationalReadOnlyError';
  throw error;
};

export const useOperationalFlags = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
