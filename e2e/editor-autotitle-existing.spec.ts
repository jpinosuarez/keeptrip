import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

async function createAuthUser(email: string, password = 'testpass') {
  const signUpRes = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signUpJson = await signUpRes.json();

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

async function seedTripWithStops(page, ownerUid: string, tripId: string, title: string) {
  const tripWriteOk = await page.evaluate(({ ownerUid, tripId, title }) => {
    return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}`, {
      ownerId: ownerUid,
      titulo: title,
      nombreEspanol: 'Estados Unidos',
      code: 'US',
      paisCodigo: 'US',
      fechaInicio: '2026-03-01',
      fechaFin: '2026-03-10',
      sharedWith: [],
    });
  }, { ownerUid, tripId, title });
  expect(tripWriteOk).toBe(true);

  const stopsWriteOk = await page.evaluate(({ ownerUid, tripId }) => {
    return Promise.all([
      (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}/paradas/s1`, {
        nombre: 'New York',
        coordenadas: [-74.006, 40.7128],
        paisCodigo: 'US',
        fechaLlegada: '01/03/2026',
        fechaSalida: '05/03/2026',
      }),
      (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}/paradas/s2`, {
        nombre: 'Boston',
        coordenadas: [-71.0589, 42.3601],
        paisCodigo: 'US',
        fechaLlegada: '05/03/2026',
        fechaSalida: '10/03/2026',
      }),
    ]);
  }, { ownerUid, tripId });
  expect(stopsWriteOk.every(Boolean)).toBe(true);

  const seededTrip = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${tripId}`);
  expect(seededTrip?.titulo).toBe(title);
}


test.describe('Editor Auto-Title Reactivity (E2E)', () => {
  test('dynamically updates auto-title after regenerating and modifying stops', async ({ page }) => {
    const timestamp = Date.now();
    const email = `autotitle-${timestamp}@example.test`;
    const password = 'testpass';

    const user = await createAuthUser(email, password);
    const ownerUid = user.localId;
    const tripId = `autotitle-trip-${timestamp}`;
    const initialSavedTitle = 'My Custom Saved Title';

    // 1. Navigate and login
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/');
    await signInInBrowser(page, email, password);
    
    // 2. Seed an existing trip
    await seedTripWithStops(page, ownerUid, tripId, initialSavedTitle);
    
// 3. Open editor
    await openTripEditorById(page, tripId);
    
    // Existing trips now open in auto-title mode.
    // Verify the initial value is already the generated title from seeded stops.
    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await expect(titleInput).toHaveValue(/New York/);
    await expect(titleInput).toHaveValue(/Boston/);
    await expect(titleInput).not.toHaveValue(initialSavedTitle);

    // 5. Type to force manual mode
    await titleInput.fill('My Forced Manual Title');
    
    // 6. Click Regenerate (because now isTituloAuto is false)
    const regenerateBtn = page.getByRole('button', { name: /Generar|Regenerate/i });
    await regenerateBtn.click();

    // 6. Verify title is in auto mode (including New York and Boston)
    await expect(titleInput).toHaveValue(/New York/);
    await expect(titleInput).toHaveValue(/Boston/);

    // Get the exact value
    const autoTitleOne = await titleInput.inputValue();

    // 7. Delete a stop (Boston is the second one, so click the last trash icon)
    // Wait for the stop list to be visible and stable
    const stopItems = page.getByTestId('editor-stop-item');
    await expect(stopItems).toHaveCount(2);
    
    const secondStopDeleteBtn = stopItems.nth(1).getByTestId('editor-stop-delete');
    await secondStopDeleteBtn.click();
    
    // Confirm deletion if there's a modal, usually E2E uses direct trash click but 
    // maybe there's a confirmation modal? No, in standard it just deletes it.

    // Wait for stops to be 1
    await expect(stopItems).toHaveCount(1);

    // 8. STRICT ASSERTION: The title MUST change and NOT contain Boston anymore
    await expect(titleInput).not.toHaveValue(autoTitleOne);
    await expect(titleInput).not.toHaveValue(/Boston/);
    await expect(titleInput).toHaveValue(/New York/);
  });
});
