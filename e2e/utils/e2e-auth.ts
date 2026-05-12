import { expect, type Page } from '@playwright/test';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_PROJECT_ID = 'keeptrip-app-b06b3';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';

/**
 * Resets or sets the global operational level in the Firestore emulator.
 * Uses the REST API with 'Bearer owner' to bypass security rules as an admin.
 */
export async function setOperationalLevel(page: Page, level: number) {
  const url = `http://${FIRESTORE_EMULATOR_HOST}/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/system/operational_flags`;
  
  const doc = {
    fields: {
      level: { integerValue: String(level) },
      app_readonly_mode: { booleanValue: level >= 3 },
      app_maintenance_mode: { booleanValue: level >= 4 },
      reason: { stringValue: `E2E reset to level ${level}` },
    },
  };

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner'
    },
    body: JSON.stringify(doc),
  });

  // Give the app a moment to receive the update via its Firestore listener if we are on a page
  // But don't use waitForTimeout, just continue; tests should wait for UI indicators anyway.
}

export async function createAuthUser(email: string, password = 'testpass', localId?: string) {
  console.log(`[E2E] Creating auth user ${email} (UID: ${localId || 'auto'})...`);
  const signUpResponse = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId, email, password, returnSecureToken: true }),
    }
  );
  const signUpJson = await signUpResponse.json();

  if (signUpJson?.error?.message === 'EMAIL_EXISTS' || signUpJson?.error?.message === 'ID_EXISTS') {
    console.log(`[E2E] User ${email} or UID ${localId} already exists, ensuring password match...`);
    // Note: in emulator, we can just proceed. If password differs, it might fail later.
    // We could call signInWithPassword here to get the UID if needed.
    const signInResponse = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const signInJson = await signInResponse.json();
    return signInJson;
  }

  if (signUpJson.error) {
    console.error(`[E2E] Failed to create user ${email}:`, signUpJson.error);
  }

  console.log(`[E2E] User ${email} created/ready. UID: ${signUpJson.localId}`);
  return signUpJson;
}

export async function e2eInitStorage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function mockAuthFlow(page: Page) {
  await page.route('https://api.mapbox.com/geocoding/**', async (route) => {
    const url = new URL(route.request().url());
    const query = decodeURIComponent(url.pathname.split('/').pop()?.replace('.json', '') || 'location');
    
    const fakeGeoJson = {
      type: 'FeatureCollection',
      query: [query],
      features: [
        {
          id: `place.${query}`,
          type: 'Feature',
          place_type: ['place'],
          text: query.charAt(0).toUpperCase() + query.slice(1),
          place_name: query.toLowerCase() === 'madrid' 
            ? 'Madrid, Comunidad de Madrid, España' 
            : `${query.charAt(0).toUpperCase() + query.slice(1)}, Earth`,
          center: [-3.7038, 40.4168],
          properties: {},
          context: [{ 
            id: query.toLowerCase() === 'madrid' ? 'country.esp' : 'country.usa', 
            text: query.toLowerCase() === 'madrid' ? 'España' : 'United States', 
            short_code: query.toLowerCase() === 'madrid' ? 'es' : 'us' 
          }],
        },
      ],
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeGeoJson),
    });
  });
}

export async function e2ePerformLogin(page: Page) {
  const email = `e2e-${Date.now()}@example.test`;
  const password = 'testpass';
  await createAuthUser(email, password);

  // Attach diagnostics listeners to capture console, errors, and failed requests during CI runs
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  const onConsole = (msg: any) => consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  const onPageError = (err: any) => pageErrors.push(String(err));
  const onRequestFailed = (req: any) => failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ''}`);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);

  await page.goto('/');

  // Wait for test helper to be injected and retry sign-in a few times if needed
  const helperTimeout = 20000;
  await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function', { timeout: helperTimeout });

  const waitForFirebaseAuthSession = async () => {
    await page.waitForFunction(() => {
      try {
        return Object.keys(window.localStorage).some((key) => key.startsWith('firebase:authUser:'));
      } catch (err) {
        return false;
      }
    }, { timeout: 30000 });

    await expect(page.getByTestId('header-login-button')).toHaveCount(0, { timeout: 30000 });
  };

  // Helper: consider sign-in successful when either the header avatar becomes visible
  // or Firebase Auth currentUser is available in the page context. This avoids flakiness
  // where UI avatar is hidden by styling/animations while auth state is already set.
  const checkAuthReady = async () => {
    return page.evaluate(() => {
      try {
        // Prefer direct Firebase Auth if available
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const fb = (window as any).firebase;
        const auth = fb?.auth?.();
        if (auth && auth.currentUser) return { auth: true, uid: auth.currentUser.uid };
      } catch (e) {
        // ignore
      }
      const avatar = document.querySelector('[data-testid="header-avatar"]');
      if (avatar) {
        const style = window.getComputedStyle(avatar as Element);
        const visible = style && style.visibility !== 'hidden' && style.display !== 'none' && (avatar as HTMLElement).offsetParent !== null;
        return { avatarPresent: true, avatarVisible: !!visible };
      }
      return { auth: false };
    });
  };

  // Trigger sign-in via the test helper
  await page.evaluate(
    ({ loginEmail, loginPassword }) =>
      (window as any).__test_signInWithEmail({ email: loginEmail, password: loginPassword }),
    { loginEmail: email, loginPassword: password }
  );
  
  // Robustly wait for the session to be established using native Playwright polling
  await waitForFirebaseAuthSession();

  // cleanup listeners
  page.removeListener('console', onConsole);
  page.removeListener('pageerror', onPageError);
  page.removeListener('requestfailed', onRequestFailed);
}

// Robust sign-in helper exported for specs to use
export async function signInInBrowser(page: Page, email: string, password = 'testpass') {
  console.log(`[E2E] Signing in as ${email}...`);
  try {
    await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function', { timeout: 30000 });
  } catch (err) {
    console.error(`[E2E] Test helper __test_signInWithEmail not found on page. Current URL: ${page.url()}`);
    throw err;
  }

  // Trigger sign-in and assert success
  const signInResult = await page.evaluate(({ email: e, password: p }) => (window as any).__test_signInWithEmail({ email: e, password: p }), { email, password });
  if (signInResult === false) {
    throw new Error(`Test sign-in helper returned false for ${email}`);
  }

  console.log(`[E2E] Sign-in call successful, waiting for auth session...`);
  try {
    await page.waitForFunction(() => {
      try {
        const auth = (window as any).__test_auth;
        return !!auth?.currentUser;
      } catch (err) {
        return false;
      }
    }, { timeout: 45000 });
  } catch (err) {
    const authState = await page.evaluate(() => {
      const auth = (window as any).__test_auth;
      return { exists: !!auth, hasUser: !!auth?.currentUser, uid: auth?.currentUser?.uid };
    });
    console.error(`[E2E] Auth session not found after 45s. State:`, authState);
    throw err;
  }

  await expect(page.getByTestId('header-login-button')).toHaveCount(0, { timeout: 30000 });
  console.log(`[E2E] Sign-in verified for ${email}`);
}

export async function stabilizeAuthenticatedSession(page: Page, email: string, password = 'testpass') {
  const loginButton = page.getByTestId('header-login-button');
  const userAvatar = page.getByTestId('header-avatar');
  const addTripBtn = page.getByTestId('add-trip-button');
  
  // Use a combined locator to wait for the page to be ready, regardless of viewport or login state
  const indicator = loginButton.or(userAvatar).or(addTripBtn).filter({ visible: true }).first();
  await expect(indicator).toBeVisible({ timeout: 30000 });
  
  if (await loginButton.isVisible()) {
    await signInInBrowser(page, email, password);
  }
  
  // If we are still on the landing page, navigate to dashboard to ensure AppShell is active
  if (page.url().endsWith('/') || page.url().endsWith('/landing')) {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  }

  // Wait for a visible indicator of being logged in after potential navigation.
  await expect(userAvatar.or(addTripBtn).filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
}

/**
 * Navigates to a path within the app, using soft navigation via window hook if available.
 * This prevents full page reloads which can destabilize the auth session in the emulator.
 */
export async function navigateInApp(page: Page, path: string) {
  // 1. Check if we can use soft navigation
  const hasNavigateHook = await page.evaluate(() => typeof (window as any).__test_navigate === 'function');
  
  if (hasNavigateHook) {
    await page.evaluate((p) => (window as any).__test_navigate(p), path);
  } else {
    // Fallback to hard navigation
    const baseURL = 'http://localhost:5173';
    await page.goto(`${baseURL}${path}`);
  }

  // 2. Wait for the URL to reflect the target path
  // We use a regex to handle optional query params and trailing slashes
  const pathRegex = new RegExp(`${path.replace('/', '\\/')}(?:\\?.*)?$`);
  await expect(page).toHaveURL(pathRegex, { timeout: 20000 });

  // 3. Robustly wait for the page to be ready
  // Hide any loader if present
  const loader = page.getByTestId('page-loader');
  await expect(loader).toBeHidden({ timeout: 20000 });
}

export async function e2eCleanupTrip(_page: Page, _tripId: string) {
  // No-op by design: emulator session is ephemeral for CI and local e2e runs.
}
