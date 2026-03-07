import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';

export function useVisorViajeData({ viajeId, bitacoraData, bitacoraLista, usuario }) {
  const viajeBase = useMemo(
    () => bitacoraLista.find((v) => v.id === viajeId),
    [bitacoraLista, viajeId]
  );

  const hasViajeData = Boolean(viajeId && (bitacoraData[viajeId] || viajeBase));
  const data = bitacoraData[viajeId] || viajeBase || {};
  const ownerUid = data.ownerId || usuario?.uid || null;

  const [paradas, setParadas] = useState([]);
  const [ownerDisplayName, setOwnerDisplayName] = useState(null);
  const isSharedTrip = Boolean(data.ownerId && usuario && data.ownerId !== usuario.uid);

  useEffect(() => {
    if (!isSharedTrip) return;

    let cancelled = false;

    (async () => {
      try {
        const perfilSnap = await getDoc(doc(db, 'usuarios', data.ownerId));
        if (!cancelled && perfilSnap.exists()) {
          setOwnerDisplayName(perfilSnap.data().displayName || data.ownerId);
        }
      } catch {
        // No bloquear el render del visor por fallas de perfil.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSharedTrip, data.ownerId]);

  const reloadParadas = useCallback(async () => {
    if (!viajeId || !ownerUid) return;
    const ref = collection(db, `usuarios/${ownerUid}/viajes/${viajeId}/paradas`);
    const snap = await getDocs(ref);
    const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
  }, [viajeId, ownerUid]);

  useEffect(() => {
    if (!viajeId || !ownerUid) return;

    const fetchParadas = async () => {
      const ref = collection(db, `usuarios/${ownerUid}/viajes/${viajeId}/paradas`);
      const snap = await getDocs(ref);
      const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    };

    fetchParadas();
  }, [viajeId, ownerUid]);

  return {
    viajeBase,
    hasViajeData,
    data,
    ownerUid,
    paradas,
    isSharedTrip,
    ownerDisplayName,
    reloadParadas,
  };
}
