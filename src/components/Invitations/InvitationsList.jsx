import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import useInvitations from '../../hooks/useInvitations';
import { styles as headerStyles } from '../Header/Header.styles';
import { useUI } from '../../context/UIContext';
import { useToast } from '../../context/ToastContext';

/**
 * Resuelve displayName del inviter y título del viaje para cada invitación.
 * Se cachea en un Map para evitar lecturas repetidas.
 */
function useInvitationMetadata(invitations) {
  const [meta, setMeta] = useState({}); // { [invId]: { inviterName, tripTitle } }

  useEffect(() => {
    if (!invitations || invitations.length === 0) return;
    let cancelled = false;
    const cache = {};

    (async () => {
      for (const inv of invitations) {
        if (cancelled) break;
        const entry = { inviterName: null, tripTitle: null };
        try {
          // Resolver nombre del inviter desde su perfil público
          const perfilSnap = await getDoc(doc(db, 'usuarios', inv.inviterId));
          entry.inviterName = perfilSnap.exists() ? (perfilSnap.data().displayName || inv.inviterId) : inv.inviterId;
        } catch (_) { entry.inviterName = inv.inviterId; }

        try {
          // Resolver titulo del viaje — la invitación suele tener ownerUid + viajeId
          const ownerUid = inv.inviterId; // owner es quien invita
          const viajeSnap = await getDoc(doc(db, `usuarios/${ownerUid}/viajes/${inv.viajeId}`));
          entry.tripTitle = viajeSnap.exists() ? (viajeSnap.data().titulo || viajeSnap.data().nombreEspanol || inv.viajeId) : inv.viajeId;
        } catch (_) { entry.tripTitle = inv.viajeId; }

        cache[inv.id] = entry;
      }
      if (!cancelled) setMeta({ ...cache });
    })();

    return () => { cancelled = true; };
  }, [invitations]);

  return meta;
}

export default function InvitationsList({ compact = false, hook = null }) {
  const { invitations, acceptInvitation, declineInvitation } = hook || useInvitations();
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
                      try { e?.currentTarget?.blur?.(); } catch(_) { /* safe fallback for tests */ }
                      pushToast('Invitación aceptada — ahora puedes ver el viaje', 'success');
                      setVistaActiva('bitacora');
                      abrirVisor(inv.viajeId);
                    } else {
                      pushToast('No se pudo aceptar la invitación', 'error');
                    }
                  }}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}
                >Aceptar</button>

                <button
                  data-testid={`inv-decline-${inv.id}`}
                  aria-label={`Rechazar invitación de ${inviterLabel}`}
                  onClick={async () => { const ok = await declineInvitation(inv.id); if (ok) pushToast('Invitación rechazada', 'warning'); }}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}
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
