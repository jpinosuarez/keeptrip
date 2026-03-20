import { useState, useEffect, useMemo } from 'react';
import { db, storage } from '@shared/firebase';
import { doc as fbDoc, query as fbQuery, where as fbWhere, onSnapshot as fbOnSnapshot, collection as fbCollection } from 'firebase/firestore';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { obtenerClimaHistoricoSeguro } from '@shared/api/services/external/weatherService';
import {
  suscribirViajesConParadas,
  guardarViajeConParadas,
  actualizarViaje,
  crearParada,
  actualizarParada,
  eliminarViaje,
  subirFotoViaje
} from '../../api/viajesRepository';
import {
  FOTO_DEFAULT_URL,
  construirBitacoraData,
  obtenerPaisesVisitados,
  generarTituloInteligente,
  construirBanderasViaje,
  construirCiudadesViaje,
  construirParadaPayload,
  construirViajePayload,
  getTodayIsoDate
} from '@shared/lib/utils/viajeUtils';
import { validarViaje, validarCoordenadas } from '../../../../schemas/viajeSchema';
import { logger } from '@shared/lib/utils/logger';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const obtenerCoordenadasViaje = ({ datosViaje = {}, viajeActual = null, paradas = [] }) => {
  const primeraParadaConCoords = paradas.find((parada) => Array.isArray(parada?.coordenadas))?.coordenadas;
  return (
    datosViaje.coordenadas ||
    datosViaje.latlng ||
    datosViaje.ubicacion?.coordenadas ||
    viajeActual?.coordenadas ||
    viajeActual?.latlng ||
    viajeActual?.ubicacion?.coordenadas ||
    primeraParadaConCoords
  );
};

/**
 * Validación de datos de viaje usando Zod schemas
 * Mantiene compatibilidad con la interfaz anterior
 */
const validarDatosViaje = ({ datosViaje = {}, viajeActual = null, paradas = [], tituloGenerado = '' }) => {
  // Construir objeto completo para validación
  const datosCompletos = {
    code: datosViaje.code ?? datosViaje.paisCodigo ?? viajeActual?.code ?? viajeActual?.paisCodigo,
    nombreEspanol: datosViaje.nombreEspanol ?? viajeActual?.nombreEspanol,
    titulo: datosViaje.titulo || tituloGenerado || viajeActual?.titulo,
    fechaInicio: datosViaje.fechaInicio ?? viajeActual?.fechaInicio,
    fechaFin: datosViaje.fechaFin ?? viajeActual?.fechaFin
  };

  // Validar con Zod (validación minimal - solo campos críticos)
  const resultado = validarViaje(datosCompletos, false);
  
  if (!resultado.esValido) {
    logger.warn('Validación de viaje falló', {
      mensaje: resultado.mensaje,
      errores: resultado.errores,
      datosViaje: { ...datosCompletos, titulo: datosCompletos.titulo?.substring(0, 50) }
    });
    return resultado;
  }

  // Validación adicional de coordenadas (no está en el schema minimal)
  const coordenadas = obtenerCoordenadasViaje({ datosViaje, viajeActual, paradas });
  const coordsValidas = validarCoordenadas(coordenadas);
  
  if (!coordsValidas.esValido) {
    logger.warn('Coordenadas inválidas', { coordenadas });
    return { esValido: false, mensaje: 'Debes seleccionar un destino válido' };
  }

  return { esValido: true };
};

export const useViajes = () => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const toast = {
    success: (message) => pushToast(message, 'success'),
    error: (message) => pushToast(message, 'error'),
    warning: (message) => pushToast(message, 'warning')
  };

  const [bitacora, setBitacora] = useState([]);
  const [bitacoraData, setBitacoraData] = useState({});
  const [todasLasParadas, setTodasLasParadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!usuario) {
      logger.debug('Usuario no autenticado, limpiando estado de viajes');
      setBitacora([]);
      setBitacoraData({});
      setTodasLasParadas([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    // Configurar userId en el logger para contexto global
    logger.setUserId(usuario.uid);
    logger.info('Suscribiendo a viajes del usuario', { userId: usuario.uid });

    setLoading(true);
    setError(null);

    const unsubscribe = suscribirViajesConParadas({
      db,
      userId: usuario.uid,
      onData: ({ viajes, paradas }) => {
        logger.debug('Datos de viajes actualizados', { 
          totalViajes: viajes.length, 
          totalParadas: paradas.length 
        });
        // anexar ownerId para mantener consistencia entre viajes personales y compartidos
        const viajesConOwner = viajes.map((v) => ({ ...v, ownerId: usuario.uid }));
        const paradasConOwner = paradas.map((p) => ({ ...p, ownerId: usuario.uid }));
        // Actualización funcional para NO perder los viajes compartidos que
        // upsertSharedViaje ya haya insertado (race condition: el listener
        // personal puede dispararse después que el listener compartido).
        setBitacora((prev) => {
          const compartidos = prev.filter((item) => item.ownerId !== usuario.uid);
          const next = [...viajesConOwner, ...compartidos];
          setBitacoraData(construirBitacoraData(next));
          return next;
        });
        setTodasLasParadas((prev) => {
          const compartidasPrev = prev.filter((item) => item.ownerId !== usuario.uid);
          return [...paradasConOwner, ...compartidasPrev];
        });
        setLoading(false);
      },
      onError: (snapshotError) => {
        logger.error('Error en suscripción de viajes', {
          error: snapshotError.message,
          stack: snapshotError.stack,
          userId: usuario.uid
        });
        setError(snapshotError);
        setLoading(false);
      }
    });

    const sharedTripListeners = new Map();

    const upsertSharedViaje = ({ ownerId, viaje }) => {
      const key = `${ownerId}/${viaje.id}`;
      setBitacora((prev) => {
        const personales = prev.filter((item) => item.ownerId === usuario.uid);
        const compartidos = prev.filter((item) => item.ownerId !== usuario.uid && `${item.ownerId}/${item.id}` !== key);
        const next = [...personales, ...compartidos, { ...viaje, ownerId }];
        setBitacoraData(construirBitacoraData(next));
        return next;
      });
    };

    const removeSharedViaje = ({ ownerId, viajeId }) => {
      const key = `${ownerId}/${viajeId}`;

      setBitacora((prev) => {
        const next = prev.filter((item) => `${item.ownerId}/${item.id}` !== key);
        setBitacoraData(construirBitacoraData(next));
        return next;
      });

      setTodasLasParadas((prev) => prev.filter((parada) => !(parada.ownerId === ownerId && parada.viajeId === viajeId)));
    };

    const upsertSharedParadas = ({ ownerId, viajeId, paradas }) => {
      setTodasLasParadas((prev) => {
        const personales = prev.filter((item) => item.ownerId === usuario.uid);
        const otherShared = prev.filter((item) => item.ownerId !== usuario.uid && !(item.ownerId === ownerId && item.viajeId === viajeId));
        return [...personales, ...otherShared, ...paradas];
      });
    };

    const acceptedInvitationsQ = fbQuery(
      fbCollection(db, 'invitations'),
      fbWhere('inviteeUid', '==', usuario.uid)
    );

    const unsubShared = fbOnSnapshot(acceptedInvitationsQ, (snap) => {
      const desiredKeys = new Set();

      snap.docs.forEach((docSnap) => {
        const invitation = docSnap.data() || {};
        if (invitation.status !== 'accepted') return;
        const ownerId = invitation.inviterId;
        const viajeId = invitation.viajeId;
        if (!ownerId || !viajeId || ownerId === usuario.uid) return;

        const key = `${ownerId}/${viajeId}`;
        desiredKeys.add(key);
        if (sharedTripListeners.has(key)) return;

        const viajeRef = fbDoc(db, `usuarios/${ownerId}/viajes/${viajeId}`);
        const paradasRef = fbCollection(db, `usuarios/${ownerId}/viajes/${viajeId}/paradas`);

        const unsubViaje = fbOnSnapshot(viajeRef, (viajeSnap) => {
          if (!viajeSnap.exists()) {
            removeSharedViaje({ ownerId, viajeId });
            return;
          }
          upsertSharedViaje({ ownerId, viaje: { id: viajeSnap.id, ...viajeSnap.data() } });
        }, (sharedViajeError) => {
          logger.error('Error en viaje compartido', {
            error: sharedViajeError.message,
            ownerId,
            viajeId,
            userId: usuario.uid
          });
          removeSharedViaje({ ownerId, viajeId });
        });

        const unsubParadas = fbOnSnapshot(paradasRef, (paradasSnap) => {
          const paradasCompartidas = paradasSnap.docs.map((paradaSnap) => ({
            id: paradaSnap.id,
            viajeId,
            ownerId,
            ...paradaSnap.data()
          }));
          upsertSharedParadas({ ownerId, viajeId, paradas: paradasCompartidas });
        }, (sharedParadasError) => {
          logger.error('Error en paradas de viaje compartido', {
            error: sharedParadasError.message,
            ownerId,
            viajeId,
            userId: usuario.uid
          });
          upsertSharedParadas({ ownerId, viajeId, paradas: [] });
        });

        sharedTripListeners.set(key, () => {
          unsubViaje();
          unsubParadas();
          removeSharedViaje({ ownerId, viajeId });
        });
      });

      for (const [key, unsubscribeShared] of sharedTripListeners.entries()) {
        if (!desiredKeys.has(key)) {
          unsubscribeShared();
          sharedTripListeners.delete(key);
        }
      }
    }, (sharedInvitationsError) => {
      logger.error('Error en suscripción de invitaciones aceptadas', {
        error: sharedInvitationsError.message,
        userId: usuario.uid
      });
    });

    return () => {
      mounted = false;
      logger.debug('Desuscribiendo de viajes del usuario');
      unsubscribe();
      unsubShared();
      for (const unsubscribeShared of sharedTripListeners.values()) {
        unsubscribeShared();
      }
      sharedTripListeners.clear();
    };
  }, [usuario]);

  const paisesVisitados = useMemo(
    () => obtenerPaisesVisitados(bitacora, todasLasParadas),
    [bitacora, todasLasParadas]
  );

  const guardarNuevoViaje = async (datosViaje, paradas = []) => {
    console.log('[useViajes] guardarNuevoViaje params:', { datosViaje, paradas, usuario: usuario?.uid });
    if (!usuario) return null;

    const tituloDefault = isNonEmptyString(datosViaje?.nombreEspanol)
      ? `Viaje a ${datosViaje.nombreEspanol}`
      : '';
    const tituloPersonalizado = isNonEmptyString(datosViaje?.titulo) && datosViaje.titulo !== tituloDefault
      ? datosViaje.titulo
      : '';
    const datosViajeNormalizados = {
      ...datosViaje,
      titulo: tituloPersonalizado
    };

    const titulo = generarTituloInteligente(datosViajeNormalizados.nombreEspanol, paradas);
    const validacion = validarDatosViaje({ datosViaje: datosViajeNormalizados, paradas, tituloGenerado: titulo });
    if (!validacion.esValido) {
      console.warn('[useViajes] validacion fallida', { validacion, datosViajeNormalizados, paradas });
      toast.warning(validacion.mensaje);
      return null;
    }

    let fotoFinal = datosViajeNormalizados.foto;
    let creditoFinal = datosViajeNormalizados.fotoCredito || null;
    const fotoFileOptimizada = datosViajeNormalizados.fotoFile || null;
    const esFotoBase64 = fotoFinal && typeof fotoFinal === 'string' && fotoFinal.startsWith('data:image');
    const esFotoParaStorage = !!fotoFileOptimizada || !!esFotoBase64;

    const banderas = construirBanderasViaje(datosViajeNormalizados.code, paradas);
    const ciudades = construirCiudadesViaje(paradas);
    const ciudadesLista = [...new Set(paradas.map((parada) => parada.nombre).filter(isNonEmptyString))];

    const paradasProcesadas = await Promise.all(
      paradas.map(async (parada) => {
        const fechaUso = parada.fecha || datosViajeNormalizados.fechaInicio || getTodayIsoDate();
        const climaInfo = await obtenerClimaHistoricoSeguro(
          parada.coordenadas?.[1],
          parada.coordenadas?.[0],
          fechaUso
        );
        return construirParadaPayload(parada, fechaUso, climaInfo);
      })
    );

    const payloadViaje = construirViajePayload({
      datosViaje: datosViajeNormalizados,
      titulo,
      banderas,
      ciudades,
      foto: esFotoParaStorage ? null : fotoFinal || FOTO_DEFAULT_URL,
      fotoCredito: creditoFinal,
      ownerId: usuario.uid
    });

    // OwnerId obligatorio para que Firestore permita creación en la nueva regla.
    if (!payloadViaje.ownerId) {
      payloadViaje.ownerId = usuario.uid;
    }

    try {
      logger.info('Guardando nuevo viaje', { 
        userId: usuario.uid,
        paisCodigo: datosViajeNormalizados.code,
        totalParadas: paradasProcesadas.length 
      });

      const viajeId = await guardarViajeConParadas({
        db,
        userId: usuario.uid,
        viaje: payloadViaje,
        paradas: paradasProcesadas
      });
      console.log('[useViajes] viajeId devuelto desde guardarViajeConParadas:', viajeId);

      if (!viajeId) {
        throw new Error('No se obtuvo viajeId al crear viaje');
      }

      if (esFotoParaStorage) {
        try {
          logger.debug('Subiendo foto a Storage', { viajeId });
          const url = await subirFotoViaje({
            storage,
            userId: usuario.uid,
            viajeId,
            foto: fotoFileOptimizada || datosViaje.foto
          });
          if (url) {
            await actualizarViaje({ db, userId: usuario.uid, viajeId, data: { foto: url } });
            logger.debug('Foto subida exitosamente', { viajeId, fotoUrl: url.substring(0, 50) });
          }
        } catch (photoError) {
          logger.error('Error subiendo foto de portada tras guardar viaje', {
            viajeId,
            code: photoError?.code,
            error: photoError.message,
          });
          toast.warning('Viaje guardado, pero no se pudo subir la foto de portada');
        }
      }

      logger.info('Viaje guardado exitosamente', { viajeId });
      toast.success('Viaje guardado');
      return viajeId;
    } catch (saveError) {
      console.error('[useViajes] saveError completo:', saveError);
      logger.error('Error guardando viaje', { 
        error: saveError?.message || saveError,
        stack: saveError?.stack || null,
        userId: usuario.uid,
        paisCodigo: datosViajeNormalizados.code
      });
      setError(saveError);
      toast.error('No se pudo guardar el viaje');
      return null;
    }
  };

  const actualizarDetallesViaje = async (id, data) => {
    if (!usuario) return false;
    const viajeActual = bitacoraData[id] || bitacora.find((viaje) => viaje.id === id) || null;
    const paradasDelViaje = todasLasParadas.filter((parada) => parada.viajeId === id);
    const validacion = validarDatosViaje({
      datosViaje: data,
      viajeActual,
      paradas: paradasDelViaje
    });
    if (!validacion.esValido) {
      toast.warning(validacion.mensaje);
      return false;
    }

    try {
      logger.info('Actualizando viaje', { viajeId: id, userId: usuario.uid });
      
      const dataToSave = { ...data };
      if (dataToSave.fotoFile instanceof Blob) {
        logger.debug('Subiendo nueva foto (Blob)', { viajeId: id });
        const url = await subirFotoViaje({
          storage,
          userId: usuario.uid,
          viajeId: id,
          foto: dataToSave.fotoFile
        });
        if (!url) throw new Error('No se pudo subir la imagen optimizada');
        dataToSave.foto = url;
      } else if (
        dataToSave.foto &&
        typeof dataToSave.foto === 'string' &&
        dataToSave.foto.startsWith('data:image')
      ) {
        logger.debug('Subiendo nueva foto (base64)', { viajeId: id });
        const url = await subirFotoViaje({
          storage,
          userId: usuario.uid,
          viajeId: id,
          foto: dataToSave.foto
        });
        if (!url) throw new Error('No se pudo subir la imagen en base64');
        dataToSave.foto = url;
      }

      delete dataToSave.fotoFile;

      // Limpiar campos que no deben persistir en Firestore
      delete dataToSave.id;       // document ID, no es un campo del documento
      delete dataToSave.ownerId;  // campo computado al cargar, no se almacena

      // Firestore rechaza valores undefined en updateDoc
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      await actualizarViaje({ db, userId: usuario.uid, viajeId: id, data: dataToSave });
      logger.info('Viaje actualizado exitosamente', { viajeId: id });
      toast.success('Viaje actualizado');
      return true;
    } catch (updateError) {
      logger.error('Error actualizando viaje', {
        error: updateError.message,
        stack: updateError.stack,
        viajeId: id,
        userId: usuario.uid
      });
      setError(updateError);
      toast.error('No se pudo actualizar el viaje');
      return false;
    }
  };

  const agregarParada = async (lugarInfo, viajeId) => {
    if (!usuario || !viajeId) return false;

    try {
      const fechaUso = lugarInfo.fecha || getTodayIsoDate();
      
      logger.debug('Agregando parada a viaje', { 
        viajeId, 
        paradaNombre: lugarInfo.nombre,
        coordenadas: lugarInfo.coordenadas 
      });
      
      const climaInfo = await obtenerClimaHistoricoSeguro(
        lugarInfo.coordenadas?.[1],
        lugarInfo.coordenadas?.[0],
        fechaUso
      );

      await crearParada({
        db,
        userId: usuario.uid,
        viajeId,
        data: {
          ...lugarInfo,
          clima: climaInfo,
          tipo: 'place'
        }
      });
      
      logger.info('Parada agregada exitosamente', { viajeId, paradaNombre: lugarInfo.nombre });
      return true;
    } catch (stopError) {
      logger.error('Error agregando parada', {
        error: stopError.message,
        viajeId,
        paradaNombre: lugarInfo.nombre
      });
      setError(stopError);
      return false;
    }
  };

  const eliminar = async (id) => {
    if (!usuario) return false;
    
    try {
      logger.info('Eliminando viaje', { viajeId: id, userId: usuario.uid });
      
      await eliminarViaje({ db, userId: usuario.uid, viajeId: id });

      // Actualizar estado local inmediatamente para reflejar la eliminación en la UI
      // (evita que el viaje permanezca visible si la suscripción tarda en actualizarse)
      setBitacora((prev) => prev.filter((v) => v.id !== id));
      setBitacoraData((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTodasLasParadas((prev) => prev.filter((p) => p.viajeId !== id));
      
      logger.info('Viaje eliminado exitosamente', { viajeId: id });
      toast.success('Eliminado correctamente');
      return true;
    } catch (deleteError) {
      logger.error('Error eliminando viaje', {
        error: deleteError.message,
        stack: deleteError.stack,
        viajeId: id,
        userId: usuario.uid
      });
      setError(deleteError);
      toast.error('No se pudo eliminar el viaje');
      return false;
    }
  };

  return {
    paisesVisitados,
    bitacora,
    bitacoraData,
    todasLasParadas,
    guardarNuevoViaje,
    agregarParada,
    actualizarParada: async (paradaData, viajeId) => {
      if (!usuario || !viajeId || !paradaData?.id) return false;
      try {
        const { id: paradaId, viajeId: _, ownerId: __, ...cleanData } = paradaData;
        // Limpiar undefined
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key] === undefined) delete cleanData[key];
        });
        await actualizarParada({ db, userId: usuario.uid, viajeId, paradaId, data: cleanData });
        return true;
      } catch (err) {
        logger.error('Error actualizando parada', { error: err.message, viajeId, paradaId: paradaData.id });
        return false;
      }
    },
    actualizarDetallesViaje,
    eliminarViaje: eliminar,
    loading,
    error
  };
};
