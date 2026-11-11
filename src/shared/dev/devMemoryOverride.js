/**
 * DEV-only Memory Capsule simulation toggle store.
 *
 * Dependency-free (shared layer) so the DEV dock UI and the memory capsule
 * hook can share one session state without `shared` → `features` imports.
 *
 * The active simulation mode lives in `sessionStorage` (mirrors
 * `devGamificationOverride`), so it dies with the tab. The "Seen Today" keys
 * live in `localStorage` (keyed by `keeptrip_memory_seen_<dateKey>`) because
 * they model the real retention state the product persists per day.
 */

export const DEV_MEMORY_OVERRIDE_KEY = 'keeptrip_dev_memory_mode';

export const DEV_MEMORY_OVERRIDE_EVENT = 'keeptrip-dev-memory-override-change';

export const VALID_DEV_MEMORY_MODES = [
  'auto',
  'exact_day',
  'same_month',
  'thematic_food',
  'thematic_view',
  'thematic_favorite_stop',
  'thematic_companions',
  'thematic_highlight',
];

const SEEN_TODAY_KEY_PREFIX = 'keeptrip_memory_seen_';

const canUseStorage = () => typeof window !== 'undefined';

const isBrowser = () => canUseStorage();

/**
 * Reads the active DEV simulation mode. Falls back to `'auto'` when storage is
 * unavailable or an unknown token was persisted.
 * @returns {string}
 */
export function getDevMemoryMode() {
  if (!isBrowser()) return 'auto';
  try {
    const stored = window.sessionStorage.getItem(DEV_MEMORY_OVERRIDE_KEY);
    return VALID_DEV_MEMORY_MODES.includes(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Persists the active DEV simulation mode and notifies every listener.
 * Invalid tokens are coerced to `'auto'` (never throws).
 * @param {string} mode
 * @returns {string} the effective mode
 */
export function setDevMemoryMode(mode) {
  const next = VALID_DEV_MEMORY_MODES.includes(mode) ? mode : 'auto';
  if (isBrowser()) {
    try {
      if (next === 'auto') {
        window.sessionStorage.removeItem(DEV_MEMORY_OVERRIDE_KEY);
      } else {
        window.sessionStorage.setItem(DEV_MEMORY_OVERRIDE_KEY, next);
      }
    } catch {
      // Storage can be unavailable (private mode): listeners still recompute
      // from the safe default (`'auto'`).
    }
    window.dispatchEvent(new Event(DEV_MEMORY_OVERRIDE_EVENT));
  }
  return next;
}

/**
 * Clears every "Seen Today" marker so the DEV dock can instantly replay the
 * memory card, then notifies listeners.
 */
export function resetSeenToday() {
  if (!isBrowser()) return;
  try {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(SEEN_TODAY_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage failures: the UI still refreshes from the default state.
  }
  window.dispatchEvent(new Event(DEV_MEMORY_OVERRIDE_EVENT));
}

/**
 * Subscribes to any DEV memory override change (mode switch or seen reset).
 * @param {() => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeDevMemoryOverride(callback) {
  if (!isBrowser() || typeof callback !== 'function') return () => {};
  window.addEventListener(DEV_MEMORY_OVERRIDE_EVENT, callback);
  return () => window.removeEventListener(DEV_MEMORY_OVERRIDE_EVENT, callback);
}
