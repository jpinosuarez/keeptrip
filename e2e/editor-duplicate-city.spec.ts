import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';
import { openTripActionMenu } from './utils/trip-interactions';
import { createAuthUser, signInInBrowser, mockAuthFlow, setOperationalLevel } from './utils/e2e-auth';

test.beforeEach(async ({ page }) => {
  // Ensure the app is NOT in maintenance or search-paused mode from other concurrent tests
  await setOperationalLevel(page, 0);
});

async function openSearchPalette(page) {
  const searchInput = page.getByTestId('search-input');
  if (await searchInput.isVisible().catch(() => false)) {
    return searchInput;
  }

  const addTripButton = page
    .getByRole('button', { name: /Add Trip|Crear viaje|Agregar viaje|Registrar aventura/i })
    .first();
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

test.describe('Duplicate city addition issue', () => {
  test('Adding the same city TWICE to a trip does not cause duplicate key errors and saves successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `dupecity-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);
    await mockAuthFlow(page);
    await page.goto('/');
    await signInInBrowser(page, email, password);
    // Escuchar consola de React
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Encountered two children with the same key')) {
        errors.push(msg.text());
      }
    });

    // 1. Open global search palette and seed the first Madrid stop
    const paletteSearchInput = await openSearchPalette(page);
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('mapbox.places') && response.status() === 200
    );
    await paletteSearchInput.pressSequentially('Madrid', { delay: 100 });
    await responsePromise;

    const resultText = 'Madrid';
    const resultItem = page.getByText(resultText).first();
    await expect(resultItem).toBeVisible({ timeout: 15000 });
    await resultItem.click({ force: true });

    // 2. Wait for the editor panel to mount

    await expect(page.getByTestId('editor-focus-panel')).toBeVisible({ timeout: 15000 });

    // 2. Save initial trip
    await page.getByRole('button', { name: /Save|Guardar/i }).first().click();

    // Verify the editor closes completely and the trip card appears
    await expect(page.getByTestId('editor-focus-panel')).toHaveCount(0, { timeout: 15000 });
    const tripCard = page.locator('[data-testid^="trip-card-"]:not([data-testid*="menu"])').first();
    await expect(tripCard).toBeVisible({ timeout: 20000 });
    const tripCardTestId = await tripCard.getAttribute('data-testid');
    expect(tripCardTestId).toBeTruthy();
    const initialTripId = tripCardTestId!.replace('trip-card-', '');
    expect(initialTripId.length).toBeGreaterThan(0);
    await expect(page.getByLabel(/Trip title|Título del viaje/i)).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByLabel(/Madrid/i).first()).toBeVisible({ timeout: 20000 });

    // Reopen the created trip via UI action menu on the verified visible card
    await openTripActionMenu(page, tripCard, /Editar|Edit/i);

    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // 3. Add "Madrid" again from the city manager input
    const citySearchInput = page
      .getByPlaceholder(/Type the city name|Escribe el nombre de la ciudad/i)
      .first();
    await expect(citySearchInput).toBeVisible({ timeout: 10000 });
    await citySearchInput.fill('Madrid');

    const addDestinationButton = page
      .getByRole('button', { name: /^Add$/i })
      .first();
    await expect(addDestinationButton).toBeVisible({ timeout: 10000 });
    await addDestinationButton.click({ force: true });
    
    // 4. Save the trip again
    await page.getByRole('button', { name: /Save|Guardar/i }).first().click();
    await expect(page.getByLabel(/Madrid/i).first()).toBeVisible({ timeout: 15000 });

    // 5. Verify no key errors
    const keyErrors = errors.filter(e => e.includes('Encountered two children with the same key'));
    console.log('Key errors encountered:', keyErrors);
    expect(keyErrors).toHaveLength(0);
  });
});
