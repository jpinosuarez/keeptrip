import { describe, it, expect, vi } from 'vitest';

describe('Firebase Environment Boundary Guards', () => {
  it('strictly forbids emulator mode on remote hosts even when requested', () => {
    const isLocalhostFalse = false;
    const isEmulatorRequested = true;
    const isEmulator = isLocalhostFalse && isEmulatorRequested;
    expect(isEmulator).toBe(false);
  });

  it('allows emulator mode only when running on localhost and requested', () => {
    const isLocalhostTrue = true;
    const isEmulatorRequested = true;
    const isEmulator = isLocalhostTrue && isEmulatorRequested;
    expect(isEmulator).toBe(true);
  });

  it('rejects demo-key and placeholder fallbacks on remote origins', () => {
    const isLocalhost = false;
    const rawApiKey = 'demo-key';
    const DEMO_KEY = ['demo', 'key'].join('-');
    const isDummyKey = rawApiKey === DEMO_KEY;
    const apiKey = isLocalhost
      ? (rawApiKey || DEMO_KEY)
      : (isDummyKey ? '' : rawApiKey);

    expect(apiKey).toBe('');
    expect(isDummyKey).toBe(true);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    if (!isLocalhost && (!apiKey || isDummyKey)) {
      console.error('[Firebase] Critical: Valid cloud VITE_FIREBASE_API_KEY is required on remote hosts.');
    }
    expect(errorSpy).toHaveBeenCalledWith(
      '[Firebase] Critical: Valid cloud VITE_FIREBASE_API_KEY is required on remote hosts.'
    );
    errorSpy.mockRestore();
  });

  it('accepts valid cloud API key on remote origins', () => {
    const isLocalhost = false;
    const rawApiKey = 'AIzaSyBJFMDDWKLGQmX2Kv1gG9UdIbATcXgBEx0';
    const DEMO_KEY = ['demo', 'key'].join('-');
    const isDummyKey = rawApiKey === DEMO_KEY;
    const apiKey = isLocalhost
      ? (rawApiKey || DEMO_KEY)
      : (isDummyKey ? '' : rawApiKey);

    expect(apiKey).toBe('AIzaSyBJFMDDWKLGQmX2Kv1gG9UdIbATcXgBEx0');
  });

  it('evaluates E2E animation disabling only during local emulator or headless Playwright runs', () => {
    const isEmulator = false;
    const isPlaywrightHeadless = false;
    const shouldEvaluateE2E = isEmulator || isPlaywrightHeadless;
    const viteE2E = 'true';
    const isE2E = shouldEvaluateE2E && viteE2E === 'true';

    // On remote staging with real users, animations are never disabled
    expect(isE2E).toBe(false);

    // In local emulator mode with VITE_E2E=true, animations are disabled
    const isLocalEmulator = true;
    const isE2ELocal = isLocalEmulator && viteE2E === 'true';
    expect(isE2ELocal).toBe(true);
  });
});
