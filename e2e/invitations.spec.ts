import { test, expect } from '@playwright/test';

const FIREBASE_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || 'keeptrip-app-b06b3';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_URL = 'http://127.0.0.1:8081';

async function createAuthUser(email: string, password = 'testpass') {
  const signUpRes = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signUpJson = await signUpRes.json();
  // If the user already exists, sign them in and return the existing localId
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

async function createFirestoreDocument(path: string, fields: any, documentId?: string) {
  // Use emulator admin REST endpoint to bypass security rules for seeding test data
  const base = `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/${path}`;
  const url = documentId ? `${base}?documentId=${documentId}` : base;
  const body = { fields };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create doc ${path} (${res.status}): ${text}`);
  }
  return res.json();
}

async function getFirestoreDocument(path: string) {
  const url = `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/${path}`;
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

async function signInInBrowser(page, email: string, password = 'testpass') {
  await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function');
  await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email, password });
  await page.waitForSelector('[data-testid="header-avatar"]', { timeout: 15000 });
}

async function stabilizeAuthenticatedSession(page, email: string, password = 'testpass') {
  const loginVisible = await page.getByRole('button', { name: /Log In|Iniciar sesion|Iniciar sesión/i }).count();
  if (loginVisible > 0) {
    await signInInBrowser(page, email, password);
  }
  await expect(page.getByTestId('header-avatar')).toBeVisible({ timeout: 15000 });
}

async function navigateInApp(page, path: string) {
  const canUseTestNavigator = await page.evaluate(() => typeof (window as any).__test_navigate === 'function');
  if (canUseTestNavigator) {
    await page.evaluate((targetPath) => (window as any).__test_navigate(targetPath), path);
  } else {
    await page.goto(path);
  }
}

async function openInvitationsAndAssertRoute(page) {
  await navigateInApp(page, '/invitations');
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    throw new Error(
      'Expected /invitations route to be enabled for E2E, but app redirected to /dashboard. ' +
      'Set VITE_E2E_ENABLE_INVITATIONS=true in Playwright/CI runtime env.'
    );
  }
  await expect(page).toHaveURL(/\/invitations(?:\?.*)?$/);
}

function extractString(field) {
  return field && field.stringValue ? field.stringValue : null;
}

function extractArray(field) {
  if (!field || !field.arrayValue || !field.arrayValue.values) return [];
  return field.arrayValue.values.map(v => v.stringValue);
}

test.describe('Invitations flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
    });
  });
  test('invitee accepts invitation and updates sharing metadata', async ({ page }) => {
    const ownerEmail = 'owner@example.test';
    const inviteeEmail = 'invitee@example.test';
    const password = 'testpass';

    // create users in Auth emulator
    const owner = await createAuthUser(ownerEmail, password);
    const invitee = await createAuthUser(inviteeEmail, password);

    const ownerUid = owner.localId;
    const inviteeUid = invitee.localId;
    const viajeId = 'trip-e2e-1';
    // Standardized invitation ID format: ${viajeId}_${inviteeUid}
    const invitationId = `${viajeId}_${inviteeUid}`;

    // open app so test helpers are available
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).__test_signInWithEmail === 'function');

    // sign in as owner in the browser and create viaje + viaje-level invitation + top-level invitation
    await signInInBrowser(page, ownerEmail, password);

    // Ensure the owner has a profile doc so the shared badge can resolve the displayName
    await page.evaluate(({ ownerUid, ownerEmail }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}`, {
        displayName: 'Owner User',
        email: ownerEmail,
        photoURL: null,
      });
    }, { ownerUid, ownerEmail });

    await page.evaluate(({ ownerUid, viajeId }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, {
        ownerId: ownerUid,
        titulo: 'Viaje de prueba E2E',
        nombreEspanol: 'Ciudad Test',
        code: 'TT',
        sharedWith: [],
        vibe: ['Aventura'],
        companions: [{ name: 'Propietario', email: 'owner@example.test', status: 'accepted' }],
        highlights: { topFood: 'Empanadas', topView: 'Mirador Test', topTip: 'Ir temprano' }
      });
    }, { ownerUid, viajeId });

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`, {
        inviterId: ownerUid,
        inviteeUid,
        viajeId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }, { ownerUid, viajeId, inviteeUid });

    await page.evaluate(({ invitationId, ownerUid, inviteeUid, viajeId }) => {
      return (window as any).__test_createDoc(`invitations/${invitationId}`, {
        inviterId: ownerUid,
        inviteeUid,
        viajeId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }, { invitationId, ownerUid, inviteeUid, viajeId });

    // sign out owner and sign in as invitee to continue the flow
    await page.evaluate(() => (window as any).__test_signOut());
    await signInInBrowser(page, inviteeEmail, password);
    await stabilizeAuthenticatedSession(page, inviteeEmail, password);

    // Open invitations view directly and fail fast if feature flags still gate the route.
    await openInvitationsAndAssertRoute(page);

    // accept the invitation
    const acceptButton = page.getByTestId(`inv-accept-${invitationId}`);
    await expect(acceptButton).toBeVisible({ timeout: 15000 });
    await acceptButton.click();

    // wait until top-level invitation reflects accepted status for the invitee
    await page.waitForFunction(
      (path) => {
        return (window as any).__test_readDoc(path).then((doc) => !!(doc && doc.status === 'accepted'));
      },
      `invitations/${invitationId}`,
      { timeout: 15000 }
    );

    // Validate UI state transition after accept action.
    await expect(page.getByText('accepted').first()).toBeVisible({ timeout: 15000 });

    // verify invitation status and viaje ownership docs as owner (owner-protected paths)
    await signInInBrowser(page, ownerEmail, password);

    const invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
    expect(invDoc).not.toBeNull();
    expect(invDoc.status).toBe('accepted');

    const nestedInvDoc = await page.evaluate(
      (path) => (window as any).__test_readDoc(path),
      `usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`
    );
    expect(nestedInvDoc).not.toBeNull();
    expect(nestedInvDoc.inviterId).toBe(ownerUid);
    expect(nestedInvDoc.inviteeUid).toBe(inviteeUid);

    const viajeData = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${viajeId}`);
    const shared = viajeData?.sharedWith || [];
    expect(shared).toContain(inviteeUid);
  });

  test('invitee can decline invitation and does NOT gain access', async ({ page }) => {
    const ownerEmail = 'owner2@example.test';
    const inviteeEmail = 'invitee2@example.test';
    const password = 'testpass';

    const owner = await createAuthUser(ownerEmail, password);
    const invitee = await createAuthUser(inviteeEmail, password);
    const ownerUid = owner.localId;
    const inviteeUid = invitee.localId;
    const viajeId = 'trip-e2e-2';
    // Standardized invitation ID format: ${viajeId}_${inviteeUid}
    const invitationId = `${viajeId}_${inviteeUid}`;

    await page.goto('/');

    // sign in as owner and create viaje + invitations via browser helper
    await signInInBrowser(page, ownerEmail, password);

    await page.evaluate(({ ownerUid, viajeId }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { ownerId: ownerUid, titulo: 'Viaje declinado', nombreEspanol: 'Ciudad Decline', code: 'DC', sharedWith: [] }), { ownerUid, viajeId });

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`, { inviterId: ownerUid, inviteeUid, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { ownerUid, viajeId, inviteeUid });

    await page.evaluate(({ invitationId, ownerUid, inviteeUid, viajeId }) => (window as any).__test_createDoc(`invitations/${invitationId}`, { inviterId: ownerUid, inviteeUid, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { invitationId, ownerUid, inviteeUid, viajeId });

    // sign out owner and sign in as invitee
    await page.evaluate(() => (window as any).__test_signOut());
    await signInInBrowser(page, inviteeEmail, password);
    await stabilizeAuthenticatedSession(page, inviteeEmail, password);
    await openInvitationsAndAssertRoute(page);

    const declineButton = page.getByTestId(`inv-decline-${invitationId}`);
    await expect(declineButton).toBeVisible({ timeout: 15000 });
    await declineButton.click();

    // the UI shows the status text for non-pending invitations — assert it changed to 'declined'
    await expect(page.getByText('declined').first()).toBeVisible();

    // ensure invitations doc status is 'declined' (poll via client read)
    await expect
      .poll(async () => {
        const doc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
        return doc?.status;
      })
      .toBe('declined');

    const invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
    expect(invDoc).not.toBeNull();
    expect(invDoc.status).toBe('declined');

    // ensure viaje.sharedWith does NOT contain inviteeUid (read as owner)
    await page.evaluate(() => (window as any).__test_signOut());
    await signInInBrowser(page, ownerEmail, password);

    const nestedInvDoc = await page.evaluate(
      (path) => (window as any).__test_readDoc(path),
      `usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`
    );
    expect(nestedInvDoc).not.toBeNull();
    expect(nestedInvDoc.inviterId).toBe(ownerUid);
    expect(nestedInvDoc.inviteeUid).toBe(inviteeUid);

    const viajeData = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${viajeId}`);
    const shared = viajeData?.sharedWith || [];
    expect(shared).not.toContain(inviteeUid);
  });

  test('other user cannot see shared viaje in their bitacora (permission check)', async ({ page }) => {
    const ownerEmail = 'owner3@example.test';
    const inviteeEmail = 'invitee3@example.test';
    const attackerEmail = 'attacker@example.test';
    const password = 'testpass';

    const owner = await createAuthUser(ownerEmail, password);
    const invitee = await createAuthUser(inviteeEmail, password);
    const attacker = await createAuthUser(attackerEmail, password);

    const ownerUid = owner.localId;
    const inviteeUid = invitee.localId;
    const attackerUid = attacker.localId;
    const viajeId = 'trip-e2e-3';

    // create viaje and mark sharedWith (invitee only)
    await page.goto('/');
    await signInInBrowser(page, ownerEmail, password);

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { ownerId: ownerUid, titulo: 'Viaje privado compartido', nombreEspanol: 'Ciudad Secure', code: 'SC', sharedWith: [inviteeUid] }), { ownerUid, viajeId, inviteeUid });

    await page.evaluate(() => (window as any).__test_signOut());

    // Sign in as attacker and assert they cannot see the viaje in bitacora
    await signInInBrowser(page, attackerEmail, password);
    await stabilizeAuthenticatedSession(page, attackerEmail, password);

    // Navigate to /trips
    await navigateInApp(page, '/trips');
    await expect(page).toHaveURL(/\/trips(?:\?.*)?$/);

    // the trip title should NOT be visible for the attacker
    await expect(page.locator('text=Viaje privado compartido')).toHaveCount(0);
  });

  test('invitee can open accepted shared trip from trips list', async ({ page }) => {
    const ownerEmail = 'owner5@example.test';
    const inviteeEmail = 'invitee5@example.test';
    const password = 'testpass';

    const owner = await createAuthUser(ownerEmail, password);
    const invitee = await createAuthUser(inviteeEmail, password);

    const ownerUid = owner.localId;
    const inviteeUid = invitee.localId;
    const viajeId = 'trip-e2e-5';
    // Standardized invitation ID format: ${viajeId}_${inviteeUid}
    const invitationId = `${viajeId}_${inviteeUid}`;

    await page.goto('/');

    await signInInBrowser(page, ownerEmail, password);

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, {
        ownerId: ownerUid,
        titulo: 'Ruta compartida E2E',
        nombreEspanol: 'Ciudad Ruta',
        code: 'RT',
        sharedWith: [inviteeUid],
        fechaInicio: '2026-01-10',
        fechaFin: '2026-01-15'
      });
    }, { ownerUid, viajeId, inviteeUid });

    await page.evaluate(({ ownerUid, viajeId }) => {
      return Promise.all([
        (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/paradas/p1`, {
          nombre: 'Parada Centro',
          fecha: '2026-01-11',
          fechaLlegada: '2026-01-11',
          fechaSalida: '2026-01-12',
          coordenadas: [-99.1332, 19.4326]
        }),
        (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/paradas/p2`, {
          nombre: 'Parada Costa',
          fecha: '2026-01-13',
          fechaLlegada: '2026-01-13',
          fechaSalida: '2026-01-14',
          coordenadas: [-86.8515, 21.1619]
        })
      ]);
    }, { ownerUid, viajeId });

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`, {
        inviterId: ownerUid,
        inviteeUid,
        viajeId,
        status: 'accepted',
        acceptedBy: inviteeUid,
        createdAt: new Date().toISOString()
      });
    }, { ownerUid, viajeId, inviteeUid });

    await page.evaluate(({ invitationId, ownerUid, inviteeUid, viajeId }) => {
      return (window as any).__test_createDoc(`invitations/${invitationId}`, {
        inviterId: ownerUid,
        inviteeUid,
        viajeId,
        status: 'accepted',
        acceptedBy: inviteeUid,
        createdAt: new Date().toISOString()
      });
    }, { invitationId, ownerUid, inviteeUid, viajeId });

    await page.evaluate(() => (window as any).__test_signOut());
    await signInInBrowser(page, inviteeEmail, password);
    await stabilizeAuthenticatedSession(page, inviteeEmail, password);

    await navigateInApp(page, '/trips');
    
    // Wait until the shared trip card is visible.
    const sharedCard = page.getByRole('button', { name: /Ruta compartida E2E/i });
    await expect(sharedCard).toBeVisible({ timeout: 20000 });
    
    // Open shared trip.
    await sharedCard.click();
    await expect(page).toHaveURL(new RegExp(`/trips(?:/${viajeId}|\\?editing=${viajeId})(?:\\?.*)?$`));

    const viewerTitle = page.getByTestId('visor-title');
    const editorTitleInput = page.getByPlaceholder(/Trip Title|Título del viaje/i).first();

    // Depending on route mode and permissions, app can render shared viewer or editor route.
    await expect
      .poll(async () => {
        const viewerVisible = await viewerTitle.isVisible().catch(() => false);
        const editorVisible = await editorTitleInput.isVisible().catch(() => false);
        return viewerVisible || editorVisible;
      })
      .toBe(true);

    if (await viewerTitle.isVisible().catch(() => false)) {
      await expect(page.getByTestId('visor-shared-badge')).toContainText('Compartido por', { timeout: 15000 });
    }

    const parada1 = await page.evaluate(
      (path) => (window as any).__test_readDoc(path),
      `usuarios/${ownerUid}/viajes/${viajeId}/paradas/p1`
    );
    const parada2 = await page.evaluate(
      (path) => (window as any).__test_readDoc(path),
      `usuarios/${ownerUid}/viajes/${viajeId}/paradas/p2`
    );

    expect(parada1).not.toBeNull();
    expect(parada2).not.toBeNull();
    expect(parada1.nombre).toBe('Parada Centro');
    expect(parada2.nombre).toBe('Parada Costa');
  });

  test('owner can invite by email (top-level invitation created)', async ({ page }) => {
    const ownerEmail = 'owner4@example.test';
    const inviteeEmail = 'noaccount@example.test';
    const password = 'testpass';

    const owner = await createAuthUser(ownerEmail, password);
    const ownerUid = owner.localId;
    const viajeId = 'trip-e2e-4';
    const invitationId = `inv-${viajeId}-by-email`;

    await page.goto('/');
    await signInInBrowser(page, ownerEmail, password);

    await page.evaluate(({ ownerUid, viajeId }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { ownerId: ownerUid, titulo: 'Viaje para invitar por email', nombreEspanol: 'Ciudad Email', code: 'EM', sharedWith: [] }), { ownerUid, viajeId });

    // create top-level invitation with inviteeEmail (simulates owner sending email invite)
    await page.evaluate(({ invitationId, ownerUid, inviteeEmail, viajeId }) => (window as any).__test_createDoc(`invitations/${invitationId}`, { inviterId: ownerUid, inviteeEmail, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { invitationId, ownerUid, inviteeEmail, viajeId });

    const invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
    expect(invDoc).not.toBeNull();
    expect(invDoc.inviteeEmail).toBe(inviteeEmail);
  });

});
