import { test, expect } from '@playwright/test';
import { openTripActionMenu } from './utils/trip-interactions';
import { createAuthUser, signInInBrowser, stabilizeAuthenticatedSession, setOperationalLevel } from './utils/e2e-auth';

test.beforeEach(async ({ page }) => {
  // Ensure the app is NOT in maintenance or search-paused mode from other concurrent tests
  await setOperationalLevel(page, 0);
});



async function openSearchPalette(page, email: string, password: string) {
  await stabilizeAuthenticatedSession(page, email, password);

  const searchInput = page.getByTestId('search-input');
  if (await searchInput.isVisible().catch(() => false)) {
    return searchInput;
  }

  const addTripButton = page.getByRole('button', { name: /Add Trip|Crear viaje|Agregar viaje|Registrar aventura/i }).first();
  if (await addTripButton.isVisible().catch(() => false)) {
    await expect(addTripButton).toBeEnabled({ timeout: 10000 });
    await addTripButton.click();
  }

  if (!(await searchInput.isVisible().catch(() => false))) {
    const openSearchButton = page.getByRole('button', { name: /Open search|Abrir búsqueda/i }).first();
    if (await openSearchButton.isVisible().catch(() => false)) {
      await openSearchButton.click();
    }
  }

  if (!(await searchInput.isVisible().catch(() => false))) {
    await page.waitForFunction(() => typeof (window as any).__test_abrirSearchPalette === 'function');
    await page.evaluate(() => (window as any).__test_abrirSearchPalette());
  }

  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });
  return searchInput;
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

    // Intercept Mapbox API to avoid external dependency and return a stable result
    // Must be set up BEFORE navigation so all geocoding requests are captured
    await page.route('https://api.mapbox.com/geocoding/**', async (route) => {
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeGeoJson),
      });
    });

    await page.goto('/');
    await signInInBrowser(page, userEmail, password);

    // Assert no overflow style conflict warning appears
    await expect(consoleWarnings).not.toContainEqual(expect.stringContaining('Updating a style property during rerender (overflow)'));

    await stabilizeAuthenticatedSession(page, userEmail, password);

    // Open the search palette through real UI interactions and wait for the input.
    const searchInput = await openSearchPalette(page, userEmail, password);
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Capture the Mapbox response to ensure results are loaded
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('mapbox.places') && response.status() === 200
    );
    
    // Type a destination
    await searchInput.pressSequentially('New York', { delay: 100 });
    
    // Wait for the geocoding response
    await responsePromise;

    // Ensure the result is visible and click it (forced click to bypass potential overlays)
    const resultText = 'New York';
    const resultItem = page.getByText(resultText).first();
    await expect(resultItem).toBeVisible({ timeout: 15000 });
    await resultItem.click({ force: true });

    // Wait for the editor panel to mount
    await expect(page.getByTestId('editor-focus-panel')).toBeVisible({ timeout: 15000 });

    // Wait for the title input within the editor
    const titleInput = page.getByPlaceholder(/Trip Title|Título del viaje/i);
    await expect(titleInput).toBeVisible({ timeout: 15000 });

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
    const tripCardSelector = '[data-testid^="trip-card-"]:not([data-testid*="menu"])';
    await expect(page.locator(tripCardSelector).first()).toBeVisible({ timeout: 5000 });
    const tripCount = await page.locator(tripCardSelector).count();
    expect(tripCount).toBeGreaterThanOrEqual(1);

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
