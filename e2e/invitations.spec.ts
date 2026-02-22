import { test, expect } from '@playwright/test';

const FIREBASE_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || 'keeptrip-app-b06b3';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_URL = 'http://127.0.0.1:8080';

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
  test('invitee accepts invitation and sees shared viaje', async ({ page }) => {
    const ownerEmail = 'owner@example.test';
    const inviteeEmail = 'invitee@example.test';
    const password = 'testpass';

    // create users in Auth emulator
    const owner = await createAuthUser(ownerEmail, password);
    const invitee = await createAuthUser(inviteeEmail, password);

    const ownerUid = owner.localId;
    const inviteeUid = invitee.localId;
    const viajeId = 'trip-e2e-1';
    const invitationId = `inv-${viajeId}-${inviteeUid}`;

    // open app so test helpers are available
    await page.goto('/');

    // sign in as owner in the browser and create viaje + viaje-level invitation + top-level invitation
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.evaluate(({ ownerUid, viajeId }) => {
      return (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, {
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
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: inviteeEmail, password });

    // wait for the invitations badge to appear
    await page.waitForSelector('[data-testid="header-invitations-count"]');

    // open invitations view
    await page.click('[data-testid="header-invitations-button"]');

    // accept the invitation
    await page.waitForSelector(`[data-testid="inv-accept-${invitationId}"]`);
    await page.click(`[data-testid="inv-accept-${invitationId}"]`);

    // wait for Firestore to reflect sharedWith update (poll via client read)
    // use Playwright's waitForFunction so we block until the browser-authenticated client
    // can actually read the viaje and see the invitee in sharedWith (longer timeout)
    await page.waitForFunction(
      ({ path, uid }) => {
        return (window as any).__test_readDoc(path).then((doc) => !!(doc && Array.isArray(doc.sharedWith) && doc.sharedWith.includes(uid)));
      },
      { path: `usuarios/${ownerUid}/viajes/${viajeId}`, uid: inviteeUid },
      { timeout: 15000 }
    );

    // ensure the viaje doc is readable now and contains the invitee
    const viajeDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `usuarios/${ownerUid}/viajes/${viajeId}`);
    expect(viajeDoc).not.toBeNull();
    expect(Array.isArray(viajeDoc.sharedWith) ? viajeDoc.sharedWith : []).toContain(inviteeUid);

    // navigate to Bitacora and open the Visor using test helpers (deterministic)
    await page.evaluate(() => (window as any).__test_setVista('bitacora'));

    // wait until the trip appears in the Bitacora list (client subscription must sync)
    // allow more time for the client's sharedViajes subscription to receive the update
    await page.waitForSelector(`text=Viaje de prueba E2E`, { timeout: 30000 });

    // now open the Visor (data should be available)
    await page.evaluate((id) => (window as any).__test_abrirVisor(id), viajeId);

    // verify invitation document status changed to 'accepted'
    const invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
    expect(invDoc).not.toBeNull();
    expect(invDoc.status).toBe('accepted');

    // verify viaje.sharedWith was updated in Firestore (read via browser client as owner)
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');
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
    const invitationId = `inv-${viajeId}-${inviteeUid}`;

    await page.goto('/');

    // sign in as owner and create viaje + invitations via browser helper
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.evaluate(({ ownerUid, viajeId }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { titulo: 'Viaje declinado', nombreEspanol: 'Ciudad Decline', code: 'DC', sharedWith: [] }), { ownerUid, viajeId });

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}/invitations/${inviteeUid}`, { inviterId: ownerUid, inviteeUid, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { ownerUid, viajeId, inviteeUid });

    await page.evaluate(({ invitationId, ownerUid, inviteeUid, viajeId }) => (window as any).__test_createDoc(`invitations/${invitationId}`, { inviterId: ownerUid, inviteeUid, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { invitationId, ownerUid, inviteeUid, viajeId });

    // sign out owner and sign in as invitee
    await page.evaluate(() => (window as any).__test_signOut());
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: inviteeEmail, password });
    await page.waitForSelector('[data-testid="header-invitations-count"]');
    await page.click('[data-testid="header-invitations-button"]');

    await page.waitForSelector(`[data-testid="inv-decline-${invitationId}"]`);
    await page.click(`[data-testid="inv-decline-${invitationId}"]`);

    // the UI shows the status text for non-pending invitations — assert it changed to 'declined'
    await expect(page.locator(`[data-testid="inv-card-${invitationId}"]`)).toContainText('declined');

    // ensure invitations doc status is 'declined' (poll via client read)
    let invDoc = null;
    for (let i = 0; i < 25; i++) {
      invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
      if (invDoc && invDoc.status === 'declined') break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(invDoc).not.toBeNull();
    expect(invDoc.status).toBe('declined');

    // ensure viaje.sharedWith does NOT contain inviteeUid (read as owner)
    await page.evaluate(() => (window as any).__test_signOut());
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');
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
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.evaluate(({ ownerUid, viajeId, inviteeUid }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { titulo: 'Viaje privado compartido', nombreEspanol: 'Ciudad Secure', code: 'SC', sharedWith: [inviteeUid] }), { ownerUid, viajeId, inviteeUid });

    await page.evaluate(() => (window as any).__test_signOut());

    // Sign in as attacker and assert they cannot see the viaje in bitacora
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: attackerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    // navigate to Bitacora
    await page.click('text=Bitacora');

    // the trip title should NOT be visible for the attacker
    await expect(page.locator('text=Viaje privado compartido')).toHaveCount(0);
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
    await page.evaluate(({ email, password }) => (window as any).__test_signInWithEmail({ email, password }), { email: ownerEmail, password });
    await page.waitForSelector('[data-testid="header-avatar"]');

    await page.evaluate(({ ownerUid, viajeId }) => (window as any).__test_createDoc(`usuarios/${ownerUid}/viajes/${viajeId}`, { titulo: 'Viaje para invitar por email', nombreEspanol: 'Ciudad Email', code: 'EM', sharedWith: [] }), { ownerUid, viajeId });

    // create top-level invitation with inviteeEmail (simulates owner sending email invite)
    await page.evaluate(({ invitationId, ownerUid, inviteeEmail, viajeId }) => (window as any).__test_createDoc(`invitations/${invitationId}`, { inviterId: ownerUid, inviteeEmail, viajeId, status: 'pending', createdAt: new Date().toISOString() }), { invitationId, ownerUid, inviteeEmail, viajeId });

    const invDoc = await page.evaluate((path) => (window as any).__test_readDoc(path), `invitations/${invitationId}`);
    expect(invDoc).not.toBeNull();
    expect(invDoc.inviteeEmail).toBe(inviteeEmail);
  });
});
