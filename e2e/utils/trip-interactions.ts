import { expect, type Page, type Locator } from '@playwright/test';

/**
 * Opens the Portal Dropdown menu on a TripCard and clicks the specified action.
 *
 * TripCard direct clicks are disabled per the Director's UX request
 * (e.stopPropagation() on the card root). All navigation must go through
 * the 3-dot action menu (.trip-card-menu-btn) + Portal Dropdown.
 *
 * The `editBtn.waitFor()` call is a mandatory Anti-Flakiness Guardrail:
 * Playwright is faster than the Framer Motion entry animation on the portal
 * menu, which causes flaky clicks if we don't wait for the item to be
 * fully visible before interacting with it.
 *
 * @param page       - Playwright Page object
 * @param tripCard   - Locator for the TripCard element (e.g. getByLabel(...))
 * @param action     - Regex to match the action menu item label (default: Editar|Edit)
 */
export async function openTripActionMenu(
  page: Page,
  tripCard: Locator,
  action?: RegExp,
): Promise<void> {
  const menuBtn = tripCard.getByTestId('trip-card-menu-btn');
  const isDelete = action && (action.test('Delete') || action.test('Eliminar'));
  const actionBtnId = isDelete ? 'trip-card-menu-delete' : 'trip-card-menu-edit';
  const actionBtn = page.getByTestId(actionBtnId);

  await menuBtn.scrollIntoViewIfNeeded();
  
  // Dispatching a click event is sometimes more robust than a simulated mouse click
  // when dealing with complex z-index/portal situations.
  let attempts = 0;
  while (attempts < 3) {
    await menuBtn.dispatchEvent('click');
    try {
      await actionBtn.waitFor({ state: 'visible', timeout: 5000 });
      break;
    } catch (e) {
      attempts++;
      if (attempts === 3) throw e;
    }
  }
  
  await actionBtn.click();
}

/**
 * Locates a TripCard by its accessible label and opens it in the editor via
 * the Portal Dropdown menu.
 *
 * Preferred for specs that need to navigate to the editor by trip label
 * (e.g. after a trip is created and the card is visible in the grid).
 *
 * @param page  - Playwright Page object
 * @param label - Regex matching the aria-label of the TripCard
 */
export async function openTripEditorByLabel(
  page: Page,
  label: RegExp,
): Promise<void> {
  const tripCard = page.getByLabel(label).first();
  await expect(tripCard).toBeVisible({ timeout: 20000 });
  await openTripActionMenu(page, tripCard, /Editar|Edit/i);
}

/**
 * Opens the trip editor by navigating directly to the editing URL.
 *
 * Bypasses the brittle Portal Dropdown menu interaction entirely by using
 * the app's URL-based editor opening mechanism (?editing=tripId).
 * This is far more reliable than clicking through animated portal menus.
 *
 * @param page    - Playwright Page object
 * @param tripId  - The trip document ID
 */
export async function openTripEditorById(
  page: Page,
  tripId: string,
): Promise<void> {
  const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
  const editorUrlPattern = new RegExp(`\\/(dashboard|trips)\\?.*editing=${tripId}`);

  // Use soft navigation via the test hook if available, otherwise hard navigate
  const hasNavigateHook = await page.evaluate(() => typeof (window as any).__test_navigate === 'function');
  const currentPath = new URL(page.url()).pathname;
  const targetPath = currentPath.includes('/trips') ? '/trips' : '/dashboard';
  const targetUrl = `${targetPath}?editing=${tripId}`;

  if (hasNavigateHook) {
    await page.evaluate((url) => {
      const [path, search] = url.split('?');
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, targetUrl);
    // Give React Router a moment to react to the URL change
    await page.waitForFunction(
      (tripId) => {
        const params = new URLSearchParams(window.location.search);
        return params.get('editing') === tripId;
      },
      tripId,
      { timeout: 10000 }
    );
  } else {
    await page.goto(`http://localhost:5173${targetUrl}`);
  }

  await expect(titleInput).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(editorUrlPattern);
}
