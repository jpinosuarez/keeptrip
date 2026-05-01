import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';

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

async function signInInBrowser(page, email: string, password = 'testpass') {
  await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function');
  await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), {
    email,
    password,
  });
  await expect(page.getByTestId('header-avatar')).toBeVisible({ timeout: 15000 });
}

async function ensureAuthenticatedShell(page, email: string, password: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await signInInBrowser(page, email, password);
    const isOnLanding = await page
      .getByRole('button', { name: /Log In|Iniciar sesion|Iniciar sesión/i })
      .isVisible()
      .catch(() => false);

    if (!isOnLanding) {
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
    .getByPlaceholder(
      /Type a country or city|Escribe un pais o ciudad|Escribe un país o ciudad|Type a country|ciudad/i
    )
    .first();

  if (await searchInputByRole.isVisible().catch(() => false)) {
    return searchInputByRole;
  }

  await expect(searchInputByPlaceholder).toBeVisible({ timeout: 15000 });
  return searchInputByPlaceholder;
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

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('api.mapbox.com/geocoding')) {
        geocodingRequestCount += 1;
      }
    });

    await page.goto('/');

    const searchInput = await openSearchPalette(page, email, password);
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    geocodingRequestCount = 0;

    await searchInput.fill('');
    await searchInput.type('Mad', { delay: 170 });
    await page.waitForTimeout(500);

    await searchInput.type('rid', { delay: 80 });
    await page.waitForTimeout(500);

    await searchInput.press('Backspace');
    await page.waitForTimeout(500);

    await searchInput.type('d', { delay: 80 });
    await page.waitForTimeout(700);

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
    await page.waitForTimeout(1200);

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
