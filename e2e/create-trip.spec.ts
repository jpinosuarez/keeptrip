import { test, expect } from '@playwright/test';
import { openTripActionMenu } from './utils/trip-interactions';

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

async function signInInBrowser(page, email: string, password = 'testpass') {
  await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function');
  await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email, password });
  await expect(page.getByTestId('header-avatar')).toBeVisible({ timeout: 15000 });
}

async function ensureAuthenticatedShell(page, email: string, password: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await signInInBrowser(page, email, password);
    const onLanding = await page.getByRole('button', { name: /Log In|Iniciar sesion|Iniciar sesión/i }).isVisible().catch(() => false);
    if (!onLanding) {
      return;
    }
  }

  throw new Error('Could not stabilize an authenticated app shell session.');
}

async function openSearchPalette(page, email: string, password: string) {
  await ensureAuthenticatedShell(page, email, password);

  const searchInputByRole = page.getByRole('textbox', { name: /Search|Buscar/i }).first();
  if (await searchInputByRole.isVisible().catch(() => false)) {
    return searchInputByRole;
  }

  const addTripButton = page.getByRole('button', { name: /Add Trip|Crear viaje|Agregar viaje|Registrar aventura/i }).first();
  if (await addTripButton.isVisible().catch(() => false)) {
    await expect(addTripButton).toBeEnabled({ timeout: 10000 });
    await addTripButton.click();
  }

  if (!(await searchInputByRole.isVisible().catch(() => false))) {
    const openSearchButton = page.getByRole('button', { name: /Open search|Abrir búsqueda/i }).first();
    if (await openSearchButton.isVisible().catch(() => false)) {
      await openSearchButton.click();
    }
  }

  if (!(await searchInputByRole.isVisible().catch(() => false))) {
    await page.waitForFunction(() => typeof (window as any).__test_abrirSearchPalette === 'function');
    await page.evaluate(() => (window as any).__test_abrirSearchPalette());
  }

  const searchInputByPlaceholder = page.getByPlaceholder(/Type a country or city|Escribe un pais o ciudad|Escribe un país o ciudad|Type a country|ciudad/i).first();

  if (await searchInputByRole.isVisible().catch(() => false)) {
    return searchInputByRole;
  }

  await expect(searchInputByPlaceholder).toBeVisible({ timeout: 15000 });
  return searchInputByPlaceholder;
}

test.describe('Create trip from search modal (E2E)', () => {
  test('search modal selection opens editor and create trip persists document', async ({ page }) => {
    const timestamp = Date.now();
    const userEmail = `creator-flow-${timestamp}@example.test`;
    const password = 'testpass';
    await createAuthUser(userEmail, password);

    const consoleWarnings = [];
    page.on('console', (message) => {
      if (['warning', 'error', 'log'].includes(message.type())) {
        consoleWarnings.push(`[${message.type()}] ${message.text()}`);
      }
    });

    await page.goto('/');
    await signInInBrowser(page, userEmail, password);

    // Assert no overflow style conflict warning appears
    await expect(consoleWarnings).not.toContainEqual(expect.stringContaining('Updating a style property during rerender (overflow)'));

    await ensureAuthenticatedShell(page, userEmail, password);

    // Intercept Mapbox API to avoid external dependency and return a stable result
    await page.route('https://api.mapbox.com/**', (route) => {
      const fakeGeoJson = {
        type: 'FeatureCollection',
        query: ['new', 'york'],
        features: [
          {
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            text: 'New York',
            place_name: 'New York, New York, United States',
            center: [-74.006, 40.7128],
            properties: {},
            context: [
              { id: 'country.usa', text: 'United States', short_code: 'us' },
            ],
          },
        ],
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeGeoJson),
      });
    });

    // Open the search palette through real UI interactions and wait for the input.
    const searchInput = await openSearchPalette(page, userEmail, password);
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Type a destination and wait for the result to appear
    await searchInput.fill('New York');

    // Wait for the first search result to appear and click it
    const resultCard = page.locator('[data-testid^="search-result-place-"]').first();
    await expect(resultCard).toContainText(/New York/i, { timeout: 10000 });
    await resultCard.click();

    // Wait for the editor to open (trip title input should appear)
    const titleInput = page.getByPlaceholder(/Trip Title|Título del viaje/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Validate sticky top action bar is visible and title is auto-populated from search selection
    await expect(page.getByRole('button', { name: /Cancel|Cancelar/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Save|Guardar/i }).first()).toBeVisible();
    await expect(titleInput).not.toHaveValue('');
    await expect(titleInput).toHaveValue(/Escapada a New York|New York|E2E Trip/);
    const citySearchInput = page.getByPlaceholder(/Type the city name|Escribe el nombre de la ciudad/i).first();
    if (await citySearchInput.count() > 0) {
      await citySearchInput.fill('Paris');
      // Wait for results and verify the CTA text
      const cityAddBtn = page.getByRole('button', { name: /Agregar|Add/ }).first();
      await expect(cityAddBtn).toBeVisible({ timeout: 10000 });
      await expect(cityAddBtn).toContainText(/Agregar|Add/);
    }

    // Ensure no raw key jargon fallback text is exposed in the UI
    await expect(page.locator('text=button.add')).toHaveCount(0);
    await expect(page.locator('text=common:add')).toHaveCount(0);

    // Verify cover UI only when this editor variant exposes the control.
    const changeCoverControl = page.getByLabel(/Cambiar portada|Change cover|gallery\.changeCover/i).first();
    if (await changeCoverControl.count()) {
      await expect(changeCoverControl).toBeVisible({ timeout: 10000 });
    }

    // Provide a title and save
    await titleInput.fill('E2E Trip');
    const saveBtn = page.getByRole('button', { name: /Save|Guardar/i }).first();
    await saveBtn.click();

    // Wait for the editor to close and the trip to appear in the grid
    await expect(page.getByLabel(/E2E Trip/i).first()).toBeVisible({ timeout: 20000 });

    // Close any celebration modals that appear
    const closeModals = async () => {
      // Close level-up modal
      const levelUpModal = page.locator('text=New Level!');
      if (await levelUpModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: /Next|Siguiente/i }).first().click();
        await expect(levelUpModal).toHaveCount(0, { timeout: 2000 });
      }

      // Close achievement modal
      const achievementModal = page.locator('text=Achievement unlocked!');
      if (await achievementModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: /Great|Genial|Excelente/i }).first().click();
        await expect(achievementModal).toHaveCount(0, { timeout: 2000 });
      }

      // Close expedition summary modal (appears on big unlock bursts)
      const expeditionModal = page.locator('text=Expedition Summary!');
      if (await expeditionModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: /Amazing|Increíble|Asombroso/i }).first().click();
        await expect(expeditionModal).toHaveCount(0, { timeout: 2000 });
      }
    };

    // Close modals multiple times in case multiple achievements trigger
    await closeModals();
    await closeModals();
    await closeModals();

    // Ensure the trip list is reactive without forcing a hard reload.
    await expect(page.locator('text=Your logbook has no stops yet')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-testid^="trip-card-"]')).toHaveCount(1, { timeout: 5000 });

    await closeModals();

    // Open the newly created trip via real user interaction and verify editor state.
    const createdTripCard = page.locator('[data-testid^="trip-card-"]').first();
    await expect(createdTripCard).toBeVisible({ timeout: 10000 });
    await openTripActionMenu(page, createdTripCard, /Editar|Edit/i);

    const existingTitleInput = page.getByPlaceholder(/Trip Title|Título del viaje/i);
    await expect(existingTitleInput).toBeVisible({ timeout: 10000 });

    await expect(existingTitleInput).not.toHaveValue('');

    // Update title to ensure changes persist and UI reflects update
    await existingTitleInput.fill('E2E Trip Edited');
    const saveUpdatedBtn = page.getByRole('button', { name: /Save|Guardar/i }).first();
    await saveUpdatedBtn.click();
    await expect(page.getByLabel(/E2E Trip Edited/i).first()).toBeVisible({ timeout: 15000 });
  });
});
