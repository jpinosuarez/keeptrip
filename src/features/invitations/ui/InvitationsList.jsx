import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@shared/firebase';
import useInvitations from '../model/useInvitations';
import { useUI } from '@app/providers/UIContext';
import { useToast } from '@app/providers/ToastContext';
import { COLORS, RADIUS } from '@shared/config';

/**
 * Resuelve displayName del inviter y título del viaje para cada invitación.
 * Se cachea en un Map para evitar lecturas repetidas.
 */
function useInvitationMetadata(invitations) {
  const [meta, setMeta] = useState({}); // { [invId]: { inviterName, tripTitle } }
  const inviterNameCacheRef = useRef(new Map());
  const tripTitleCacheRef = useRef(new Map());

  useEffect(() => {
    if (!invitations || invitations.length === 0) {
      return;
    }

    let cancelled = false;

    (async () => {
      const missingInviters = [...new Set(invitations.map((inv) => inv.inviterId).filter(Boolean))]
        .filter((inviterId) => !inviterNameCacheRef.current.has(inviterId));

      const missingTrips = [...new Set(
        invitations
          .filter((inv) => inv.inviterId && inv.viajeId)
          .map((inv) => `${inv.inviterId}/${inv.viajeId}`)
      )].filter((tripKey) => !tripTitleCacheRef.current.has(tripKey));

      await Promise.all([
        Promise.all(missingInviters.map(async (inviterId) => {
          try {
            const perfilSnap = await getDoc(doc(db, 'usuarios', inviterId));
            const inviterName = perfilSnap.exists() ? (perfilSnap.data().displayName || inviterId) : inviterId;
            inviterNameCacheRef.current.set(inviterId, inviterName);
          } catch {
            inviterNameCacheRef.current.set(inviterId, inviterId);
          }
        })),
        Promise.all(missingTrips.map(async (tripKey) => {
          const [ownerUid, viajeId] = tripKey.split('/');
          try {
            const viajeSnap = await getDoc(doc(db, `usuarios/${ownerUid}/viajes/${viajeId}`));
            const tripTitle = viajeSnap.exists()
              ? (viajeSnap.data().titulo || viajeSnap.data().nombreEspanol || viajeId)
              : viajeId;
            tripTitleCacheRef.current.set(tripKey, tripTitle);
          } catch {
            tripTitleCacheRef.current.set(tripKey, viajeId);
          }
        }))
      ]);

      if (cancelled) return;

      const nextMeta = {};
      for (const inv of invitations) {
        const tripKey = inv.inviterId && inv.viajeId ? `${inv.inviterId}/${inv.viajeId}` : null;
        nextMeta[inv.id] = {
          inviterName: inviterNameCacheRef.current.get(inv.inviterId) || inv.inviterId || 'Un usuario',
          tripTitle: (tripKey ? tripTitleCacheRef.current.get(tripKey) : null) || inv.viajeId
        };
      }

      setMeta(nextMeta);
    })();

    return () => { cancelled = true; };
  }, [invitations]);

  return invitations && invitations.length > 0 ? meta : {};
}

export default function InvitationsList({ compact = false, hook = null }) {
  const defaultInvitationsHook = useInvitations();
  const { invitations, acceptInvitation, declineInvitation } = hook || defaultInvitationsHook;
  const { abrirVisor, setVistaActiva } = useUI();
  const { pushToast } = useToast();
  const metadata = useInvitationMetadata(invitations);

  if (!invitations || invitations.length === 0) {
    return compact ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={16} />
      </div>
    ) : (
      <div className="inv-empty" data-testid="inv-empty">No hay invitaciones pendientes.</div>
    );
  }

  return (
    <div className="invitations-list" style={{ minWidth: compact ? 0 : 340 }}>
      {invitations.map((inv) => {
        const m = metadata[inv.id] || {};
        const inviterLabel = m.inviterName || inv.inviterId || 'Un usuario';
        const tripLabel = m.tripTitle || inv.viajeId;
        return (
        <div key={inv.id} data-testid={`inv-card-${inv.id}`} className="inv-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 8, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 600 }} data-testid={`inv-inviter-${inv.id}`}>{inviterLabel}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }} data-testid={`inv-trip-${inv.id}`}>{tripLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {inv.status === 'pending' ? (
              <>
                <button
                  data-testid={`inv-accept-${inv.id}`}
                  aria-label={`Aceptar invitación de ${inviterLabel} para ${tripLabel}`}
                  onClick={async (e) => {
                    const ok = await acceptInvitation(inv.id);
                    if (ok) {
                      try { e?.currentTarget?.blur?.(); } catch { /* safe fallback for tests */ }
                      pushToast('Invitación aceptada — ahora puedes ver el viaje', 'success');
                      setVistaActiva('bitacora');
                      abrirVisor(inv.viajeId);
                    } else {
                      pushToast('No se pudo aceptar la invitación', 'error');
                    }
                  }}
                  style={{ background: '#10b981', color: COLORS.surface, border: 'none', padding: '6px 10px', borderRadius: RADIUS.xs }}
                >Aceptar</button>

                <button
                  data-testid={`inv-decline-${inv.id}`}
                  aria-label={`Rechazar invitación de ${inviterLabel}`}
                  onClick={async () => { const ok = await declineInvitation(inv.id); if (ok) pushToast('Invitación rechazada', 'warning'); }}
                  style={{ background: COLORS.danger, color: COLORS.surface, border: 'none', padding: '6px 10px', borderRadius: RADIUS.xs }}
                >Rechazar</button>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#6b7280' }}>{inv.status}</div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
