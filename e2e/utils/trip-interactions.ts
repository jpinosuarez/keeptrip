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
  action: RegExp = /Editar|Edit/i,
): Promise<void> {
  await tripCard.locator('.trip-card-menu-btn').click();
  const actionBtn = page.locator('.portal-menu-item', { hasText: action }).first();
  await actionBtn.waitFor({ state: 'visible' }); // Anti-Flakiness: wait for Framer Motion
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
 * Locates a TripCard by its `data-testid` and opens it in the editor via
 * the Portal Dropdown menu. Also scrolls the "View all" button if the card
 * is not yet visible in the current viewport.
 *
 * Preferred for specs that seed a trip with a known ID and then open the
 * editor from the dashboard/trips grid.
 *
 * @param page    - Playwright Page object
 * @param tripId  - The trip document ID (maps to data-testid="trip-card-{tripId}")
 */
export async function openTripEditorById(
  page: Page,
  tripId: string,
): Promise<void> {
  const titleInput = page.getByLabel(/Trip title|Título del viaje/i);
  const editorUrlPattern = new RegExp(`\\/(dashboard|trips)\\?.*editing=${tripId}`);
  const tripCard = page.getByTestId(`trip-card-${tripId}`);

  if (!(await tripCard.first().isVisible().catch(() => false))) {
    const viewAllButton = page.getByRole('button', { name: /View all|Ver todo/i });
    if (await viewAllButton.isVisible().catch(() => false)) {
      await viewAllButton.click();
    }
  }

  await expect(tripCard).toBeVisible({ timeout: 20000 });
  await openTripActionMenu(page, tripCard, /Editar|Edit/i);
  await expect(titleInput).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(editorUrlPattern);
}
