import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@app/providers/AuthContext';
import * as invitationsService from '../api/invitationsService';

export default function useInvitations() {
  const { usuario } = useAuth();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!usuario?.uid) return undefined;
    const unsub = invitationsService.listenToInvitationsForUser(usuario.uid, setInvitations);
    return () => unsub && unsub();
  }, [usuario?.uid]);

  const acceptInvitation = useCallback(async (invId) => {
    if (!usuario?.uid) throw new Error('Not authenticated');
    const result = await invitationsService.acceptInvitation({ db: null, invitationId: invId, acceptorUid: usuario.uid });
    
    if (result) {
      // Espera a que Firestore replique/sincronice los cambios
      await new Promise(r => setTimeout(r, 4000));
    }
    
    return result;
  }, [usuario]);

  const declineInvitation = useCallback(async (invId) => {
    if (!usuario?.uid) throw new Error('Not authenticated');
    return invitationsService.declineInvitation({ db: null, invitationId: invId, declinerUid: usuario.uid });
  }, [usuario]);

  return { invitations, acceptInvitation, declineInvitation };
}
