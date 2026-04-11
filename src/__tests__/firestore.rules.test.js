/* global process */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { beforeAll, afterAll, beforeEach, test, describe } from 'vitest';
import { createConnection } from 'net';

let testEnv;
const projectId = 'proyecto-viajes-test';
let isEmulatorAvailable = false;

// Check if Firestore emulator is available before running tests
async function checkEmulatorAvailable(host, port) {
  return new Promise((resolve) => {
    const conn = createConnection({ host, port });
    conn.on('connect', () => {
      conn.destroy();
      resolve(true);
    });
    conn.on('error', () => {
      resolve(false);
    });
    conn.setTimeout(1000, () => {
      conn.destroy();
      resolve(false);
    });
  });
}

beforeAll(async () => {
  const rules = fs.readFileSync('./firestore.rules', 'utf8');
  // connect to local emulator at default ports used by this project
  const emulatorHostConfig = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [emulatorHost, emulatorPortString] = emulatorHostConfig.split(':');
  const emulatorPort = process.env.FIRESTORE_EMULATOR_PORT
    ? Number(process.env.FIRESTORE_EMULATOR_PORT)
    : Number(emulatorPortString || '8080');

  // Check if emulator is available before trying to initialize
  isEmulatorAvailable = await checkEmulatorAvailable(emulatorHost, emulatorPort);

  if (!isEmulatorAvailable) {
    throw new Error(`Firestore emulator is not available at ${emulatorHost}:${emulatorPort}`);
  }

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: emulatorHost, port: emulatorPort, rules }
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (testEnv) await testEnv.clearFirestore();
});

describe('Firestore Rules', () => {
  test('invitee puede agregar su uid a sharedWith, pero no modificar otros campos', async () => {
    // preparar datos como admin
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      const viajeRef = adminDb.doc('usuarios/ownerUid/viajes/viaje1');
      await viajeRef.set({ titulo: 'Original', sharedWith: [] });
      const invRef = adminDb.doc('usuarios/ownerUid/viajes/viaje1/invitations/inviteeUid');
      await invRef.set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'viaje1', status: 'accepted' });
    });

    const inviteeDb = testEnv.authenticatedContext('inviteeUid').firestore();
    const viajeRef = inviteeDb.doc('usuarios/ownerUid/viajes/viaje1');

    // puede agregar su uid a sharedWith cuando la invitación está aceptada
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

  test('invitee no puede agregar sharedWith si invitación NO está aceptada', async () => {
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      const viajeRef = adminDb.doc('usuarios/ownerUid/viajes/viaje2');
      await viajeRef.set({ titulo: 'Original', sharedWith: [] });
      const invRef = adminDb.doc('usuarios/ownerUid/viajes/viaje2/invitations/inviteeUid');
      await invRef.set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'viaje2', status: 'pending' });
    });

    const inviteeDb = testEnv.authenticatedContext('inviteeUid').firestore();
    const viajeRef = inviteeDb.doc('usuarios/ownerUid/viajes/viaje2');

    // Invitación pendiente → no se permite agregar sharedWith
    await assertFails(viajeRef.update({ sharedWith: ['inviteeUid'] }));
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

  test('usuario autenticado no puede escribir en paises_info', async () => {
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      await adminDb.doc('paises_info/AR').set({ nombre: 'Argentina', zona: 'UTC-3' });
    });

    const userDb = testEnv.authenticatedContext('userUid').firestore();
    await assertFails(userDb.doc('paises_info/AR').set({ nombre: 'Argentina', zona: 'UTC-3' }));
  });

  test('usuario no puede modificar invitacion ajena en invitations', async () => {
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      await adminDb.doc('invitations/inv-xyz').set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'v1', status: 'pending' });
    });

    const attackerDb = testEnv.authenticatedContext('attackerUid').firestore();
    await assertFails(attackerDb.doc('invitations/inv-xyz').update({ status: 'accepted' }));
  });

  test('invitee sharedWith puede modificar paradas pero no titulo del viaje', async () => {
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      await adminDb.doc('usuarios/ownerUid/viajes/viaje4').set({ titulo: 'Trip', sharedWith: ['inviteeUid'] });
      await adminDb.doc('usuarios/ownerUid/viajes/viaje4/invitations/inviteeUid').set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'viaje4', status: 'accepted' });
      await adminDb.doc('usuarios/ownerUid/viajes/viaje4/paradas/p1').set({ nombre: 'Parada1' });
    });

    const inviteeDb = testEnv.authenticatedContext('inviteeUid').firestore();
    const paradaRef = inviteeDb.doc('usuarios/ownerUid/viajes/viaje4/paradas/p1');
    await assertSucceeds(paradaRef.update({ nombre: 'Parada1-actualizada' }));

    const viajeRef = inviteeDb.doc('usuarios/ownerUid/viajes/viaje4');
    await assertFails(viajeRef.update({ titulo: 'Hacked' }));
  });

  test('no puede crear viaje con ownerId distinto a request.auth.uid', async () => {
    const ownerDb = testEnv.authenticatedContext('ownerUid').firestore();
    const viajeRef = ownerDb.doc('usuarios/ownerUid/viajes/viaje5');

    await assertFails(viajeRef.set({ titulo: 'Trip', ownerId: 'somebodyElse', sharedWith: [] }, { merge: false }));
  });
});
