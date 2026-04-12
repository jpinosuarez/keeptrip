import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '@shared/firebase';
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
  //   IMPORTANT: nested document ID MUST be exactly {inviteeUid} (no prefix)
  // - top-level invitations collection (used by UI listeners)
  //   ID format: ${viajeId}_${inviteeUid}
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
    const topLevelInvRef = doc(database, 'invitations', invitationId);
    const invSnap = await getDoc(topLevelInvRef);
    if (!invSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitationData = invSnap.data() || {};
    const resolvedInviteeUid = invitationData.inviteeUid || acceptorUid;
    if (!resolvedInviteeUid) {
      throw new Error('Cannot resolve inviteeUid for invitation acceptance');
    }
    const effectiveAcceptorUid = acceptorUid || resolvedInviteeUid;
    if (!invitationData.inviterId || !invitationData.viajeId) {
      throw new Error('Invitation missing inviterId or viajeId');
    }

    const acceptedAt = Date.now();
    const invitationUpdate = {
      status: 'accepted',
      acceptedAt,
      acceptedBy: effectiveAcceptorUid,
      inviteeUid: resolvedInviteeUid
    };
    
    console.log('[acceptInvitation] Data from invitation doc:', {
      invitationId,
      hasInviterId: 'inviterId' in invitationData,
      hasInviteeUid: 'inviteeUid' in invitationData,
      hasViajeId: 'viajeId' in invitationData,
      invitationDataInviteeUid: invitationData.inviteeUid,
      acceptorUid,
      resolvedInviteeUid
    });

    const nestedInvRef = doc(
      database,
      'usuarios',
      invitationData.inviterId,
      'viajes',
      invitationData.viajeId,
      'invitations',
      resolvedInviteeUid
    );
    const tripRef = doc(database, 'usuarios', invitationData.inviterId, 'viajes', invitationData.viajeId);

    const commitAcceptanceBatch = async () => {
      const batch = writeBatch(database);
      batch.set(nestedInvRef, invitationUpdate, { merge: true });
      batch.update(tripRef, { sharedWith: arrayUnion(resolvedInviteeUid) });
      batch.update(topLevelInvRef, {
        status: 'accepted',
        acceptedAt,
        acceptedBy: effectiveAcceptorUid,
        inviteeUid: resolvedInviteeUid
      });
      await batch.commit();
    };

    try {
      await commitAcceptanceBatch();
    } catch (batchError) {
      const isPermissionDenied =
        batchError?.code === 'permission-denied' ||
        String(batchError?.message || '').includes('PERMISSION_DENIED');

      if (!isPermissionDenied || !auth?.currentUser?.getIdToken) {
        throw batchError;
      }

      await auth.currentUser.getIdToken(true);
      await commitAcceptanceBatch();
    }

    if (import.meta.env.DEV) {
      console.log('[acceptInvitation] Batch commit successful', { invitationId, inviteeUid: resolvedInviteeUid });
    }

    // Verify the update was written successfully
    const verifySnap = await getDoc(topLevelInvRef);
    if (!verifySnap.exists() || verifySnap.data()?.status !== 'accepted') {
      console.error('CRITICAL: Top-level invitation update failed verification', {
        id: invitationId,
        expected: 'accepted',
        actual: verifySnap.data()?.status
      });
      // Still return true since the writes completed, but flag the issue
    }

    return true;
  } catch (err) {
    console.error('REAL ACCEPT INVITATION ERROR:', err);
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
  return onSnapshot(q, (snap) => onUpdate(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
};

export const getInvitationsForUser = async ({ db: _db, uid }) => {
  const database = _db || db;
  const q = query(collection(database, 'invitations'), where('inviteeUid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
};

export const getInvitationsForEmail = async ({ db: _db, email }) => {
  const database = _db || db;
  const q = query(collection(database, 'invitations'), where('inviteeEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
};
