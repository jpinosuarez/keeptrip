import { expect, type Page } from '@playwright/test';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

async function createAuthUser(email: string, password = 'testpass') {
  const signUpResponse = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const signUpJson = await signUpResponse.json();

  if (signUpJson?.error?.message === 'EMAIL_EXISTS') {
    const signInResponse = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    return signInResponse.json();
  }

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
    const fakeGeoJson = {
      type: 'FeatureCollection',
      query: ['madrid'],
      features: [
        {
          id: 'place.madrid',
          type: 'Feature',
          place_type: ['place'],
          text: 'Madrid',
          place_name: 'Madrid, Comunidad de Madrid, España',
          center: [-3.7038, 40.4168],
          properties: {},
          context: [{ id: 'country.esp', text: 'España', short_code: 'es' }],
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

  await page.goto('/');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function');
    await page.evaluate(
      ({ loginEmail, loginPassword }) =>
        (window as any).__test_signInWithEmail({ email: loginEmail, password: loginPassword }),
      { loginEmail: email, loginPassword: password }
    );

    const onLanding = await page
      .getByRole('button', { name: /Log In|Iniciar sesion|Iniciar sesión/i })
      .isVisible()
      .catch(() => false);
    if (!onLanding) {
      break;
    }
  }

  await expect(page.getByTestId('header-avatar')).toBeVisible({ timeout: 15000 });
}

export async function e2eCleanupTrip(_page: Page, _tripId: string) {
  // No-op by design: emulator session is ephemeral for CI and local e2e runs.
}
