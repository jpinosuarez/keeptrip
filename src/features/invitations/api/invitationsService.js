import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { db } from '@shared/firebase';
import { logger } from '@shared/lib/utils/logger';

/**
 * Invitations service
 * - createInvitation
 * - acceptInvitation (reads invitation, updates invitation + adds uid to viaje.sharedWith)
 * - declineInvitation
 * - listenToInvitationsForUser
 * - getInvitationsForUser / getInvitationsForEmail
 */

export const createInvitation = async ({ db: _db, inviterId, inviteeEmail = null, inviteeUid = null, viajeId }) => {
  const database = _db || db;
  const payload = {
    inviterId: inviterId || null,
    inviteeEmail: inviteeEmail || null,
    inviteeUid: inviteeUid || null,
    viajeId: viajeId || null,
    status: 'pending',
    createdAt: Date.now()
  };

  // If inviteeUid is known, store invitation in both places:
  // - viaje nested path (required by Firestore rules when invitee accepts)
  // - top-level invitations collection (used by UI listeners)
  if (inviteeUid) {
    if (!inviterId || !viajeId) {
      throw new Error('inviterId and viajeId are required when inviteeUid is provided');
    }

    const invitationId = `${viajeId}_${inviteeUid}`;
    const nestedRef = doc(database, `usuarios/${inviterId}/viajes/${viajeId}/invitations/${inviteeUid}`);
    const topLevelRef = doc(database, 'invitations', invitationId);

    await setDoc(nestedRef, payload, { merge: true });
    await setDoc(topLevelRef, payload, { merge: true });

    return invitationId;
  }

  const invitationsRef = collection(database, 'invitations');
  const docRef = await addDoc(invitationsRef, payload);
  return docRef.id;
};

export const acceptInvitation = async ({ db: _db, invitationId, acceptorUid }) => {
  const database = _db || db;
  try {
    const invitationRef = doc(database, 'invitations', invitationId);
    const invSnap = await getDoc(invitationRef);
    if (!invSnap.exists()) throw new Error('Invitation not found');

    const invitationData = invSnap.data() || {};
    const resolvedInviteeUid = invitationData.inviteeUid || acceptorUid;
    const acceptedAt = Date.now();
    const invitationUpdate = {
      status: 'accepted',
      acceptedAt,
      acceptedBy: acceptorUid,
      inviteeUid: resolvedInviteeUid
    };

    // Update the top-level invitation record.
    await setDoc(invitationRef, invitationUpdate, { merge: true });

    // Also update the nested invitation record under the owner's viaje, if it exists.
    if (invitationData.inviterId && invitationData.viajeId) {
      const nestedInviteRef = doc(
        database,
        'usuarios',
        invitationData.inviterId,
        'viajes',
        invitationData.viajeId,
        'invitations',
        resolvedInviteeUid
      );
      await setDoc(nestedInviteRef, invitationUpdate, { merge: true });

      const viajeRef = doc(database, 'usuarios', invitationData.inviterId, 'viajes', invitationData.viajeId);
      await setDoc(viajeRef, { sharedWith: arrayUnion(acceptorUid) }, { merge: true });
    }

    return true;
  } catch (err) {
    logger.error('acceptInvitation error', { error: err?.message, invitationId, acceptorUid });
    return false;
  }
};

export const declineInvitation = async ({ db: _db, invitationId, declinerUid }) => {
  const database = _db || db;
  try {
    const invitationRef = doc(database, 'invitations', invitationId);
    const invSnap = await getDoc(invitationRef);
    if (!invSnap.exists()) throw new Error('Invitation not found');

    const declinedAt = Date.now();
    const invitationUpdate = {
      status: 'declined',
      declinedAt,
      declinedBy: declinerUid
    };

    await setDoc(invitationRef, invitationUpdate, { merge: true });

    return true;
  } catch (err) {
    logger.error('declineInvitation error', { error: err?.message, invitationId, declinerUid });
    return false;
  }
};

export const listenToInvitationsForUser = (uid, onUpdate) => {
  const q = query(collection(db, 'invitations'), where('inviteeUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const getInvitationsForUser = async ({ db: _db, uid }) => {
  const database = _db || db;
  const q = query(collection(database, 'invitations'), where('inviteeUid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getInvitationsForEmail = async ({ db: _db, email }) => {
  const database = _db || db;
  const q = query(collection(database, 'invitations'), where('inviteeEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
