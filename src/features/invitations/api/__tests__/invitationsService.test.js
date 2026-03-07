import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  addDocMock,
  arrayUnionMock,
  collectionMock,
  docMock,
  runTransactionMock,
  setDocMock
} = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  arrayUnionMock: vi.fn((value) => value),
  collectionMock: vi.fn(),
  docMock: vi.fn(),
  runTransactionMock: vi.fn(),
  setDocMock: vi.fn()
}));

vi.mock('@shared/firebase', () => ({
  db: { __db: 'default-db' }
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  addDoc: addDocMock,
  doc: docMock,
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: setDocMock,
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: runTransactionMock,
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
    addDocMock.mockResolvedValue({ id: 'generated-id' });
    runTransactionMock.mockImplementation(async (_database, callback) => callback({
      get: vi.fn(),
      update: vi.fn(),
      set: vi.fn()
    }));
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

  it('accepts invitation and updates top-level invitation plus viaje.sharedWith', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ inviterId: 'owner-1', inviteeUid: 'guest-1', viajeId: 'trip-1', status: 'pending' })
      }),
      update: vi.fn(),
      set: vi.fn()
    };
    runTransactionMock.mockImplementation(async (_database, callback) => callback(transaction));

    const ok = await acceptInvitation({
      db: { __db: 'test-db' },
      invitationId: 'trip-1_guest-1',
      acceptorUid: 'guest-1'
    });

    expect(ok).toBe(true);
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
    expect(arrayUnionMock).toHaveBeenCalledWith('guest-1');

    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'invitations/trip-1_guest-1' }),
      expect.objectContaining({ status: 'accepted', acceptedBy: 'guest-1', inviteeUid: 'guest-1' })
    );

    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'usuarios/owner-1/viajes/trip-1' }),
      { sharedWith: 'guest-1' }
    );

    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('declines invitation and updates only top-level invitation status', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ inviterId: 'owner-1', inviteeUid: 'guest-2', viajeId: 'trip-1', status: 'pending' })
      }),
      update: vi.fn(),
      set: vi.fn()
    };
    runTransactionMock.mockImplementation(async (_database, callback) => callback(transaction));

    const ok = await declineInvitation({
      db: { __db: 'test-db' },
      invitationId: 'trip-1_guest-2',
      declinerUid: 'guest-2'
    });

    expect(ok).toBe(true);
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'invitations/trip-1_guest-2' }),
      expect.objectContaining({ status: 'declined', declinedBy: 'guest-2' })
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('returns false on accept when invitation does not exist', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({ exists: () => false }),
      update: vi.fn(),
      set: vi.fn()
    };
    runTransactionMock.mockImplementation(async (_database, callback) => callback(transaction));

    const ok = await acceptInvitation({
      db: { __db: 'test-db' },
      invitationId: 'missing',
      acceptorUid: 'guest-1'
    });

    expect(ok).toBe(false);
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
