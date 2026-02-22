import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as invitationsService from '../services/invitationsService';

export default function useInvitations() {
  const { usuario } = useAuth();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!usuario?.uid) return undefined;
    const unsub = invitationsService.listenToInvitationsForUser(usuario.uid, setInvitations);
    return () => unsub && unsub();
  }, [usuario?.uid]);

  const acceptInvitation = useCallback(async (invId) => {
    if (!usuario) throw new Error('Not authenticated');
    return invitationsService.acceptInvitation({ db: null, invitationId: invId, acceptorUid: usuario.uid });
  }, [usuario]);

  const declineInvitation = useCallback(async (invId) => {
    if (!usuario) throw new Error('Not authenticated');
    return invitationsService.declineInvitation({ db: null, invitationId: invId, declinerUid: usuario.uid });
  }, [usuario]);

  return { invitations, acceptInvitation, declineInvitation };
}
