import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@shared/firebase';

export function useVisorViajeData({ viajeId, bitacoraData, bitacoraLista, usuario }) {
  const tripBase = useMemo(
    () => bitacoraLista.find((v) => v.id === viajeId),
    [bitacoraLista, viajeId]
  );

  // Fallback data when we don't yet have the trip in the user's local trips collection.
  // This happens when the user navigates directly to a shared trip before the
  // shared-trip listener has populated the local state.
  const [fallbackTrip, setFallbackTrip] = useState(null);
  const [fallbackOwnerId, setFallbackOwnerId] = useState(null);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);

  const hasViajeData = Boolean(
    viajeId && (bitacoraData[viajeId] || tripBase || fallbackTrip)
  );

  const data = bitacoraData[viajeId] || tripBase || fallbackTrip || {};
  const ownerUid = data.ownerId || fallbackOwnerId || usuario?.uid || null;

  const [paradas, setParadas] = useState([]);
  const [ownerDisplayName, setOwnerDisplayName] = useState(null);
  const isSharedTrip = Boolean(data.ownerId && usuario && data.ownerId !== usuario.uid);

  // If the trip isn't part of the user's local bitacora yet, try to resolve it using
  // the accepted invitation record (this allows direct deep links to shared trips).
  useEffect(() => {
    if (!viajeId || !usuario?.uid) return;

    // If we already have it locally, clear any previous fallback state.
    if (bitacoraData[viajeId] || tripBase) {
      setFallbackTrip(null);
      setFallbackOwnerId(null);
      setFallbackAttempts(0);
      return;
    }

    const MAX_ATTEMPTS = 5;
    if (fallbackAttempts >= MAX_ATTEMPTS) {
      console.warn('useVisorViajeData: Max fallback attempts reached', { viajeId, userId: usuario.uid, attempts: fallbackAttempts });
      return;
    }

    let mounted = true;
    let timeoutId;

    const attemptFallbackLoad = async () => {
      try {
        if (import.meta.env.DEV) {
          console.debug('useVisorViajeData: Attempting fallback load', { viajeId, userId: usuario.uid, attempt: fallbackAttempts + 1 });
        }
        // 1) Preferential query: accepted invitations for this user + trip
        const invitationsQ = query(
          collection(db, 'invitations'),
          where('inviteeUid', '==', usuario.uid),
          where('viajeId', '==', viajeId),
          where('status', '==', 'accepted')
        );
        let invSnap;

        try {
          invSnap = await getDocs(invitationsQ);
        } catch (err) {
          // In case the query requires a composite index or is blocked by security rules,
          // fall back to reading by document ID. The standardized invitation ID format is
          // ${viajeId}_${inviteeUid}
          const invitationId = `${viajeId}_${usuario.uid}`;
          if (import.meta.env.DEV) {
            console.debug('useVisorViajeData: Query failed, trying standardized ID', { invitationId, error: err.message });
          }

          try {
            const docSnap = await getDoc(doc(db, 'invitations', invitationId));
            if (docSnap.exists() && docSnap.data()?.status === 'accepted') {
              invSnap = { docs: [docSnap] };
            }
          } catch {
            // ignore
          }

          if (!invSnap?.docs?.length) throw err;
        }

        if (!mounted || !invSnap) return;
        if (import.meta.env.DEV) {
          console.debug('Shared trip invitation query result', { viajeId, inviteeUid: usuario.uid, docs: invSnap.docs.map((d) => d.id) });
        }
        let invDoc = null;

        if (!invSnap.empty) {
          invDoc = invSnap.docs[0];
        } else {
          // If the query returned no docs (e.g., composite index missing or data shaped differently),
          // try the standardized invitation ID format.
          const invitationId = `${viajeId}_${usuario.uid}`;
          try {
            const docSnap = await getDoc(doc(db, 'invitations', invitationId));
            if (import.meta.env.DEV) {
              console.debug('Shared trip fallback id check', {
                viajeId,
                inviteeUid: usuario.uid,
                id: invitationId,
                exists: docSnap.exists(),
                data: docSnap.exists() ? JSON.stringify(docSnap.data()) : null,
              });
            }
            if (docSnap.exists() && docSnap.data()?.status === 'accepted') {
              invDoc = docSnap;
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.debug('Shared trip fallback id check failed', { id: invitationId, error: err });
            }
          }
        }

        if (!invDoc || !invDoc.exists()) return;

        const invData = invDoc.data();
        if (!invData || !invData.inviterId) return;

        const ownerId = invData.inviterId;
        const viajeSnap = await getDoc(doc(db, 'usuarios', ownerId, 'viajes', viajeId));
        if (!mounted || !viajeSnap.exists()) return;

        const tripFromOwner = { ...viajeSnap.data(), id: viajeSnap.id, ownerId };
        setFallbackTrip(tripFromOwner);
        setFallbackOwnerId(ownerId);
        if (import.meta.env.DEV) {
          console.debug('Shared trip fallback loaded', { viajeId, ownerId, tripFromOwner });
        }
      } catch (err) {
        // No bloquear el render del visor por fallas en esta fallback (puede ser
        // causado por reglas de seguridad o falta de invitación).
        console.warn('[useVisorViajeData Fallback] Error loading shared trip', {
          viajeId,
          userId: usuario.uid,
          attempt: fallbackAttempts + 1,
          errorMessage: err?.message,
          errorCode: err?.code
        });
      } finally {
        if (mounted) setFallbackAttempts((prev) => prev + 1);
      }
    };

    attemptFallbackLoad();

    // Retry a few times in case the accepted invitation appears shortly after.
    if (fallbackAttempts + 1 < MAX_ATTEMPTS) {
      timeoutId = window.setTimeout(() => {
        if (mounted) setFallbackAttempts((prev) => prev + 1);
      }, 500);
    }

    return () => {
      mounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [bitacoraData, tripBase, viajeId, usuario?.uid, fallbackAttempts]);

  useEffect(() => {
    if (!isSharedTrip) return;

    let mounted = true;

    (async () => {
      try {
        const perfilSnap = await getDoc(doc(db, 'usuarios', data.ownerId));
        if (!mounted) return;
        if (!perfilSnap.exists()) return;
        setOwnerDisplayName(perfilSnap.data().displayName || data.ownerId);
      } catch (err) {
        // No bloquear el render del visor por fallas de perfil.
        console.warn('Failed to load owner profile for shared trip', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isSharedTrip, data.ownerId]);

  const reloadParadas = useCallback(async () => {
    if (!viajeId || !ownerUid) return;
    try {
      const ref = collection(db, `usuarios/${ownerUid}/viajes/${viajeId}/paradas`);
      const snap = await getDocs(ref);
      const loaded = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    } catch (err) {
      console.warn('Error reloading paradas:', err);
    }
  }, [viajeId, ownerUid]);

  useEffect(() => {
    if (!viajeId || !ownerUid) return;

    let mounted = true;

    const fetchParadas = async () => {
      try {
        const ref = collection(db, `usuarios/${ownerUid}/viajes/${viajeId}/paradas`);
        const snap = await getDocs(ref);
        if (!mounted) return;
        const loaded = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      } catch (err) {
        if (!mounted) return;
        console.warn('Error loading paradas:', err);
      }
    };

    fetchParadas();

    return () => {
      mounted = false;
    };
  }, [viajeId, ownerUid]);

  return {
    viajeBase: tripBase,
    hasViajeData,
    data,
    ownerUid,
    paradas,
    isSharedTrip,
    ownerDisplayName,
    reloadParadas,
  };
}
