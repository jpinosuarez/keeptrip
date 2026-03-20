import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { compressImage } from '@shared/lib/utils/imageUtils';
import { logger } from '@shared/lib/utils/logger';

/**
 * Servicio para gestión de galería de fotos de viajes
 * Maneja subcolección: usuarios/{userId}/viajes/{viajeId}/fotos/{fotoId}
 */

/**
 * Sube una foto a Storage y crea documento en subcolección fotos
 * @param {Object} params
 * @param {Object} params.storage - Firebase Storage instance
 * @param {Object} params.db - Firestore instance
 * @param {string} params.userId - ID del usuario
 * @param {string} params.viajeId - ID del viaje
 * @param {File|Blob} params.file - Archivo de imagen
 * @param {Object} params.metadata - Metadata adicional (caption, fechaCaptura, orden)
 * @param {boolean} params.esPortada - Si es la foto de portada
 * @returns {Promise<string|null>} ID de la foto creada o null si falla
 */
export const subirFotoGaleria = async ({ 
  storage, 
  db, 
  userId, 
  viajeId, 
  file: fileObj, 
  metadata = {}, 
  esPortada = false 
}) => {
  try {
    // Si fileObj viene del uploader, puede ser un File puro o un objeto con la propiedad .file
    const actualFile = fileObj instanceof File ? fileObj : fileObj?.file;
    if (!actualFile) {
      console.error('Objeto inválido pasado a subirFotoGaleria', fileObj);
      throw new Error('No es un archivo válido');
    }

    // Comprimir el archivo antes de subir para reducir fallos por tamaño en reglas de Storage
    const compressedResult = await compressImage(actualFile, 1920, 0.8);
    const compressedFile = compressedResult?.blob;
    const fileToUpload = compressedFile instanceof Blob || compressedFile instanceof File
      ? compressedFile
      : actualFile;

    console.log('subirFotoGaleria: Paso 1, intentado subir a Storage...', { viajeId, userId, fileName: actualFile.name, originalSize: actualFile.size, uploadSize: fileToUpload.size });

    const storageRef = ref(storage, `usuarios/${userId}/viajes/${viajeId}/galeria/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`);

    const metadataUpload = { contentType: fileToUpload.type || 'image/jpeg' };

    await uploadBytes(storageRef, fileToUpload, metadataUpload);

    console.log('subirFotoGaleria: Paso 2, storage OK. Obteniendo URL de descarga...');
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('subirFotoGaleria: Paso 3, URL obtenida:', downloadUrl);

    console.log('subirFotoGaleria: Paso 4, intentado escribir en Firestore subcolección fotos...');

    let fotoDoc;

    try {
      const fotosRef = collection(db, 'usuarios', userId, 'viajes', viajeId, 'fotos');
      fotoDoc = await addDoc(fotosRef, {
        url: downloadUrl,
        fileType: fileToUpload.type || actualFile.type,
        createdAt: serverTimestamp(),
        orden: metadata.orden ?? 0,
        esPortada: esPortada || false,
        caption: metadata.caption || null,
        fechaCaptura: metadata.fechaCaptura || null,
        size: fileToUpload.size
      });

      console.log('subirFotoGaleria: Paso 5, ¡ESCRITURA EN FIRESTORE EXITOSA!', fotoDoc.id);
    } catch (writeError) {
      console.error('❌ ERROR FATAL ESCRIBIENDO EN FIRESTORE:', writeError);
      throw writeError;
    }

    if (esPortada) {
      try {
        await actualizarPortadaViaje({ db, userId, viajeId, fotoUrl: downloadUrl });
      } catch (coverError) {
        console.error('subirFotoGaleria: no se pudo actualizar portada tras subir foto', coverError);
      }
    }

    return fotoDoc.id;
  } catch (error) {
    logger.error('Error subiendo foto a galería', {
      error: error?.message || error,
      viajeId,
      fileName: (fileObj instanceof File ? fileObj : fileObj?.file)?.name || null
    });
    return null;
  }
};

/**
 * Sube múltiples fotos a la galería en paralelo
 * @param {Object} params
 * @param {Object} params.storage
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @param {Array<File>} params.files - Array de archivos
 * @param {number} params.portadaIndex - Índice de la foto que será portada (default: 0)
 * @returns {Promise<Array<string>>} Array de IDs de fotos creadas
 */
export const subirFotosMultiples = async ({ 
  storage, 
  db, 
  userId, 
  viajeId, 
  files, 
  portadaIndex = 0 
}) => {
  try {
    logger.info('Subiendo múltiples fotos', { 
      viajeId, 
      totalFotos: files.length,
      portadaIndex 
    });

    const uploadPromises = files.map((file, index) => 
      subirFotoGaleria({
        storage,
        db,
        userId,
        viajeId,
        file,
        metadata: { orden: index },
        esPortada: index === portadaIndex
      })
    );

    const fotosIds = await Promise.all(uploadPromises);
    const exitosas = fotosIds.filter(id => id !== null);

    // Actualizar contador en documento del viaje
    await actualizarContadorFotos({ db, userId, viajeId });

    logger.info('Fotos múltiples subidas', { 
      viajeId, 
      exitosas: exitosas.length,
      fallidas: fotosIds.length - exitosas.length 
    });

    return exitosas;
  } catch (error) {
    logger.error('Error subiendo fotos múltiples', {
      error: error.message,
      viajeId
    });
    return [];
  }
};

/**
 * Obtiene todas las fotos de un viaje ordenadas
 * @param {Object} params
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @returns {Promise<Array>} Array de fotos
 */
export const obtenerFotosViaje = async ({ db, userId, viajeId }) => {
  try {
    const fotosRef = collection(db, `usuarios/${userId}/viajes/${viajeId}/fotos`);
    const q = query(fotosRef, orderBy('orden', 'asc'));
    const snapshot = await getDocs(q);

    const fotos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || null
    }));

    logger.debug('Fotos obtenidas', { viajeId, totalFotos: fotos.length });

    return fotos;
  } catch (error) {
    logger.error('Error obteniendo fotos', {
      error: error.message,
      viajeId
    });
    return [];
  }
};

/**
 * Actualiza la foto de portada de un viaje
 * @param {Object} params
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @param {string} params.fotoId - ID de la nueva foto portada
 * @returns {Promise<boolean>}
 */
export const actualizarPortada = async ({ db, userId, viajeId, fotoId }) => {
  try {
    const batch = writeBatch(db);

    // Obtener todas las fotos
    const fotos = await obtenerFotosViaje({ db, userId, viajeId });
    const fotoSeleccionada = fotos.find(f => f.id === fotoId);

    if (!fotoSeleccionada) {
      logger.warn('Foto no encontrada para portada', { viajeId, fotoId });
      return false;
    }

    // Desmarcar todas las fotos como portada
    fotos.forEach(foto => {
      const fotoRef = doc(db, `usuarios/${userId}/viajes/${viajeId}/fotos/${foto.id}`);
      batch.update(fotoRef, { esPortada: foto.id === fotoId });
    });

    // Actualizar documento del viaje
    const viajeRef = doc(db, `usuarios/${userId}/viajes/${viajeId}`);
    batch.update(viajeRef, { 
      foto: fotoSeleccionada.url,
      fotoPortada: fotoSeleccionada.url 
    });

    await batch.commit();

    logger.info('Portada actualizada', { viajeId, fotoId });
    return true;
  } catch (error) {
    logger.error('Error actualizando portada', {
      error: error.message,
      viajeId,
      fotoId
    });
    return false;
  }
};

/**
 * Elimina una foto de la galería (Storage + Firestore)
 * @param {Object} params
 * @param {Object} params.storage
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @param {string} params.fotoId
 * @returns {Promise<boolean>}
 */
export const eliminarFoto = async ({ storage, db, userId, viajeId, fotoId }) => {
  try {
    // Obtener datos de la foto antes de eliminar
    const fotos = await obtenerFotosViaje({ db, userId, viajeId });
    const foto = fotos.find(f => f.id === fotoId);

    if (!foto) {
      logger.warn('Foto no encontrada para eliminar', { viajeId, fotoId });
      return false;
    }

    // Si es la portada, no permitir eliminación
    if (foto.esPortada && fotos.length > 1) {
      logger.warn('No se puede eliminar la portada sin designar otra', { viajeId, fotoId });
      return false;
    }

    // Eliminar de Storage
    try {
      const storageRef = ref(storage, `usuarios/${userId}/viajes/${viajeId}/galeria/${fotoId}.jpg`);
      await deleteObject(storageRef);
    } catch (storageError) {
      logger.warn('Foto no encontrada en Storage (puede ya estar eliminada)', { 
        fotoId,
        error: storageError.message 
      });
    }

    // Eliminar de Firestore
    await deleteDoc(doc(db, `usuarios/${userId}/viajes/${viajeId}/fotos/${fotoId}`));

    // Actualizar contador
    await actualizarContadorFotos({ db, userId, viajeId });

    logger.info('Foto eliminada', { viajeId, fotoId });
    return true;
  } catch (error) {
    logger.error('Error eliminando foto', {
      error: error.message,
      viajeId,
      fotoId
    });
    return false;
  }
};

/**
 * Actualiza el caption de una foto
 * @param {Object} params
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @param {string} params.fotoId
 * @param {string} params.caption
 * @returns {Promise<boolean>}
 */
export const actualizarCaptionFoto = async ({ db, userId, viajeId, fotoId, caption }) => {
  try {
    const fotoRef = doc(db, `usuarios/${userId}/viajes/${viajeId}/fotos/${fotoId}`);
    await updateDoc(fotoRef, { 
      caption: caption || null,
      updatedAt: Timestamp.now()
    });

    logger.debug('Caption actualizado', { viajeId, fotoId });
    return true;
  } catch (error) {
    logger.error('Error actualizando caption', {
      error: error.message,
      viajeId,
      fotoId
    });
    return false;
  }
};

/**
 * Reordena las fotos de la galería
 * @param {Object} params
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @param {Array<{id: string, orden: number}>} params.ordenamiento - Array con nuevos órdenes
 * @returns {Promise<boolean>}
 */
export const reordenarFotos = async ({ db, userId, viajeId, ordenamiento }) => {
  try {
    const batch = writeBatch(db);

    ordenamiento.forEach(({ id, orden }) => {
      const fotoRef = doc(db, `usuarios/${userId}/viajes/${viajeId}/fotos/${id}`);
      batch.update(fotoRef, { orden });
    });

    await batch.commit();

    logger.info('Fotos reordenadas', { viajeId, totalFotos: ordenamiento.length });
    return true;
  } catch (error) {
    logger.error('Error reordenando fotos', {
      error: error.message,
      viajeId
    });
    return false;
  }
};

// ==================== HELPERS ====================

/**
 * Actualiza el contador de fotos en el documento del viaje
 */
const actualizarContadorFotos = async ({ db, userId, viajeId }) => {
  try {
    const fotos = await obtenerFotosViaje({ db, userId, viajeId });
    const viajeRef = doc(db, `usuarios/${userId}/viajes/${viajeId}`);
    
    await updateDoc(viajeRef, { 
      totalFotos: fotos.length 
    });

    logger.debug('Contador de fotos actualizado', { viajeId, totalFotos: fotos.length });
  } catch (error) {
    logger.warn('Error actualizando contador de fotos', {
      error: error.message,
      viajeId
    });
  }
};

/**
 * Actualiza la URL de portada en el documento del viaje
 */
const actualizarPortadaViaje = async ({ db, userId, viajeId, fotoUrl }) => {
  try {
    const viajeRef = doc(db, `usuarios/${userId}/viajes/${viajeId}`);
    await updateDoc(viajeRef, { 
      foto: fotoUrl,
      fotoPortada: fotoUrl 
    });

    logger.debug('Portada actualizada en documento de viaje', { viajeId });
  } catch (error) {
    logger.warn('Error actualizando portada en viaje', {
      error: error.message,
      viajeId
    });
  }
};

/**
 * Obtiene estadísticas de la galería de un viaje
 * @param {Object} params
 * @param {Object} params.db
 * @param {string} params.userId
 * @param {string} params.viajeId
 * @returns {Promise<Object>} Estadísticas
 */
export const obtenerEstadisticasGaleria = async ({ db, userId, viajeId }) => {
  try {
    const fotos = await obtenerFotosViaje({ db, userId, viajeId });
    
    const stats = {
      totalFotos: fotos.length,
      totalSize: fotos.reduce((sum, f) => sum + (f.size || 0), 0),
      conCaption: fotos.filter(f => f.caption).length,
      portada: fotos.find(f => f.esPortada) || null
    };

    return stats;
  } catch (error) {
    logger.error('Error obteniendo estadísticas de galería', {
      error: error.message,
      viajeId
    });
    return { totalFotos: 0, totalSize: 0, conCaption: 0, portada: null };
  }
};
