import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';
import { createAuthUser, signInInBrowser } from './utils/e2e-auth';

async function seedTripWithStops(page, ownerUid: string, tripId: string, title: string) {
  const tripWriteOk = await page.evaluate(({ ownerUid, tripId, title }) => {
    return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}`, {
      ownerId: ownerUid,
      titulo: title,
      nombreEspanol: 'Editor City',
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


test.describe('Editor flow (E2E)', () => {
  test('shows unsaved changes confirmation and supports keep editing + discard', async ({ page }) => {
    const timestamp = Date.now();
    const email = `editor-flow-${timestamp}@example.test`;
    const password = 'testpass';

    const user = await createAuthUser(email, password);
    const ownerUid = user.localId;
    const tripId = `editor-trip-${timestamp}`;

    await page.goto('/');
    await signInInBrowser(page, email, password);
    await seedTripWithStops(page, ownerUid, tripId, 'Editor Baseline Trip');
    await openTripEditorById(page, tripId);

    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await titleInput.fill('Editor Trip With Unsaved Changes');

    const cancelButton = page.getByRole('button', { name: /Cancel|Cancelar/i }).first();
    await cancelButton.click();

    // ConfirmModal renders both mobile (BottomSheet) and desktop (dialog) variants.
    // Scope to the dialog role to avoid the hidden mobile duplicate.
    const confirmDialog = page.getByRole('dialog');
    const discardHeading = confirmDialog.getByRole('heading', { name: /Discard changes\?|¿Descartar cambios\?/i });
    await expect(discardHeading).toBeVisible({ timeout: 15000 });

    const keepEditingButton = page.getByRole('button', { name: /Keep editing|Seguir editando/i });
    await keepEditingButton.click();

    await expect(confirmDialog).toBeHidden();
    await expect(titleInput).toHaveValue('Editor Trip With Unsaved Changes');

    await cancelButton.click();
    const discardButton = page.getByRole('button', { name: /Discard|Descartar/i });
    await discardButton.click();

    await expect(titleInput).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  });

  test('saves edited title and closes editor', async ({ page }) => {
    const timestamp = Date.now();
    const email = `editor-save-${timestamp}@example.test`;
    const password = 'testpass';

    const user = await createAuthUser(email, password);
    const ownerUid = user.localId;
    const tripId = `editor-save-trip-${timestamp}`;
    const updatedTitle = 'Editor Save Confirmed';

    await page.goto('/');
    await signInInBrowser(page, email, password);
    await seedTripWithStops(page, ownerUid, tripId, 'Editor Initial Title');
    await openTripEditorById(page, tripId);

    const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
    await titleInput.fill(updatedTitle);

    const saveButton = page.getByRole('button', { name: /Save|Guardar/i }).first();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(titleInput).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);

    await expect
      .poll(async () => {
        const doc = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${tripId}`);
        return doc?.titulo;
      })
      .toBe(updatedTitle);
  });
});
