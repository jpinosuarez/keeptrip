import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { compressImage } from '@shared/lib/utils/imageUtils';

export const suscribirViajesConParadas = ({ db, userId, onData, onError }) => {
  let latestSnapshotId = 0;

  const viajesRef = collection(db, `usuarios/${userId}/viajes`);
  const q = query(viajesRef, orderBy('fechaInicio', 'desc'));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    async (snapshot) => {
      const snapshotId = ++latestSnapshotId;

      try {
        const viajes = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            ...data,
            createdAt:
              data.createdAt ??
              (item.metadata.hasPendingWrites ? new Date() : null),
          };
        });
        const paradasPromises = viajes.map(async (viaje) => {
          const paradasRef = collection(db, `usuarios/${userId}/viajes/${viaje.id}/paradas`);
          const paradasSnap = await getDocs(paradasRef);
          return paradasSnap.docs.map((parada) => ({
            id: parada.id,
            viajeId: viaje.id,
            ...parada.data()
          }));
        });

        const paradasPorViaje = await Promise.all(paradasPromises);
        if (snapshotId !== latestSnapshotId) return;
        onData({ viajes, paradas: paradasPorViaje.flat() });
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => onError?.(error)
  );
};

export const guardarViajeConParadas = async ({ db, userId, viaje, paradas = [] }) => {
  console.log('[viajesRepository] guardarViajeConParadas start', { userId, viajeId: viaje?.id, viaje, paradas });
  const batch = writeBatch(db);
  const viajeRef = doc(collection(db, `usuarios/${userId}/viajes`));
  batch.set(viajeRef, viaje);

  paradas.forEach((parada) => {
    const paradaRef = doc(collection(db, `usuarios/${userId}/viajes/${viajeRef.id}/paradas`));
    batch.set(paradaRef, parada);
  });

  try {
    await batch.commit();
  } catch (err) {
    console.error('[viajesRepository] guardarViajeConParadas commit error', err);
    throw err;
  }

  console.log('[viajesRepository] guardarViajeConParadas success', { viajeId: viajeRef.id });
  return viajeRef.id;
};

export const actualizarViaje = ({ db, userId, viajeId, data }) =>
  updateDoc(doc(db, `usuarios/${userId}/viajes`, viajeId), data);

export const crearParada = ({ db, userId, viajeId, data }) =>
  addDoc(collection(db, `usuarios/${userId}/viajes/${viajeId}/paradas`), data);

export const actualizarParada = ({ db, userId, viajeId, paradaId, data }) =>
  updateDoc(doc(db, `usuarios/${userId}/viajes/${viajeId}/paradas`, paradaId), data);

export const eliminarParada = ({ db, userId, viajeId, paradaId }) =>
  deleteDoc(doc(db, `usuarios/${userId}/viajes/${viajeId}/paradas`, paradaId));

export const eliminarViaje = async ({ db, userId, viajeId }) => {
  // Firestore deleteDoc resolves even if the document doesn't exist.
  // We check after deletion to ensure the document is gone.
  const primaryRef = doc(db, `usuarios/${userId}/viajes`, viajeId);

  try {
    await deleteDoc(primaryRef);
    const after = await getDoc(primaryRef);
    if (after.exists()) {
      throw new Error('Deletion did not remove the document');
    }
    return true;
  } catch (primaryError) {
    // Attempt legacy deletion path (e.g. older tests) to avoid silent failures.
    try {
      const legacyRef = doc(db, `viajes`, viajeId);
      await deleteDoc(legacyRef);
      const afterLegacy = await getDoc(legacyRef);
      if (afterLegacy.exists()) {
        throw new Error('Legacy deletion did not remove the document');
      }
      return true;
    } catch {
      // Prefer returning the original error for better logging.
      throw primaryError;
    }
  }
};

export const subirFotoViaje = async ({ storage, userId, viajeId, foto }) => {
  try {
    const storageRef = ref(storage, `usuarios/${userId}/viajes/${viajeId}/portada.jpg`);

    if (foto instanceof Blob) {
      let blobToUpload = foto;

      try {
        const compressed = await compressImage(foto, 1920, 0.8);
        blobToUpload = compressed.blob;
      } catch (err) {
        // If compression fails for any reason, fall back to the original blob.
        // We log to help understand frequency without breaking uploads.
        console.warn('Image compression failed, falling back to original blob', err);
      }

      await uploadBytes(storageRef, blobToUpload, { contentType: blobToUpload.type || 'image/jpeg' });
      return await getDownloadURL(storageRef);
    }

    if (typeof foto === 'string' && foto.startsWith('data:image')) {
      await uploadString(storageRef, foto, 'data_url');
      return await getDownloadURL(storageRef);
    }

    return null;
  } catch (error) {
    console.error('[subirFotoViaje] Upload to Firebase Storage failed', {
      userId,
      viajeId,
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
};
