import { test, expect, type Page } from '@playwright/test';
import { createAuthUser, signInInBrowser, stabilizeAuthenticatedSession, navigateInApp } from './utils/e2e-auth';
const FIRESTORE_PROJECT_ID = 'keeptrip-app-b06b3';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
const OPERATIONAL_FLAGS_DOC_URL = `http://${FIRESTORE_EMULATOR_HOST}/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/system/operational_flags`;

const MAPBOX_GEOCODING_URL_PATTERN = /api\.mapbox\.com\/geocoding\//i;
const MAPBOX_TILE_STYLE_URL_PATTERN = /api\.mapbox\.com\/(styles\/v1|v4\/|raster\/v1|fonts\/v1)/i;
const FIRESTORE_REQUEST_URL_PATTERN = /google\.firestore\.v1\.Firestore\/(Listen|RunQuery|BatchGetDocuments|Commit|Write)/i;
const TRIP_PATH_PATTERN = /(\"viajes\"|\/viajes\/|collectionId\":\"viajes\")/i;

const MAINTENANCE_COPY_PATTERN = /Explorer's Rest|Modo mantenimiento|Maintenance Mode/i;
const MAP_FALLBACK_COPY_PATTERN = /Interactive maps are resting|mapas interactivos estan en pausa|mapas interactivos est[aá]n en pausa/i;
const SEARCH_PAUSED_COPY_PATTERN = /Search temporarily paused|Búsqueda temporalmente pausada/i;

function decodePayload(payload: string | null) {
  if (!payload) return '';
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

function toFirestoreDocument(level: number) {
  return {
    fields: {
      level: { integerValue: String(level) },
      app_readonly_mode: { booleanValue: level >= 3 },
      app_maintenance_mode: { booleanValue: level >= 4 },
      reason: { stringValue: `E2E kill-switch level ${level}` },
    },
  };
}

async function setOperationalLevel(page: Page, level: number) {
  // Use the standard REST API but with the 'owner' token which the emulator recognizes as admin
  const url = `http://${FIRESTORE_EMULATOR_HOST}/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/system/operational_flags`;
  
  console.log(`[E2E] Setting operational level to ${level} via REST Admin (Bearer owner)...`);
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner'
    },
    body: JSON.stringify(toFirestoreDocument(level)),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error(`[E2E] Failed to set operational level ${level}. Status: ${response.status}, Body: ${responseText}`);
    throw new Error(`Could not set operational level ${level}: ${response.status} ${responseText}`);
  }
}

async function waitForOperationalLevel(page: Page, level: number) {
  console.log(`[E2E] Waiting for app to reflect operational level ${level}...`);
  await page.waitForFunction((l) => {
    const fn = (window as any).__test_getOperationalLevel;
    return typeof fn === 'function' && fn() === l;
  }, level, { timeout: 30000 });
}

// Standard helper removed as it is now imported from e2e-auth.ts

async function openSearchPalette(page: Page) {
  // 1. Wait for core UI stability
  await expect(page.getByTestId('page-loader')).toBeHidden({ timeout: 15000 });
  
  // Also wait for voyages to be loaded to ensure the UI is ready for interactions
  await page.waitForFunction(() => {
    return (window as any).__test_viajesLoading === false;
  }, { timeout: 10000 }).catch(() => {
    console.log('[E2E] Warn: __test_viajesLoading wait timed out or flag missing');
  });

  // 2. Trigger Search Palette via shortcut
  await page.keyboard.press('Control+k');
  
  // 3. Robustly wait for search input
  const searchInput = page.getByTestId('search-input');
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  return searchInput;
}

test.describe.configure({ mode: 'serial' });

test.describe('Unified kill-switch operational audit', () => {
  test.afterEach(async ({ page }) => {
    await setOperationalLevel(page, 0);
  });

  test('L1 Soft Kill: city search sends exactly zero Mapbox geocoding requests', async ({ page }) => {
    const timestamp = Date.now();
    const email = `kill-l1-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);
    await setOperationalLevel(page, 1);

    let geocodingRequestCount = 0;
    page.on('request', (request) => {
      if (MAPBOX_GEOCODING_URL_PATTERN.test(request.url())) {
        geocodingRequestCount += 1;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await waitForOperationalLevel(page, 1);
    await stabilizeAuthenticatedSession(page, email, password);
    
    const searchInput = await openSearchPalette(page);
    await expect(searchInput).toBeDisabled({ timeout: 30000 });

    await expect(page.getByText(SEARCH_PAUSED_COPY_PATTERN).first()).toBeVisible({ timeout: 30000 });
    expect(geocodingRequestCount).toBe(0);
  });

  test('L2 Hard Kill: map route sends zero Mapbox tile/style requests and renders fallback', async ({ page }) => {
    const timestamp = Date.now();
    const email = `kill-l2-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);
    await setOperationalLevel(page, 2);

    let mapboxTileStyleRequestCount = 0;
    page.on('request', (request) => {
      if (MAPBOX_TILE_STYLE_URL_PATTERN.test(request.url())) {
        mapboxTileStyleRequestCount += 1;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await waitForOperationalLevel(page, 2);
    await stabilizeAuthenticatedSession(page, email, password);

    // Navigate to map
    await navigateInApp(page, '/map');
    
    await expect(page).toHaveURL(/\/map(?:\?.*)?$/);
    const fallback = page.getByTestId('operational-map-fallback');
    await expect(fallback).toBeVisible({ timeout: 30000 });
    
    // Also verify the specific copy exists inside the fallback
    await expect(fallback.getByText(MAP_FALLBACK_COPY_PATTERN).first()).toBeVisible({ timeout: 15000 });

    expect(mapboxTileStyleRequestCount).toBe(0);
  });

  test('L3 Operation: bitacora is READ-ONLY', async ({ page }) => {
    const timestamp = Date.now();
    const email = `kill-l3-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);
    await setOperationalLevel(page, 3);

    await page.goto('/');
    await page.waitForLoadState('load');
    await waitForOperationalLevel(page, 3);
    await stabilizeAuthenticatedSession(page, email, password);

    await navigateInApp(page, '/trips');
    await expect(page).toHaveURL(/\/trips(?:\?.*)?$/);
    
    // Wait for either the trips grid or the ghost empty state to appear
    const emptyState = page.getByTestId('ghost-empty-state');
    const tripsGrid = page.getByTestId('trips-grid');
    await expect(emptyState.or(tripsGrid).first()).toBeVisible({ timeout: 30000 });

    // Check if some edit-related buttons are gone or disabled
    const addTripBtn = page.getByTestId('add-trip-button');
    if (await addTripBtn.isVisible()) {
      await expect(addTripBtn).toBeDisabled({ timeout: 30000 });
    }
  });

  test('L4 Total Halt: app renders global maintenance mode barrier', async ({ page }) => {
    const timestamp = Date.now();
    const email = `kill-l4-${timestamp}@example.test`;
    const password = 'testpass';

    await createAuthUser(email, password);
    await setOperationalLevel(page, 4);

    let firestoreTripFetchRequestCount = 0;

    page.on('request', (request) => {
      if (!FIRESTORE_REQUEST_URL_PATTERN.test(request.url())) return;

      const payload = decodePayload(request.postData());
      if (TRIP_PATH_PATTERN.test(payload)) {
        firestoreTripFetchRequestCount += 1;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await waitForOperationalLevel(page, 4);
    await signInInBrowser(page, email, password);

    await expect(page.getByText(MAINTENANCE_COPY_PATTERN).first()).toBeVisible({ timeout: 30000 });

    expect(firestoreTripFetchRequestCount).toBe(0);
  });
});
