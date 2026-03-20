/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { storage, db } from '@shared/firebase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { subirFotoGaleria } from '@shared/api/services/viajes/galeriaService';
import { logger } from '@shared/lib/utils/logger';

/**
 * Estado de una foto en proceso de subida
 * @typedef {Object} FotoUpload
 * @property {string} id - ID temporal único
 * @property {File} file - Archivo original
 * @property {string} preview - URL de preview local (base64)
 * @property {'pending'|'uploading'|'success'|'error'} status - Estado actual
 * @property {string|null} fotoId - ID de Firestore una vez subida
 * @property {string|null} url - URL de Storage una vez subida
 * @property {string|null} error - Mensaje de error si falló
 * @property {boolean} esPortada - Si es la foto de portada
 */

/**
 * Contexto para gestión global de uploads de fotos
 * Permite que la subida continúe en background aunque se cambie de vista
 */
const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  
  // Map de viajeId -> array de FotoUpload
  const [uploadsByViaje, setUploadsByViaje] = useState({});
  
  // Ref para controlar subidas en progreso
  const uploadingRef = useRef(new Set());

  /**
   * Genera preview base64 de un archivo
   */
  const generarPreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Inicia la subida de múltiples fotos para un viaje
   * @param {string} viajeId - ID del viaje
   * @param {File[]} files - Array de archivos a subir
   * @param {number} portadaIndex - Índice de la foto que será portada
   * @returns {Promise<void>}
   */
  const iniciarSubida = useCallback(async (viajeId, files, portadaIndex = 0) => {
    console.log('-> UPLOAD CONTEXT INVOCADO', { viajeId, filesLength: files?.length, usuarioUid: usuario?.uid });

    if (!viajeId) throw new Error('Abortado: viajeId es undefined o nulo');
    if (!files || files.length === 0) throw new Error('Abortado: array de files vacío');
    if (!usuario) throw new Error('Abortado: objeto usuario no está listo en el Contexto');

    console.log('Archivos a subir:', files.length);

    logger.info('Iniciando subida de fotos', { viajeId, totalFotos: files.length });

    // Generar previews y crear estado inicial
    const fotosConPreview = await Promise.all(
      files.map(async (file, index) => {
        const preview = await generarPreview(file);
        return {
          id: `temp_${Date.now()}_${index}`,
          file,
          preview,
          status: 'pending',
          fotoId: null,
          url: null,
          error: null,
          esPortada: index === portadaIndex,
          orden: index
        };
      })
    );

    // Registrar en estado
    setUploadsByViaje(prev => ({
      ...prev,
      [viajeId]: fotosConPreview
    }));

    // Marcar que este viaje tiene uploads en progreso
    uploadingRef.current.add(viajeId);

    // Iniciar subida secuencial (evita saturar la red)
    await procesarCola(viajeId, fotosConPreview);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, generarPreview]);

  /**
   * Procesa la cola de uploads para un viaje
   */
  const procesarCola = useCallback(async (viajeId, fotos) => {
    let exitosas = 0;
    let fallidas = 0;

    console.log('UploadContext: Archivos a subir:', fotos?.length, 'viajeId:', viajeId);

    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      
      // Actualizar estado a "uploading"
      setUploadsByViaje(prev => ({
        ...prev,
        [viajeId]: (prev[viajeId] || fotos).map(f => 
          f.id === foto.id ? { ...f, status: 'uploading' } : f
        )
      }));

      try {
        // Subir la foto
        let fotoId = null;
        try {
          fotoId = await subirFotoGaleria({
            storage,
            db,
            userId: usuario.uid,
            viajeId,
            file: foto.file,
            metadata: { orden: foto.orden },
            esPortada: foto.esPortada
          });
        } catch (uploadError) {
          logger.error('UploadContext: error individual en subirFotoGaleria', {
            viajeId,
            tempId: foto.id,
            error: uploadError?.message || uploadError
          });
          throw uploadError;
        }

        if (fotoId) {
          exitosas += 1;
          // Éxito
          setUploadsByViaje(prev => ({
            ...prev,
            [viajeId]: (prev[viajeId] || fotos).map(f => 
              f.id === foto.id ? { ...f, status: 'success', fotoId } : f
            )
          }));
        } else {
          fallidas += 1;
          // Fallo
          setUploadsByViaje(prev => ({
            ...prev,
            [viajeId]: (prev[viajeId] || fotos).map(f => 
              f.id === foto.id ? { ...f, status: 'error', error: 'No se pudo subir' } : f
            )
          }));
        }
      } catch (error) {
        fallidas += 1;
        logger.error('Error subiendo foto', { error: error.message, fotoId: foto.id });
        setUploadsByViaje(prev => ({
          ...prev,
          [viajeId]: (prev[viajeId] || fotos).map(f => 
            f.id === foto.id ? { ...f, status: 'error', error: error.message } : f
          )
        }));
      }
    }

    // Finalizar
    uploadingRef.current.delete(viajeId);
    
    // Notificar resultado
    logger.info('Subida completada', { viajeId, exitosas, fallidas });

    if (fallidas === 0 && exitosas > 0) {
      pushToast(`${exitosas} foto${exitosas > 1 ? 's' : ''} subida${exitosas > 1 ? 's' : ''}`, 'success');
    } else if (fallidas > 0) {
      pushToast(`${exitosas} subida${exitosas > 1 ? 's' : ''}, ${fallidas} fallida${fallidas > 1 ? 's' : ''}`, 'error');
    }
  }, [usuario, pushToast]);

  /**
   * Obtiene el estado de uploads para un viaje
   * @param {string} viajeId 
   * @returns {{ fotos: FotoUpload[], isUploading: boolean, progress: { total: number, completed: number } }}
   */
  const getEstadoViaje = useCallback((viajeId) => {
    const fotos = uploadsByViaje[viajeId] || [];
    const completed = fotos.filter(f => f.status === 'success' || f.status === 'error').length;
    
    return {
      fotos,
      isUploading: uploadingRef.current.has(viajeId),
      progress: {
        total: fotos.length,
        completed
      }
    };
  }, [uploadsByViaje]);

  /**
   * Reintenta subir una foto fallida
   * @param {string} viajeId 
   * @param {string} fotoTempId - ID temporal de la foto
   */
  const reintentarFoto = useCallback(async (viajeId, fotoTempId) => {
    const fotos = uploadsByViaje[viajeId] || [];
    const foto = fotos.find(f => f.id === fotoTempId);
    
    if (!foto || foto.status !== 'error') return;

    // Actualizar estado a uploading
    setUploadsByViaje(prev => ({
      ...prev,
      [viajeId]: prev[viajeId].map(f => 
        f.id === fotoTempId ? { ...f, status: 'uploading', error: null } : f
      )
    }));

    try {
      const fotoId = await subirFotoGaleria({
        storage,
        db,
        userId: usuario.uid,
        viajeId,
        file: foto.file,
        metadata: { orden: foto.orden },
        esPortada: foto.esPortada
      });

      if (fotoId) {
        setUploadsByViaje(prev => ({
          ...prev,
          [viajeId]: prev[viajeId].map(f => 
            f.id === fotoTempId ? { ...f, status: 'success', fotoId } : f
          )
        }));
        pushToast('Foto subida correctamente', 'success');
      } else {
        throw new Error('No se pudo subir');
      }
    } catch (error) {
      setUploadsByViaje(prev => ({
        ...prev,
        [viajeId]: prev[viajeId].map(f => 
          f.id === fotoTempId ? { ...f, status: 'error', error: error.message } : f
        )
      }));
      pushToast('Error al reintentar', 'error');
    }
  }, [usuario, uploadsByViaje, pushToast]);

  /**
   * Limpia el estado de uploads para un viaje (cuando ya no se necesita)
   * @param {string} viajeId 
   */
  const limpiarUploads = useCallback((viajeId) => {
    setUploadsByViaje(prev => {
      const nuevo = { ...prev };
      delete nuevo[viajeId];
      return nuevo;
    });
    uploadingRef.current.delete(viajeId);
  }, []);

  /**
   * Verifica si hay uploads pendientes para un viaje
   */
  const tieneUploadsPendientes = useCallback((viajeId) => {
    const fotos = uploadsByViaje[viajeId] || [];
    return fotos.some(f => f.status === 'pending' || f.status === 'uploading');
  }, [uploadsByViaje]);

  const isUploading = useCallback((viajeId) => uploadingRef.current.has(viajeId), []);

  const value = useMemo(() => ({
    iniciarSubida,
    getEstadoViaje,
    isUploading,
    reintentarFoto,
    limpiarUploads,
    tieneUploadsPendientes
  }), [iniciarSubida, getEstadoViaje, isUploading, reintentarFoto, limpiarUploads, tieneUploadsPendientes]);

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload debe usarse dentro de UploadProvider');
  }
  return context;
}
