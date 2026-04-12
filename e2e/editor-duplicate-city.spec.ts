import { test, expect } from '@playwright/test';
import { e2eInitStorage, e2ePerformLogin, e2eCleanupTrip, mockAuthFlow } from './utils/e2e-auth';

test.describe('Duplicate city addition issue', () => {
  let initialTripId: string;

  test.beforeEach(async ({ page }) => {
    await e2eInitStorage(page);
    await mockAuthFlow(page);
    await e2ePerformLogin(page);
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard**');
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

    // 1. Create a trip
    await page.locator('[data-testid="create-trip-fab"], [data-testid="desktop-new-trip-btn"]').first().click();
    await page.waitForSelector('[data-testid="city-manager-search"]');
    
    // 2. Search for "Madrid"
    await page.fill('[data-testid="city-manager-search"]', 'Madrid');
    await page.waitForSelector('text=+ Agregar destino');
    await page.locator('text=+ Agregar destino').first().click();

    // 3. Save the trip
    await page.click('[data-testid="editor-save-btn"]');
    await page.waitForSelector('text=Viaje guardado exitosamente');

    // Guardar el ID del viaje creado leyendo la URL
    await page.waitForURL(/.*editing=.+/);
    const url = new URL(page.url());
    initialTripId = url.searchParams.get('editing') || '';

    // 4. Search for "Madrid" AGAIN
    await page.fill('[data-testid="city-manager-search"]', 'Madrid');
    await page.waitForSelector('text=+ Agregar destino');
    
    // 5. Add "Madrid" a second time
    await page.locator('text=+ Agregar destino').first().click();
    
    // 6. Save the trip again
    await page.click('[data-testid="editor-save-btn"]');
    await page.waitForSelector('text=Viaje actualizado exitosamente');

    // 7. Verify no key errors
    const keyErrors = errors.filter(e => e.includes('Encountered two children with the same key'));
    console.log('Key errors encountered:', keyErrors);
    expect(keyErrors).toHaveLength(0);
  });
});
