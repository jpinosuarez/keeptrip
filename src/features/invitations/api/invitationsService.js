import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  runTransaction,
  query,
  where,
  onSnapshot,
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
    const withRetry = async (operation, maxAttempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          }
        }
      }
      throw lastError;
    };

    const invitationRef = doc(database, 'invitations', invitationId);

    const invSnap = await getDoc(invitationRef);
    if (!invSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitationData = invSnap.data() || {};
    const resolvedInviteeUid = invitationData.inviteeUid || acceptorUid;
    if (!resolvedInviteeUid) {
      throw new Error('Cannot resolve inviteeUid for invitation acceptance');
    }
    const effectiveAcceptorUid = acceptorUid || resolvedInviteeUid;
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

    // SEQUENCE IS CRITICAL for security rules.
    // 1) nested invitation must exist/update first
    // 2) then trip sharedWith can be modified
    // 3) finally top-level invitation is updated
    if (invitationData.inviterId && invitationData.viajeId) {
      // 1. Update nested invitation first (required by firestore.rules)
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
      if (import.meta.env.DEV) {
        console.log('[acceptInvitation] Updated nested invitation FIRST', { path: `usuarios/${invitationData.inviterId}/viajes/${invitationData.viajeId}/invitations/${resolvedInviteeUid}` });
      }

      // 2. Then update sharedWith on the trip document
      const viajeRef = doc(database, 'usuarios', invitationData.inviterId, 'viajes', invitationData.viajeId);
      const viajeSnap = await withRetry(() => getDoc(viajeRef));
      const currentSharedWith = Array.isArray(viajeSnap.data()?.sharedWith)
        ? viajeSnap.data().sharedWith
        : [];
      const nextSharedWith = currentSharedWith.includes(resolvedInviteeUid)
        ? currentSharedWith
        : [...currentSharedWith, resolvedInviteeUid];
      await withRetry(() => setDoc(viajeRef, { sharedWith: nextSharedWith }, { merge: true }));
      if (import.meta.env.DEV) {
        console.log('[acceptInvitation] Updated viaje sharedWith after nested invitation', { path: `usuarios/${invitationData.inviterId}/viajes/${invitationData.viajeId}`, userId: resolvedInviteeUid });
      }
    }

    // 3. Update the top-level invitation record last.
    await withRetry(() => updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt,
      acceptedBy: effectiveAcceptorUid,
      inviteeUid: resolvedInviteeUid
    }));
    if (import.meta.env.DEV) {
      console.log('[acceptInvitation] Updated top-level invitation with inviteeUid', {
        id: invitationId,
        inviteeUid: resolvedInviteeUid
      });
    }

    // Verify the update was written successfully
    const verifySnap = await getDoc(invitationRef);
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
