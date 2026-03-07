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
  Timestamp
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
  file, 
  metadata = {}, 
  esPortada = false 
}) => {
  try {
    logger.debug('Comprimiendo imagen para galería', { 
      fileName: file.name,
      originalSize: file.size 
    });

    // Comprimir imagen
    const compressed = await compressImage(file, 1920, 0.8);
    
    logger.debug('Imagen comprimida', {
      originalSize: file.size,
      compressedSize: compressed.size,
      reduction: `${Math.round((1 - compressed.size / file.size) * 100)}%`
    });

    // Generar ID único para la foto
    const fotoId = `foto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Subir a Storage
    const storageRef = ref(storage, `usuarios/${userId}/viajes/${viajeId}/galeria/${fotoId}.jpg`);
    await uploadBytes(storageRef, compressed.blob, { 
      contentType: 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    // Obtener URL de descarga
    const url = await getDownloadURL(storageRef);

    // Crear documento en subcolección
    const fotoData = {
      url,
      orden: metadata.orden ?? 0,
      esPortada: esPortada || false,
      caption: metadata.caption || null,
      fechaCaptura: metadata.fechaCaptura || null,
      size: compressed.size,
      createdAt: Timestamp.now()
    };

    const fotoRef = await addDoc(
      collection(db, `usuarios/${userId}/viajes/${viajeId}/fotos`),
      fotoData
    );

    logger.info('Foto subida a galería', { 
      fotoId: fotoRef.id,
      viajeId,
      esPortada,
      size: compressed.size 
    });

    // Si es portada, actualizar documento del viaje
    if (esPortada) {
      await actualizarPortadaViaje({ db, userId, viajeId, fotoUrl: url });
    }

    return fotoRef.id;
  } catch (error) {
    logger.error('Error subiendo foto a galería', {
      error: error.message,
      viajeId,
      fileName: file?.name
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
