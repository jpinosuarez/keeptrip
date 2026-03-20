import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@shared/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@app/providers/AuthContext';
import { logger } from '@shared/lib/utils/logger';
import {
  obtenerFotosViaje,
  subirFotosMultiples,
  eliminarFoto,
  actualizarPortada,
  actualizarCaptionFoto
} from '@shared/api/services/viajes/galeriaService';

/**
 * Hook para gestionar la galería de fotos de un viaje
 * 
 * @param {string} viajeId - ID del viaje
 * @param {string|null} ownerId - UID propietario del viaje (para viajes compartidos)
 * @returns {Object} Estado y funciones de la galería
 */
export function useGaleriaViaje(viajeId, ownerId = null) {
  const { usuario } = useAuth();
  const ownerUid = ownerId || usuario?.uid || null;
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga las fotos del viaje desde Firestore (no backoff). 
   * Se usa un snapshot en tiempo real para evitar condiciones de carrera post-upload.
   */
  useEffect(() => {
    if (!ownerUid || !viajeId) {
      setFotos([]);
      setError(null);
      setLoading(false);
      return;
    }

    logger.info('Subscribiendo galería de viaje', { ownerUid, viajeId });
    setLoading(true);
    setError(null);

    const fotosRef = collection(db, `usuarios/${ownerUid}/viajes/${viajeId}/fotos`);
    const q = query(fotosRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fotosData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || null,
        }));

        setFotos(fotosData);
        setLoading(false);

        logger.debug('Galería actualizada por snapshot', {
          ownerUid,
          viajeId,
          totalFotos: fotosData.length,
        });
      },
      (err) => {
        logger.error('Error en subscription de galería', {
          ownerUid,
          viajeId,
          error: err.message,
        });
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      logger.info('Desuscribiendo galería de viaje', { ownerUid, viajeId });
    };
  }, [ownerUid, viajeId]);

  const cargarFotos = useCallback(async () => {
    console.log('[useGaleriaViaje] cargarFotos ownerUid:', ownerUid, 'viajeId:', viajeId);
    if (!ownerUid || !viajeId) {
      setFotos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Cargando fotos de galería (manual)', { viajeId });
      
      const fotosData = await obtenerFotosViaje({
        db,
        userId: ownerUid,
        viajeId
      });

      setFotos(fotosData);
      
      logger.debug('Fotos cargadas (manual)', { 
        viajeId, 
        totalFotos: fotosData.length 
      });
    } catch (err) {
      logger.error('Error cargando fotos', {
        error: err.message,
        viajeId
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [ownerUid, viajeId]);

  /**
   * Sube múltiples fotos a la galería
   */
  const subirFotos = async (files, portadaIndex = 0) => {
    if (!ownerUid || !viajeId || files.length === 0) {
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      logger.info('Subiendo fotos a galería', { 
        viajeId, 
        totalFotos: files.length 
      });

      const fotosIds = await subirFotosMultiples({
        storage,
        db,
        userId: ownerUid,
        viajeId,
        files,
        portadaIndex
      });

      if (fotosIds.length > 0) {
        // Recargar fotos
        await cargarFotos();
        
        logger.info('Fotos subidas exitosamente', { 
          viajeId, 
          totalSubidas: fotosIds.length 
        });
        
        return true;
      }

      return false;
    } catch (err) {
      logger.error('Error subiendo fotos', {
        error: err.message,
        viajeId
      });
      setError(err);
      return false;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Elimina una foto de la galería
   */
  const eliminar = async (fotoId) => {
    if (!ownerUid || !viajeId) return false;

    try {
      logger.info('Eliminando foto de galería', { viajeId, fotoId });

      const success = await eliminarFoto({
        storage,
        db,
        userId: ownerUid,
        viajeId,
        fotoId
      });

      if (success) {
        // Actualizar estado local
        setFotos(prev => prev.filter(f => f.id !== fotoId));
        
        logger.info('Foto eliminada exitosamente', { viajeId, fotoId });
      }

      return success;
    } catch (err) {
      logger.error('Error eliminando foto', {
        error: err.message,
        viajeId,
        fotoId
      });
      setError(err);
      return false;
    }
  };

  /**
   * Cambia la foto de portada
   */
  const cambiarPortada = async (fotoId) => {
    if (!ownerUid || !viajeId) return false;

    try {
      logger.info('Cambiando portada', { viajeId, fotoId });

      const success = await actualizarPortada({
        db,
        userId: ownerUid,
        viajeId,
        fotoId
      });

      if (success) {
        // Actualizar estado local
        setFotos(prev => prev.map(f => ({
          ...f,
          esPortada: f.id === fotoId
        })));
        
        logger.info('Portada actualizada', { viajeId, fotoId });
      }

      return success;
    } catch (err) {
      logger.error('Error cambiando portada', {
        error: err.message,
        viajeId,
        fotoId
      });
      setError(err);
      return false;
    }
  };

  /**
   * Actualiza el caption de una foto
   */
  const actualizarCaption = async (fotoId, caption) => {
    if (!ownerUid || !viajeId) return false;

    try {
      const success = await actualizarCaptionFoto({
        db,
        userId: ownerUid,
        viajeId,
        fotoId,
        caption
      });

      if (success) {
        // Actualizar estado local
        setFotos(prev => prev.map(f => 
          f.id === fotoId ? { ...f, caption } : f
        ));
      }

      return success;
    } catch (err) {
      logger.error('Error actualizando caption', {
        error: err.message,
        viajeId,
        fotoId
      });
      setError(err);
      return false;
    }
  };

  /**
   * Obtiene la foto de portada
   */
  const fotoPortada = fotos.find(f => f.esPortada) || fotos[0] || null;

  /**
   * Carga inicial y limpieza cuando cambia el viajeId
   */
  useEffect(() => {
    if (!viajeId) {
      // Sin viajeId: limpiar estado
      setFotos([]);
      setError(null);
    } else {
      // Con viajeId: cargar fotos de ese viaje
      cargarFotos();
    }
  }, [viajeId, cargarFotos]);

  /**
   * Limpia el estado de la galería (para nuevo viaje o cierre de modal)
   */
  const limpiar = useCallback(() => {
    setFotos([]);
    setError(null);
  }, []);

  return {
    fotos,
    fotoPortada,
    loading,
    uploading,
    error,
    subirFotos,
    eliminar,
    cambiarPortada,
    actualizarCaption,
    recargar: cargarFotos,
    limpiar
  };
}
