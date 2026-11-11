import { useEffect, useState } from 'react';

/**
 * DEV-only Gamification God Mode bridge.
 *
 * The override store and the simulation payloads are loaded through guarded
 * dynamic imports, so production builds contain neither the simulated
 * emblems/badges nor the `keeptrip_dev_god_mode` sessionStorage key.
 *
 * Returns `{ enabled, sim }`; in production it is always `{ enabled: false,
 * sim: null }`.
 */
export function useDevGodMode() {
  const [state, setState] = useState({ enabled: false, sim: null });

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    let active = true;
    let cleanup = null;

    Promise.all([
      import('@shared/dev/devGamificationOverride'),
      import('./devGodModeSimulation'),
    ])
      .then(([override, sim]) => {
        if (!active) return;
        const sync = () => setState({ enabled: override.isDevGodModeEnabled(), sim });
        sync();
        window.addEventListener(override.DEV_OVERRIDE_EVENT, sync);
        cleanup = () => window.removeEventListener(override.DEV_OVERRIDE_EVENT, sync);
      })
      .catch((error) => {
        console.warn('[useDevGodMode] DEV overrides unavailable', error);
      });

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, []);

  return state;
}
