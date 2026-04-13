import { test, expect } from '@playwright/test';
import { e2eInitStorage, e2ePerformLogin, e2eCleanupTrip, mockAuthFlow } from './utils/e2e-auth';

async function openSearchPalette(page) {
  const searchInputByRole = page.getByRole('textbox', { name: /Search|Buscar/i }).first();
  if (await searchInputByRole.isVisible().catch(() => false)) {
    return searchInputByRole;
  }

  const addTripButton = page
    .getByRole('button', { name: /Add Trip|Crear viaje|Agregar viaje|Registrar aventura/i })
    .first();
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

  const searchInputByPlaceholder = page
    .getByPlaceholder(/Type a country or city|Escribe un pais o ciudad|Escribe un país o ciudad|Type a country|ciudad/i)
    .first();

  if (await searchInputByRole.isVisible().catch(() => false)) {
    return searchInputByRole;
  }

  await expect(searchInputByPlaceholder).toBeVisible({ timeout: 15000 });
  return searchInputByPlaceholder;
}

test.describe('Duplicate city addition issue', () => {
  let initialTripId: string;

  test.beforeEach(async ({ page }) => {
    await e2eInitStorage(page);
    await mockAuthFlow(page);
    await e2ePerformLogin(page);
  });

  test.afterEach(async ({ page }) => {
    if (initialTripId) {
      await e2eCleanupTrip(page, initialTripId);
    }
  });

  test('Adding the same city TWICE to a trip does not cause duplicate key errors and saves successfully', async ({ page }) => {
    // Escuchar consola de React
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Encountered two children with the same key')) {
        errors.push(msg.text());
      }
    });

    // 1. Open global search palette and seed the first Madrid stop
    const paletteSearchInput = await openSearchPalette(page);
    await paletteSearchInput.fill('Madrid');

    const resultCard = page.locator('[data-testid^="search-result-place-"]').first();
    await expect(resultCard).toContainText(/Madrid/i, { timeout: 10000 });
    await resultCard.click();

    const reopenedTitleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await expect(reopenedTitleInput).toBeVisible({ timeout: 10000 });

    // 2. Save initial trip
    await page.getByRole('button', { name: /Save|Guardar/i }).first().click();
    await expect(page.getByRole('button', { name: /Madrid/i }).first()).toBeVisible({ timeout: 20000 });

    // Guardar ID si la ruta actual lo expone (puede variar según shell activo)
    const firstSaveUrl = new URL(page.url());
    initialTripId = firstSaveUrl.searchParams.get('editing') || '';

    // Reabrir el viaje creado para continuar la edición
    const createdTripButton = page.getByRole('button', { name: /Madrid/i }).first();
    await expect(createdTripButton).toBeVisible({ timeout: 10000 });
    await createdTripButton.click();

    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // 3. Add "Madrid" again from the city manager input
    const citySearchInput = page
      .getByPlaceholder(/Type the city name|Escribe el nombre de la ciudad/i)
      .first();
    await expect(citySearchInput).toBeVisible({ timeout: 10000 });
    await citySearchInput.fill('Madrid');

    const addDestinationButton = page.getByRole('button', { name: /Agregar destino|Add destination|Agregar|Add/i }).first();
    await expect(addDestinationButton).toBeVisible({ timeout: 10000 });
    await addDestinationButton.click({ force: true });
    
    // 4. Save the trip again
    await page.getByRole('button', { name: /Save|Guardar/i }).first().click();
    await expect(page.getByRole('button', { name: /Madrid/i }).first()).toBeVisible({ timeout: 15000 });

    // 5. Verify no key errors
    const keyErrors = errors.filter(e => e.includes('Encountered two children with the same key'));
    console.log('Key errors encountered:', keyErrors);
    expect(keyErrors).toHaveLength(0);
  });
});
