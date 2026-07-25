import { test, expect } from '@playwright/test';
import { openTripEditorById } from './utils/trip-interactions';
import { createAuthUser, signInInBrowser } from './utils/e2e-auth';

async function seedTripWithSingleStop(page, ownerUid: string, tripId: string) {
  const tripWriteOk = await page.evaluate(({ ownerUid, tripId }) => {
    return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}`, {
      ownerId: ownerUid,
      titulo: 'Delete Last Stop Trip',
      nombreEspanol: 'Delete Stop City',
      code: 'MX',
      paisCodigo: 'MX',
      fechaInicio: '2026-04-01',
      fechaFin: '2026-04-07',
      sharedWith: [],
    });
  }, { ownerUid, tripId });
  expect(tripWriteOk).toBe(true);

  const stopWriteOk = await page.evaluate(({ ownerUid, tripId }) => {
    return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${tripId}/paradas/stop-1`, {
      nombre: 'Delete Stop City',
      coordenadas: [-99.1332, 19.4326],
      paisCodigo: 'MX',
      fechaLlegada: '01/04/2026',
      fechaSalida: '07/04/2026',
    });
  }, { ownerUid, tripId });
  expect(stopWriteOk).toBe(true);

  const seededTrip = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${tripId}`);
  expect(seededTrip?.titulo).toBe('Delete Last Stop Trip');
}


test('deleting the last stop shows empty state and disables save', async ({ page }) => {
  const timestamp = Date.now();
  const email = `delete-stop-${timestamp}@example.test`;
  const password = 'testpass';
  const user = await createAuthUser(email, password);

  const ownerUid = user.localId;
  const tripId = `delete-stop-trip-${timestamp}`;

  await page.goto('/');
  await signInInBrowser(page, email, password);
  await seedTripWithSingleStop(page, ownerUid, tripId);

  await openTripEditorById(page, tripId);

  const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
  await expect(titleInput).toBeVisible({ timeout: 15000 });

  const stopItem = page.getByTestId('editor-stop-item').filter({ hasText: 'Delete Stop City' }).first();
  await expect(stopItem).toBeVisible({ timeout: 15000 });

  const moveUpButton = stopItem.getByTestId('editor-stop-move-up');
  const moveDownButton = stopItem.getByTestId('editor-stop-move-down');
  const deleteButton = stopItem.getByTestId('editor-stop-delete');

  await expect(moveUpButton).toBeDisabled();
  await expect(moveDownButton).toBeDisabled();
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  await expect(page.getByText(/Your route is empty|Tu ruta está vacía/i)).toBeVisible({ timeout: 15000 });

  const saveButton = page.getByRole('button', {
    name: /A trip must include at least one destination\.|El viaje debe tener al menos un destino\.|Save|Guardar/i,
  }).first();
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-disabled', 'true');
});

