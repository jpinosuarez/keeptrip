/**
 * DEV-only Gamification God Mode toggle store.
 *
 * Kept dependency-free (shared layer) so both the DEV dock UI and the
 * gamification feature can read/write the same session state without breaking
 * the FSD rule that forbids `shared` → `features` imports. The simulation
 * payloads live in `@features/gamification/model/devGodModeSimulation`.
 *
 * sessionStorage is used (not localStorage) so the override dies with the tab.
 */

const DEV_OVERRIDE_KEY = 'keeptrip_dev_god_mode';

export const DEV_OVERRIDE_EVENT = 'keeptrip-dev-override-change';

export function isDevGodModeEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEV_OVERRIDE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDevGodMode(enabled) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.sessionStorage.setItem(DEV_OVERRIDE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(DEV_OVERRIDE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode / blocked cookies): the UI still
    // dispatches the event so listeners recompute from the safe default (false).
  }
  window.dispatchEvent(new Event(DEV_OVERRIDE_EVENT));
}
