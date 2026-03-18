import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  addDocMock,
  arrayUnionMock,
  collectionMock,
  docMock,
  getDocMock,
  setDocMock,
  updateDocMock
} = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  arrayUnionMock: vi.fn((value) => value),
  collectionMock: vi.fn(),
  docMock: vi.fn(),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
  updateDocMock: vi.fn()
}));

vi.mock('@shared/firebase', () => ({
  db: { __db: 'default-db' }
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  addDoc: addDocMock,
  doc: docMock,
  getDocs: vi.fn(),
  getDoc: getDocMock,
  setDoc: setDocMock,
  updateDoc: updateDocMock,
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: vi.fn(),
  arrayUnion: arrayUnionMock,
  orderBy: vi.fn()
}));

import { createInvitation, acceptInvitation, declineInvitation } from '../invitationsService';

describe('invitationsService.createInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionMock.mockReturnValue({ id: 'invitations-collection' });
    docMock.mockImplementation((...args) => ({ args, path: args.slice(1).join('/') }));
    setDocMock.mockResolvedValue(undefined);
    updateDocMock.mockResolvedValue(undefined);
    addDocMock.mockResolvedValue({ id: 'generated-id' });
    getDocMock.mockResolvedValue({ exists: () => false });
  });

  it('writes nested and top-level invitation when inviteeUid is provided', async () => {
    const invitationId = await createInvitation({
      db: { __db: 'test-db' },
      inviterId: 'owner-1',
      inviteeUid: 'guest-1',
      viajeId: 'trip-1'
    });

    expect(invitationId).toBe('trip-1_guest-1');
    expect(docMock).toHaveBeenCalledWith(
      { __db: 'test-db' },
      'usuarios/owner-1/viajes/trip-1/invitations/guest-1'
    );
    expect(docMock).toHaveBeenCalledWith(
      { __db: 'test-db' },
      'invitations',
      'trip-1_guest-1'
    );
    expect(setDocMock).toHaveBeenCalledTimes(2);
    expect(setDocMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ args: [{ __db: 'test-db' }, 'usuarios/owner-1/viajes/trip-1/invitations/guest-1'] }),
      expect.objectContaining({
        inviterId: 'owner-1',
        inviteeUid: 'guest-1',
        viajeId: 'trip-1',
        status: 'pending'
      }),
      { merge: true }
    );
    expect(setDocMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ args: [{ __db: 'test-db' }, 'invitations', 'trip-1_guest-1'] }),
      expect.objectContaining({
        inviterId: 'owner-1',
        inviteeUid: 'guest-1',
        viajeId: 'trip-1',
        status: 'pending'
      }),
      { merge: true }
    );
  });

  it('writes only top-level invitation when inviteeUid is not provided', async () => {
    const invitationId = await createInvitation({
      db: { __db: 'test-db' },
      inviterId: 'owner-1',
      inviteeEmail: 'guest@example.test',
      viajeId: 'trip-1'
    });

    expect(invitationId).toBe('generated-id');
    expect(collectionMock).toHaveBeenCalledWith({ __db: 'test-db' }, 'invitations');
    expect(addDocMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('throws if inviteeUid is provided without inviterId/viajeId', async () => {
    await expect(createInvitation({ db: { __db: 'test-db' }, inviteeUid: 'guest-1' })).rejects.toThrow(
      'inviterId and viajeId are required when inviteeUid is provided'
    );
  });

  it('accepts invitation and updates nested invitation, viaje.sharedWith and top-level invitation', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ inviterId: 'owner-1', inviteeUid: 'guest-1', viajeId: 'trip-1', status: 'pending', sharedWith: [] })
    });

    const ok = await acceptInvitation({
      db: { __db: 'test-db' },
      invitationId: 'trip-1_guest-1',
      acceptorUid: 'guest-1'
    });

    expect(ok).toBe(true);
    expect(getDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'invitations/trip-1_guest-1' })
    );

    expect(setDocMock).toHaveBeenCalledTimes(2);
    expect(setDocMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: 'usuarios/owner-1/viajes/trip-1/invitations/guest-1' }),
      expect.objectContaining({ status: 'accepted', acceptedBy: 'guest-1', inviteeUid: 'guest-1' }),
      { merge: true }
    );

    expect(setDocMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: 'usuarios/owner-1/viajes/trip-1' }),
      { sharedWith: ['guest-1'] },
      { merge: true }
    );

    expect(updateDocMock).toHaveBeenCalledTimes(1);
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'invitations/trip-1_guest-1' }),
      expect.objectContaining({ status: 'accepted', acceptedBy: 'guest-1', inviteeUid: 'guest-1' })
    );
  });

  it('declines invitation and updates only top-level invitation status', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ inviterId: 'owner-1', inviteeUid: 'guest-2', viajeId: 'trip-1', status: 'pending' })
    });

    const ok = await declineInvitation({
      db: { __db: 'test-db' },
      invitationId: 'trip-1_guest-2',
      declinerUid: 'guest-2'
    });

    expect(ok).toBe(true);
    expect(setDocMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'invitations/trip-1_guest-2' }),
      expect.objectContaining({ status: 'declined', declinedBy: 'guest-2' }),
      { merge: true }
    );
  });

  it('returns false on accept when invitation does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    const ok = await acceptInvitation({
      db: { __db: 'test-db' },
      invitationId: 'missing',
      acceptorUid: 'guest-1'
    });

    expect(ok).toBe(false);
    expect(setDocMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });
});
