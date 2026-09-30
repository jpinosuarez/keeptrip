import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { beforeAll, afterAll, beforeEach, test, describe } from 'vitest';

let testEnv;
const projectId = 'proyecto-viajes-test';
const FOUNDER_UID = 'f8a2ANPUI4VW8SOzUmcJtFumOFSm';
const env = globalThis.process?.env ?? {};
const emulatorHostConfig = env.FIRESTORE_EMULATOR_HOST || '';
const shouldRunRulesSuite = Boolean(emulatorHostConfig);

beforeAll(async () => {
  if (!shouldRunRulesSuite) return;

  const rules = fs.readFileSync('./firestore.rules', 'utf8');
  const [emulatorHost, emulatorPortString] = emulatorHostConfig.split(':');
  const emulatorPort = env.FIRESTORE_EMULATOR_PORT
    ? Number(env.FIRESTORE_EMULATOR_PORT)
    : Number(emulatorPortString || '8081');

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

// Skip all tests unless they are executed with an emulator-backed environment.
const describeIfEmulator = shouldRunRulesSuite ? describe : describe.skip;

describeIfEmulator('Firestore Rules', () => {
  test('invitee puede agregar su uid a sharedWith, pero no modificar otros campos', async () => {
    // preparar datos como admin
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      const viajeRef = adminDb.doc('usuarios/ownerUid/viajes/viaje1');
      await viajeRef.set({ titulo: 'Original', sharedWith: [] });
      const invRef = adminDb.doc('invitations/viaje1_inviteeUid');
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
      const invRef = adminDb.doc('invitations/viaje2_inviteeUid');
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
      await adminDb.doc('invitations/viaje3_evilUid').set({
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
      await adminDb.doc('invitations/viaje4_inviteeUid').set({ inviterId: 'ownerUid', inviteeUid: 'inviteeUid', viajeId: 'viaje4', status: 'accepted' });
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

  test('operational flags can be read by anyone and written only by founder uid', async () => {
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      const adminDb = admin.firestore();
      await adminDb.doc('system/operational_flags').set({
        level: 0,
        app_readonly_mode: false,
        app_maintenance_mode: false,
      });
    });

    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    const authenticatedDb = testEnv.authenticatedContext('normalUserUid').firestore();
    const founderDb = testEnv.authenticatedContext(FOUNDER_UID).firestore();

    await assertSucceeds(anonymousDb.doc('system/operational_flags').get());
    await assertSucceeds(authenticatedDb.doc('system/operational_flags').get());

    await assertFails(
      authenticatedDb.doc('system/operational_flags').set({
        level: 2,
        app_readonly_mode: false,
        app_maintenance_mode: false,
      })
    );

    await assertSucceeds(
      founderDb.doc('system/operational_flags').set({
        level: 3,
        app_readonly_mode: true,
        app_maintenance_mode: false,
      })
    );
  });
});
