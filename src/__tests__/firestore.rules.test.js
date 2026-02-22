import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { beforeAll, afterAll, beforeEach, test, expect } from 'vitest';

let testEnv;
const projectId = 'proyecto-viajes-test';

beforeAll(async () => {
  const rules = fs.readFileSync('./firestore.rules', 'utf8');
  // connect to local emulator at default ports used by this project
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules }
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

test('invitee puede agregar su uid a sharedWith, pero no modificar otros campos', async () => {
  // preparar datos como admin
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.firestore();
    const viajeRef = adminDb.doc('usuarios/ownerUid/viajes/viaje1');
    await viajeRef.set({ titulo: 'Original', sharedWith: [] });
    const invRef = adminDb.doc('usuarios/ownerUid/viajes/viaje1/invitations/inviteeUid');
    await invRef.set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'viaje1', status: 'pending' });
  });

  const inviteeDb = testEnv.authenticatedContext('inviteeUid').firestore();
  const viajeRef = inviteeDb.doc('usuarios/ownerUid/viajes/viaje1');

  // puede agregar su uid a sharedWith
  await assertSucceeds(viajeRef.update({ sharedWith: ['inviteeUid'] }));

  // NO puede modificar otros campos al mismo tiempo
  await assertFails(viajeRef.update({ sharedWith: ['inviteeUid'], titulo: 'Malicious' }));
});

test('owner puede actualizar campos y otros usuarios no pueden agregar sharedWith', async () => {
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.firestore();
    await adminDb.doc('usuarios/ownerUid/viajes/viaje1').set({ titulo: 'Original', sharedWith: [] });
  });

  const ownerDb = testEnv.authenticatedContext('ownerUid').firestore();
  const viajeRefOwner = ownerDb.doc('usuarios/ownerUid/viajes/viaje1');
  await assertSucceeds(viajeRefOwner.update({ titulo: 'Nuevo titulo' }));

  const attackerDb = testEnv.authenticatedContext('attackerUid').firestore();
  const viajeRefAttacker = attackerDb.doc('usuarios/ownerUid/viajes/viaje1');
  await assertFails(viajeRefAttacker.update({ sharedWith: ['attackerUid'] }));
});

test('attacker sin invitación NO puede agregar su uid a sharedWith', async () => {
  // Viaje SIN documento de invitación para attackerUid
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.firestore();
    await adminDb.doc('usuarios/ownerUid/viajes/viaje2').set({ titulo: 'Solo owner', sharedWith: [] });
  });

  const attackerDb = testEnv.authenticatedContext('attackerUid').firestore();
  const viajeRef = attackerDb.doc('usuarios/ownerUid/viajes/viaje2');
  // No hay invitation → debe fallar
  await assertFails(viajeRef.update({ sharedWith: ['attackerUid'] }));
});

test('invitación con inviterId falso (no coincide con owner del viaje) NO permite bypass', async () => {
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.firestore();
    await adminDb.doc('usuarios/ownerUid/viajes/viaje3').set({ titulo: 'Trip', sharedWith: [] });
    // Invitación existe pero inviterId ≠ ownerUid → regla debe rechazar
    await adminDb.doc('usuarios/ownerUid/viajes/viaje3/invitations/evilUid').set({
      inviterId: 'someoneElse', inviteeUid: 'evilUid', viajeId: 'viaje3', status: 'pending'
    });
  });

  const evilDb = testEnv.authenticatedContext('evilUid').firestore();
  const viajeRef = evilDb.doc('usuarios/ownerUid/viajes/viaje3');
  await assertFails(viajeRef.update({ sharedWith: ['evilUid'] }));
});

test('invitations collection: solo inviter o invitee pueden leer/actualizar', async () => {
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.firestore();
    await adminDb.doc('invitations/inv-abc').set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'v1', status: 'pending' });
  });

  const ownerDb = testEnv.authenticatedContext('ownerUid').firestore();
  const inviteeDb = testEnv.authenticatedContext('inviteeUid').firestore();
  const otherDb = testEnv.authenticatedContext('otherUid').firestore();

  await assertSucceeds(ownerDb.doc('invitations/inv-abc').get());
  await assertSucceeds(inviteeDb.doc('invitations/inv-abc').get());
  await assertFails(otherDb.doc('invitations/inv-abc').get());

  // owner puede actualizar
  await assertSucceeds(ownerDb.doc('invitations/inv-abc').update({ status: 'cancelled' }));
  // invitee puede actualizar (e.g., accept)
  await assertSucceeds(inviteeDb.doc('invitations/inv-abc').update({ status: 'accepted' }));
  // otro NO
  await assertFails(otherDb.doc('invitations/inv-abc').update({ status: 'accepted' }));
});
