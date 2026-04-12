import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { compressImage } from '@shared/lib/utils/imageUtils';
import { logger } from '@shared/lib/utils/logger';

const isImageDataUrl = (value) =>
  typeof value === 'string' && value.trim().startsWith('data:image/') && value.includes(';base64,');

export const suscribirViajesConParadas = ({ db, userId, onData, onError }) => {
  const stopUnsubscribers = new Map();
  const stopsByTrip = new Map();
  let currentTrips = [];

  const viajesRef = collection(db, `usuarios/${userId}/viajes`);
  const q = query(viajesRef);

  const toMillis = (value) => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : 0;
  };

  const emitSnapshot = () => {
    onData({
      viajes: currentTrips,
      paradas: Array.from(stopsByTrip.values()).flat()
    });
  };

  const clearTripStopsListener = (tripId) => {
    const unsubscribeStops = stopUnsubscribers.get(tripId);
    if (unsubscribeStops) {
      unsubscribeStops();
      stopUnsubscribers.delete(tripId);
    }
    stopsByTrip.delete(tripId);
  };

  const subscribeTripStops = (tripId) => {
    if (stopUnsubscribers.has(tripId)) return;

    const paradasRef = collection(db, `usuarios/${userId}/viajes/${tripId}/paradas`);
    const unsubscribeStops = onSnapshot(
      paradasRef,
      { includeMetadataChanges: true },
      (paradasSnap) => {
        const tripStops = paradasSnap.docs.map((parada) => {
          const data = parada.data({ serverTimestamps: 'estimate' });
          return {
            ...data,
            id: parada.id,
            viajeId: tripId,
          };
        });

        stopsByTrip.set(tripId, tripStops);
        emitSnapshot();
      },
      (error) => {
        clearTripStopsListener(tripId);
        onError?.(error);
        emitSnapshot();
      }
    );

    stopUnsubscribers.set(tripId, unsubscribeStops);
  };

  const unsubscribeTrips = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      currentTrips = snapshot.docs
        .map((item) => {
          const data = item.data({ serverTimestamps: 'estimate' });
          return {
            ...data,
            id: item.id,
            createdAt:
              data.createdAt ??
              (item.metadata.hasPendingWrites ? new Date() : null),
          };
        })
        .sort((a, b) => {
          const createdAtDiff = toMillis(b.createdAt) - toMillis(a.createdAt);
          if (createdAtDiff !== 0) return createdAtDiff;
          return toMillis(b.fechaInicio) - toMillis(a.fechaInicio);
        });

      const activeTripIds = new Set(currentTrips.map((viaje) => viaje.id));

      currentTrips.forEach((viaje) => {
        subscribeTripStops(viaje.id);
      });

      for (const tripId of stopUnsubscribers.keys()) {
        if (!activeTripIds.has(tripId)) {
          clearTripStopsListener(tripId);
        }
      }

      emitSnapshot();
    },
    (error) => onError?.(error)
  );

  return () => {
    unsubscribeTrips();
    for (const unsubscribeStops of stopUnsubscribers.values()) {
      unsubscribeStops();
    }
    stopUnsubscribers.clear();
    stopsByTrip.clear();
    currentTrips = [];
  };
};

export const guardarViajeConParadas = async ({ db, userId, viaje, paradas = [] }) => {
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
    logger.error('guardarViajeConParadas commit failed', {
      userId,
      viajeId: viajeRef.id,
      error: err?.message,
      code: err?.code,
    });
    throw err;
  }

  return viajeRef.id;
};

export const actualizarViaje = ({ db, userId, viajeId, data }) =>
  updateDoc(doc(db, `usuarios/${userId}/viajes`, viajeId), data);

export const crearParada = ({ db, userId, viajeId, data }) => {
  const { id, ...cleanData } = data;
  return addDoc(collection(db, `usuarios/${userId}/viajes/${viajeId}/paradas`), cleanData);
};

export const actualizarParada = ({ db, userId, viajeId, paradaId, data }) => {
  const { id, ...cleanData } = data;
  return updateDoc(doc(db, `usuarios/${userId}/viajes/${viajeId}/paradas`, paradaId), cleanData);
};

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
        logger.warn('Image compression failed, falling back to original blob', {
          error: err?.message,
          code: err?.code,
        });
      }

      await uploadBytes(storageRef, blobToUpload, { contentType: blobToUpload.type || 'image/jpeg' });
      return await getDownloadURL(storageRef);
    }

    if (isImageDataUrl(foto)) {
      await uploadString(storageRef, foto.trim(), 'data_url');
      return await getDownloadURL(storageRef);
    }

    return null;
  } catch (error) {
    logger.error('Upload to Firebase Storage failed', {
      userId,
      viajeId,
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
};
