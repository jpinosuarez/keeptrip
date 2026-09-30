import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';
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

async function seedTripWithStops(page, ownerUid: string, tripId: string, title: string) {
  const tripWriteOk = await page.evaluate(
    ({ ownerUid, tripId, title }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}`, {
        ownerId: ownerUid,
        titulo: title,
        nombreEspanol: 'Audit City',
        code: 'ES',
        paisCodigo: 'ES',
        fechaInicio: '2026-04-01',
        fechaFin: '2026-04-10',
        sharedWith: [],
      });
    },
    { ownerUid, tripId, title }
  );
  expect(tripWriteOk).toBe(true);

  const stopsWriteOk = await page.evaluate(
    ({ ownerUid, tripId }) => {
      return Promise.all([
        (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}/paradas/s1`, {
          nombre: 'Madrid',
          coordenadas: [-3.7038, 40.4168],
          paisCodigo: 'ES',
          fechaLlegada: '01/04/2026',
          fechaSalida: '05/04/2026',
        }),
        (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}/paradas/s2`, {
          nombre: 'Barcelona',
          coordenadas: [2.1734, 41.3851],
          paisCodigo: 'ES',
          fechaLlegada: '05/04/2026',
          fechaSalida: '10/04/2026',
        }),
      ]);
    },
    { ownerUid, tripId }
  );

  expect(stopsWriteOk.every(Boolean)).toBe(true);
}



test.describe('Cost-security architecture audit', () => {
  test('Mapbox geocoding cache keeps repeated Madrid re-types under threshold', async ({ page }) => {
    const timestamp = Date.now();
    const email = `cost-mapbox-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);

    let geocodingRequestCount = 0;

    // Intercept Mapbox geocoding requests — return fake data but still count them
    // to verify caching behavior without requiring a real API token
    await page.route('https://api.mapbox.com/geocoding/**', async (route) => {
      geocodingRequestCount += 1;
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

    await page.goto('/');

    const searchInput = await openSearchPalette(page, email, password);
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    geocodingRequestCount = 0;

    await searchInput.fill('');
    await searchInput.pressSequentially('Mad', { delay: 170 });

    // Wait for search results to appear (signals the debounce + API call completed)
    const resultsList = page.locator('[data-testid^="search-result-"]', { hasText: /Madrid/i }).first();
    await resultsList.waitFor({ state: 'visible', timeout: 15000 });

    await searchInput.pressSequentially('rid', { delay: 80 });

    // Wait for results to update
    await expect(page.locator('[data-testid^="search-result-"]', { hasText: /Madrid/i }).first()).toBeVisible({ timeout: 10000 });

    await searchInput.press('Backspace');

    // Wait for results to update after backspace
    await expect(page.locator('[data-testid^="search-result-"]', { hasText: /Madrid/i }).first()).toBeVisible({ timeout: 10000 });

    await searchInput.pressSequentially('d', { delay: 80 });

    // Final wait for results to settle
    await expect(page.locator('[data-testid^="search-result-"]', { hasText: /Madrid/i }).first()).toBeVisible({ timeout: 10000 });

    expect(geocodingRequestCount).toBeGreaterThan(0);
    expect(geocodingRequestCount).toBeLessThanOrEqual(3);
  });

  test('Firestore save of title-only edit keeps stop writes bounded to seeded stops', async ({ page }) => {
    const timestamp = Date.now();
    const email = `cost-firestore-${timestamp}@example.test`;
    const password = 'testpass';

    const user = await createAuthUser(email, password);
    const ownerUid = user.localId;
    const tripId = `cost-audit-trip-${timestamp}`;
    const updatedTitle = 'Cost Audit - Title Only';

    await page.goto('/');
    await signInInBrowser(page, email, password);
    await seedTripWithStops(page, ownerUid, tripId, 'Cost Audit Initial Title');
    await openTripEditorById(page, tripId);

    const firestoreWritePayloads: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      const isFirestoreWriteRequest =
        /google\.firestore\.v1\.Firestore\/(Write|Commit)/i.test(url) || /:commit\b/i.test(url);

      if (isFirestoreWriteRequest && request.method() === 'POST') {
        firestoreWritePayloads.push(request.postData() || '');
      }
    });

    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill(updatedTitle);

    const saveButton = page.getByRole('button', { name: /Save|Guardar/i }).first();
    await expect(saveButton).toBeEnabled();

    firestoreWritePayloads.length = 0;
    await saveButton.click();

    await expect(titleInput).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);

    // Wait for Firestore writes to be captured
    await expect.poll(() => firestoreWritePayloads.length, {
      message: 'Wait for Firestore write payloads to be captured',
      timeout: 15000,
    }).toBeGreaterThan(0);

    const combinedPayload = firestoreWritePayloads.join('\n');
    const decodedPayload = decodeURIComponent(combinedPayload);
    const writesForTripRoot = firestoreWritePayloads.filter((payload) => {
      const text = decodeURIComponent(payload || '');
      return text.includes(`usuarios/${ownerUid}/viajes/${tripId}`);
    });
    const stopPathPrefix = `usuarios/${ownerUid}/viajes/${tripId}/paradas/`;
    const stopWriteMatches = decodedPayload.match(new RegExp(stopPathPrefix, 'g')) || [];

    expect(writesForTripRoot.length).toBeGreaterThanOrEqual(1);
    expect(decodedPayload).toContain(`usuarios/${ownerUid}/viajes/${tripId}`);
    expect(stopWriteMatches.length).toBeLessThanOrEqual(2);
    expect(decodedPayload).not.toContain(`${stopPathPrefix}s3`);
  });
});
