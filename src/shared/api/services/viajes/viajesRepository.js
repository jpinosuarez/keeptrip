import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';

export const suscribirViajesConParadas = ({ db, userId, onData, onError }) => {
  const viajesRef = collection(db, `usuarios/${userId}/viajes`);
  const q = query(viajesRef, orderBy('fechaInicio', 'desc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const viajes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
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
        onData({ viajes, paradas: paradasPorViaje.flat() });
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => onError?.(error)
  );
};

export const guardarViajeConParadas = async ({ db, userId, viaje, paradas = [] }) => {
  const batch = writeBatch(db);
  const viajeRef = doc(collection(db, `usuarios/${userId}/viajes`));
  batch.set(viajeRef, viaje);

  paradas.forEach((parada) => {
    const paradaRef = doc(collection(db, `usuarios/${userId}/viajes/${viajeRef.id}/paradas`));
    batch.set(paradaRef, parada);
  });

  await batch.commit();
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

export const eliminarViaje = ({ db, userId, viajeId }) =>
  deleteDoc(doc(db, `usuarios/${userId}/viajes`, viajeId));

export const subirFotoViaje = async ({ storage, userId, viajeId, foto }) => {
  try {
    const storageRef = ref(storage, `usuarios/${userId}/viajes/${viajeId}/portada.jpg`);
    if (foto instanceof Blob) {
      await uploadBytes(storageRef, foto, { contentType: foto.type || 'image/jpeg' });
    } else if (typeof foto === 'string' && foto.startsWith('data:image')) {
      await uploadString(storageRef, foto, 'data_url');
    } else {
      return null;
    }
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
};
