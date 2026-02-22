import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

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

  // If inviteeUid is known, store the invitation under the viaje so rules can check it deterministically
  if (inviteeUid) {
    const ref = doc(database, `usuarios/${inviterId}/viajes/${viajeId}/invitations/${inviteeUid}`);
    await setDoc(ref, payload, { merge: true });
    return `${viajeId}_${inviteeUid}`;
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
    const inv = invSnap.data();

    await updateDoc(invitationRef, { status: 'accepted', acceptedAt: Date.now(), acceptedBy: acceptorUid });

    if (inv.inviterId && inv.viajeId) {
      const viajeRef = doc(database, 'usuarios', inv.inviterId, 'viajes', inv.viajeId);
      await updateDoc(viajeRef, { sharedWith: arrayUnion(acceptorUid) });
    }

    return true;
  } catch (err) {
    console.error('acceptInvitation error', err);
    return false;
  }
};

export const declineInvitation = async ({ db: _db, invitationId, declinerUid }) => {
  const database = _db || db;
  try {
    const invitationRef = doc(database, 'invitations', invitationId);
    await updateDoc(invitationRef, { status: 'declined', declinedAt: Date.now(), declinedBy: declinerUid });
    return true;
  } catch (err) {
    console.error('declineInvitation error', err);
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
