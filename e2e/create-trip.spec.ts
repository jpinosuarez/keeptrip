import { test, expect } from '@playwright/test';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

async function createAuthUser(email: string, password = 'testpass') {
  const signUpRes = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signUpJson = await signUpRes.json();

  // If the user already exists, sign them in to reuse the account.
  if (signUpJson?.error?.message === 'EMAIL_EXISTS') {
    const signInRes = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    return signInRes.json();
  }

  return signUpJson;
}

test.describe('Create trip from search modal (E2E)', () => {
  test('search modal selection opens editor and create trip persists document', async ({ page }) => {
    const timestamp = Date.now();
    const userEmail = `creator-flow-${timestamp}@example.test`;
    const password = 'testpass';
    await createAuthUser(userEmail, password);

    await page.goto('/');
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: userEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.goto('/trips');
    await page.waitForURL('**/trips');

    // Wait for the empty state or trip grid to appear
    await page.waitForTimeout(2000); // Give time for data to load

    await page.evaluate(() => (window as any).__test_abrirBuscador());
    await page.waitForSelector('text=New destination');

    // Pick a hardcoded popular city to avoid external geocoding dependencies.
    await page.getByRole('button', { name: /New York/i }).click();

    await page.waitForSelector('text=Photo Gallery');

    const createTripBtn = page.locator('button').filter({ hasText: /Crear viaje|Create Trip|button\.createTrip/i }).first();
    await createTripBtn.click({ force: true });

    // Wait for the modal to close and trip to be created
    await page.waitForTimeout(3000);

    // Close any celebration modals that appear
    const closeModals = async () => {
      // Close level-up modal
      const levelUpModal = page.locator('text=New Level!');
      if (await levelUpModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: 'Next →' }).click();
        await page.waitForTimeout(500);
      }

      // Close achievement modal
      const achievementModal = page.locator('text=Achievement unlocked!');
      if (await achievementModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: 'Great! 🎉' }).click();
        await page.waitForTimeout(500);
      }
    };

    // Close modals multiple times in case multiple achievements trigger
    await closeModals();
    await closeModals();
    await closeModals();

    // Force a page reload to ensure Firestore listeners update
    await page.reload();
    await page.waitForSelector('[data-testid="header-avatar"]');
    await page.goto('/trips');
    await page.waitForURL('**/trips');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Your logbook has no stops yet')).toHaveCount(0, { timeout: 15000 });
    await expect((await page.locator('[data-testid^="trip-card-"]').count())).toBeGreaterThan(0);
  });

  test.skip('search modal country selection creates a trip', async ({ page }) => {
    const timestamp = Date.now();
    const userEmail = `creator-country-${timestamp}@example.test`;
    const password = 'testpass';
    await createAuthUser(userEmail, password);

    await page.goto('/');
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: userEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.goto('/trips');
    await page.waitForURL('**/trips');

    const addTripButton = page.getByRole('button', { name: /Add Trip|Register first stop|Registrar primera parada/i }).first();
    await addTripButton.click();
    await page.waitForSelector('text=Search destinationsions');

    // Pick a hardcoded popular country to exercise the esPais=true path.
    await page.getByRole('button', { name: /Argentina/i }).click();

    await page.waitForSelector('text=Photo Gallery');

    const createTripBtn = page.locator('button').filter({ hasText: /Crear viaje|Create Trip|button\.createTrip/i }).first();
    await createTripBtn.click({ force: true });

    await expect(page.locator('text=Your logbook has no stops yet')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('[data-testid^="trip-card-"]')).toHaveCount(1, { timeout: 15000 });
  });
});
