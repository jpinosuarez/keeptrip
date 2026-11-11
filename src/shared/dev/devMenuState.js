/**
 * DEV-only floating menu open/close store.
 *
 * Ephemeral (in-memory) UI state broadcast through a custom event so any DEV
 * surface (the floating trigger in AppScaffold, the profile bottom sheet) can
 * open the panel without prop drilling or adding dev state to app providers.
 */

export const DEV_MENU_EVENT = 'keeptrip-dev-menu-change';

let devMenuOpen = false;

export function isDevMenuOpen() {
  return devMenuOpen;
}

export function setDevMenuOpen(open) {
  const next = Boolean(open);
  if (next === devMenuOpen) return;
  devMenuOpen = next;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DEV_MENU_EVENT));
}
