import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../../../../../firebase';
import { createInvitation as createInvitationService } from '../../../../invitations/api/invitationsService';

export function useEdicionCompanions({ formData, setFormData, viaje, usuario, pushToast, t }) {
  const [companionDraft, setCompanionDraft] = useState('');
  const [companionResults, setCompanionResults] = useState([]);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const performCompanionQuery = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setCompanionResults([]);
      return;
    }

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const usuariosRef = collection(db, 'usuarios');
      const qName = query(usuariosRef, where('displayName', '>=', q), where('displayName', '<=', `${q}\uf8ff`));
      const snap = await getDocs(qName);
      const results = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setCompanionResults(results.slice(0, 8));
    } catch {
      setCompanionResults([]);
    }
  }, []);

  const handleCompanionSearch = useCallback(
    (q) => {
      setCompanionDraft(q);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        void performCompanionQuery(q);
      }, 250);
    },
    [performCompanionQuery]
  );

  const handleAddCompanionFromResult = useCallback(
    async (user) => {
      const exists = (formData.companions || []).some(
        (c) => c.userId === user.uid || (c.email && user.email && c.email === user.email)
      );
      if (exists) {
        pushToast(t('warning.companionAlreadyAdded'), 'warning');
        setCompanionResults([]);
        setCompanionDraft('');
        return;
      }

      const next = {
        name: user.displayName || user.email || 'Invitado',
        email: user.email || null,
        userId: user.uid,
        status: 'pending',
      };
      setFormData((prev) => ({ ...prev, companions: [...(prev.companions || []), next] }));

      if (viaje?.id && usuario?.uid) {
        try {
          await createInvitationService({ db, inviterId: usuario.uid, inviteeUid: user.uid, viajeId: viaje.id });
          pushToast(t('toast.invitationSent'), 'success');
        } catch {
          pushToast(t('error.invitationFailed'), 'error');
        }
      }

      setCompanionResults([]);
      setCompanionDraft('');
    },
    [formData.companions, pushToast, setFormData, t, usuario?.uid, viaje?.id]
  );

  const handleAddCompanionFreeform = useCallback(
    async (text) => {
      const trimmed = text.trim();
      const exists = (formData.companions || []).some(
        (c) => (c.email && c.email === trimmed) || (c.name && c.name === trimmed)
      );
      if (exists) {
        pushToast(t('warning.companionAlreadyAdded'), 'warning');
        setCompanionDraft('');
        return;
      }

      const next = {
        name: trimmed,
        email: trimmed.includes('@') ? trimmed : null,
        userId: null,
        status: 'pending',
      };
      setFormData((prev) => ({ ...prev, companions: [...(prev.companions || []), next] }));

      if (viaje?.id && usuario?.uid && trimmed.includes('@')) {
        try {
          await createInvitationService({ db, inviterId: usuario.uid, inviteeEmail: trimmed, viajeId: viaje.id });
          pushToast(t('toast.invitationCreated'), 'info');
        } catch {
          pushToast(t('error.invitationFailed'), 'error');
        }
      }

      setCompanionDraft('');
    },
    [formData.companions, pushToast, setFormData, t, usuario?.uid, viaje?.id]
  );

  return {
    companionDraft,
    companionResults,
    setCompanionDraft,
    setCompanionResults,
    handleCompanionSearch,
    handleAddCompanionFromResult,
    handleAddCompanionFreeform,
  };
}
