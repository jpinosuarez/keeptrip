import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db, storage } from '@shared/firebase';
import { doc as fbDoc, query as fbQuery, where as fbWhere, onSnapshot as fbOnSnapshot, collection as fbCollection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { useTranslation } from 'react-i18next';
import { obtenerClimaHistoricoSeguro } from '@shared/api/services/external/weatherService';
import {
  suscribirViajesConParadas,
  guardarViajeConParadas,
  actualizarViaje,
  crearParada,
  actualizarParada,
  eliminarParada as eliminarParadaRepo,
  eliminarViaje,
  subirFotoViaje,
  applyStopsBatchMutations
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
import { validarViaje, validarCoordenadas } from '@entities/viajes/model';
import { logger } from '@shared/lib/utils/logger';

const isImageDataUrl = (value) =>
  typeof value === 'string' && value.trim().startsWith('data:image/') && value.includes(';base64,');

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
  const { t, i18n } = useTranslation();
  const toast = {
    success: (message) => pushToast(message, 'success'),
    error: (message) => pushToast(message, 'error'),
    warning: (message) => pushToast(message, 'warning')
  };
  const errorToastCooldownRef = useRef({});
  const pendingTripIdsRef = useRef(new Set());

  const notifyErrorThrottled = useCallback((key, message, cooldownMs = 10000) => {
    const now = Date.now();
    const lastShown = errorToastCooldownRef.current[key] || 0;
    if (now - lastShown < cooldownMs) return;
    pushToast(message, 'error');
    errorToastCooldownRef.current[key] = now;
  }, [pushToast]);

  const [bitacora, setBitacora] = useState([]);
  const [bitacoraData, setBitacoraData] = useState({});
  const [todasLasParadas, setTodasLasParadas] = useState([]);
  const allStopsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    allStopsRef.current = Array.isArray(todasLasParadas) ? todasLasParadas : [];
  }, [todasLasParadas]);

  const bitacoraDataHydrated = useMemo(
    () => construirBitacoraData(bitacora, todasLasParadas),
    [bitacora, todasLasParadas]
  );

  useEffect(() => {
    setBitacoraData(bitacoraDataHydrated);
  }, [bitacoraDataHydrated]);

  useEffect(() => {
    const userUid = usuario?.uid;
    if (!userUid) {
      logger.debug('Usuario no autenticado, limpiando estado de viajes');
      pendingTripIdsRef.current.clear();
      setBitacora([]);
      setBitacoraData({});
      setTodasLasParadas([]);
      setLoading(false);
      setError(null);
      setFetchError(null);
      return;
    }

    // Configurar userId en el logger para contexto global
    logger.setUserId(userUid);
    logger.info('Suscribiendo a viajes del usuario', { userId: userUid });

    setLoading(true);
    setError(null);
    setFetchError(null);

    const unsubscribe = suscribirViajesConParadas({
      db,
      userId: userUid,
      onData: ({ viajes, paradas }) => {
        logger.debug('Datos de viajes actualizados', { 
          totalViajes: viajes.length, 
          totalParadas: paradas.length 
        });
        // anexar ownerId para mantener consistencia entre viajes personales y compartidos
        const viajesConOwner = viajes.map((v) => ({ ...v, ownerId: userUid }));
        const confirmedTripIds = new Set(viajesConOwner.map((viaje) => viaje.id));
        for (const tripId of confirmedTripIds) {
          pendingTripIdsRef.current.delete(tripId);
        }
        const paradasConOwner = paradas.map((p) => ({ ...p, ownerId: userUid }));
        // Actualización funcional para NO perder los viajes compartidos que
        // upsertSharedViaje ya haya insertado (race condition: el listener
        // personal puede dispararse después que el listener compartido).
        setBitacora((prev) => {
          const compartidos = prev.filter((item) => item.ownerId !== userUid);
          const pendingPersonal = prev.filter(
            (item) =>
              item.ownerId === userUid &&
              pendingTripIdsRef.current.has(item.id) &&
              !viajesConOwner.some((viaje) => viaje.id === item.id)
          );
          const next = [...viajesConOwner, ...pendingPersonal, ...compartidos];
          const sharedStops = allStopsRef.current.filter((item) => item.ownerId !== userUid);
          setBitacoraData(construirBitacoraData(next, [...paradasConOwner, ...sharedStops]));
          return next;
        });
        setTodasLasParadas((prev) => {
          const compartidasPrev = prev.filter((item) => item.ownerId !== userUid);
          return [...paradasConOwner, ...compartidasPrev];
        });
        setFetchError(null);
        setLoading(false);
      },
      onError: (snapshotError) => {
        logger.error('Error en suscripción de viajes', {
          error: snapshotError.message,
          stack: snapshotError.stack,
          userId: userUid
        });
        notifyErrorThrottled(
          'viajes-subscription',
          'No pudimos sincronizar tu bitacora. Reintentaremos automaticamente.'
        );
        setFetchError(snapshotError);
        setError(snapshotError);
        setLoading(false);
      }
    });

    const sharedTripListeners = new Map();

    const upsertSharedViaje = ({ ownerId, viaje }) => {
      const key = `${ownerId}/${viaje.id}`;
      setBitacora((prev) => {
        const personales = prev.filter((item) => item.ownerId === userUid);
        const compartidos = prev.filter((item) => item.ownerId !== userUid && `${item.ownerId}/${item.id}` !== key);
        const next = [...personales, ...compartidos, { ...viaje, ownerId }];
        setBitacoraData(construirBitacoraData(next, allStopsRef.current));
        return next;
      });
    };

    const removeSharedViaje = ({ ownerId, viajeId }) => {
      const key = `${ownerId}/${viajeId}`;

      setBitacora((prev) => {
        const next = prev.filter((item) => `${item.ownerId}/${item.id}` !== key);
        const nextStops = allStopsRef.current.filter(
          (parada) => !(parada.ownerId === ownerId && parada.viajeId === viajeId)
        );
        setBitacoraData(construirBitacoraData(next, nextStops));
        return next;
      });

      setTodasLasParadas((prev) => prev.filter((parada) => !(parada.ownerId === ownerId && parada.viajeId === viajeId)));
    };

    const upsertSharedParadas = ({ ownerId, viajeId, paradas }) => {
      setTodasLasParadas((prev) => {
        const personales = prev.filter((item) => item.ownerId === userUid);
        const otherShared = prev.filter((item) => item.ownerId !== userUid && !(item.ownerId === ownerId && item.viajeId === viajeId));
        return [...personales, ...otherShared, ...paradas];
      });
    };

    const acceptedInvitationsQ = fbQuery(
      fbCollection(db, 'invitations'),
      fbWhere('inviteeUid', '==', userUid),
      fbWhere('status', '==', 'accepted')
    );

    const unsubShared = fbOnSnapshot(acceptedInvitationsQ, (snap) => {
      console.log(`[E2E DEBUG] acceptedInvitationsQ snapshot fired, empty: ${snap.empty}, size: ${snap.size}`);
      const desiredKeys = new Set();

      snap.docs.forEach((docSnap) => {
        const invitation = docSnap.data() || {};
        console.log('[E2E DEBUG] Found invitation doc:', { id: docSnap.id, status: invitation.status, inviteeUid: invitation.inviteeUid });
        
        const ownerId = invitation.inviterId;
        const viajeId = invitation.viajeId;
        if (!ownerId || !viajeId || ownerId === userUid) {
           console.warn('[E2E DEBUG] Accepted invitation skipped due to missing ownerId/viajeId or owner is current user', { invitation });
           return;
        }

        console.log('[E2E DEBUG] Accepted invitation processing for shared trip', { ownerId, viajeId });

        const key = `${ownerId}/${viajeId}`;
        desiredKeys.add(key);
        if (sharedTripListeners.has(key)) return;

        const viajeRef = fbDoc(db, `usuarios/${ownerId}/viajes/${viajeId}`);
        const paradasRef = fbCollection(db, `usuarios/${ownerId}/viajes/${viajeId}/paradas`);

        const unsubViaje = fbOnSnapshot(viajeRef, (viajeSnap) => {
          if (!viajeSnap.exists()) {
            console.warn('[E2E DEBUG] Shared viajeSnap does NOT exist!', { ownerId, viajeId });
            removeSharedViaje({ ownerId, viajeId });
            return;
          }
          console.log('[E2E DEBUG] Shared viajeSnap loaded successfully!', { ownerId, viajeId, data: viajeSnap.data() });
          upsertSharedViaje({ ownerId, viaje: { ...viajeSnap.data(), id: viajeSnap.id } });
        }, (sharedViajeError) => {
          logger.error('Error en viaje compartido', {
            error: sharedViajeError.message,
            ownerId,
            viajeId,
            userId: userUid
          });
          console.error('[E2E DEBUG] Error loading shared viajeSnap', sharedViajeError.message);
          notifyErrorThrottled(
            'shared-trip-subscription',
            'Un viaje compartido no pudo actualizarse. Continuamos con el resto de tu bitacora.'
          );
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
            userId: userUid
          });
          notifyErrorThrottled(
            'shared-stops-subscription',
            'No pudimos cargar algunas paradas compartidas. Puedes seguir explorando sin interrupciones.'
          );
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
        userId: userUid
      });
      notifyErrorThrottled(
        'shared-invitations-subscription',
        'No pudimos actualizar invitaciones en este momento. Intenta de nuevo en un momento.'
      );
    });

    return () => {
      logger.debug('Desuscribiendo de viajes del usuario');
      unsubscribe();
      unsubShared();
      for (const unsubscribeShared of sharedTripListeners.values()) {
        unsubscribeShared();
      }
      sharedTripListeners.clear();
    };
  }, [usuario?.uid, notifyErrorThrottled]);

  const paisesVisitados = useMemo(
    () => obtenerPaisesVisitados(bitacora, todasLasParadas),
    [bitacora, todasLasParadas]
  );

  const guardarNuevoViaje = async (datosViaje, paradas = []) => {
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

    const titulo = generarTituloInteligente(paradas, t, i18n.language || 'es');
    const validacion = validarDatosViaje({ datosViaje: datosViajeNormalizados, paradas, tituloGenerado: titulo });
    if (!validacion.esValido) {
      logger.warn('Trip validation failed before save', {
        validacion,
        userId: usuario.uid,
      });
      toast.warning(validacion.mensaje);
      return null;
    }

    let fotoFinal = datosViajeNormalizados.foto;
    let creditoFinal = datosViajeNormalizados.fotoCredito || null;
    const fotoFileOptimizada = datosViajeNormalizados.fotoFile || null;
    const esFotoBase64 = isImageDataUrl(fotoFinal);
    const esFotoParaStorage = !!fotoFileOptimizada || !!esFotoBase64;

    const banderas = construirBanderasViaje(datosViajeNormalizados.code, paradas);
    const ciudades = construirCiudadesViaje(paradas);
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

    payloadViaje.createdAt = serverTimestamp();

    // OwnerId obligatorio para que Firestore permita creación en la nueva regla.
    if (!payloadViaje.ownerId) {
      payloadViaje.ownerId = usuario.uid;
    }

    const optimisticTripId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticTrip = {
      ...payloadViaje,
      id: optimisticTripId,
      ownerId: usuario.uid,
      createdAt: new Date().toISOString(),
      paradas: paradasProcesadas,
      isPending: true
    };
    const optimisticStops = paradasProcesadas.map((parada, index) => ({
      ...parada,
      id: parada.id || `optimistic-stop-${optimisticTripId}-${index}`,
      viajeId: optimisticTripId,
      ownerId: usuario.uid,
    }));
    pendingTripIdsRef.current.add(optimisticTripId);
    setBitacora((prev) => {
      const next = [optimisticTrip, ...prev.filter((item) => item.id !== optimisticTripId)];
      setBitacoraData(construirBitacoraData(next, [...allStopsRef.current, ...optimisticStops]));
      return next;
    });

    try {
      logger.info('Guardando nuevo viaje', { 
        userId: usuario.uid,
        paisCodigo: datosViajeNormalizados.code,
        totalParadas: paradasProcesadas.length 
      });
      const viajeParaDb = {
        ...payloadViaje,
        ownerId: usuario.uid,
        createdAt: new Date().toISOString(),
      };

      const viajeId = await guardarViajeConParadas({
        db,
        userId: usuario.uid,
        viaje: viajeParaDb,
        paradas: paradasProcesadas
      });

      if (!viajeId) {
        throw new Error('No se obtuvo viajeId al crear viaje');
      }

      pendingTripIdsRef.current.add(viajeId);
      pendingTripIdsRef.current.delete(optimisticTripId);
      const persistedTrip = {
        ...payloadViaje,
        id: viajeId,
        ownerId: usuario.uid,
        createdAt: new Date().toISOString(),
        paradas: paradasProcesadas,
        isPending: true,
      };
      const persistedStops = paradasProcesadas.map((parada, index) => ({
        ...parada,
        id: parada.id || `optimistic-stop-${viajeId}-${index}`,
        viajeId,
        ownerId: usuario.uid,
      }));
      setBitacora((prev) => {
        const withoutPending = prev.filter((item) => item.id !== optimisticTripId);
        const hasSyncedTrip = withoutPending.some((item) => item.id === viajeId);
        if (hasSyncedTrip) {
          pendingTripIdsRef.current.delete(viajeId);
        }
        const next = hasSyncedTrip
          ? withoutPending.map((item) => (item.id === viajeId ? { ...item, isPending: false } : item))
          : [persistedTrip, ...withoutPending];
        setBitacoraData(construirBitacoraData(next, [...allStopsRef.current, ...persistedStops]));
        return next;
      });

      if (esFotoParaStorage) {
        try {
          logger.debug('Subiendo foto a Storage', { viajeId });
          const url = await subirFotoViaje({
            storage,
            userId: usuario.uid,
            viajeId,
            foto: fotoFileOptimizada || fotoFinal
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
      toast.success('Viaje guardado correctamente');
      return viajeId;
    } catch (saveError) {
      pendingTripIdsRef.current.delete(optimisticTripId);
      setBitacora((prev) => {
        const next = prev.filter((item) => item.id !== optimisticTripId);
        setBitacoraData(construirBitacoraData(next, allStopsRef.current));
        return next;
      });
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
        isImageDataUrl(dataToSave.foto)
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

      // Optimistically update local state to reflect the change immediately in the UI.
      const tripFromState = viajeActual || bitacoraData[id] || bitacora.find((viaje) => viaje.id === id);
      const updatedViaje = {
        ...tripFromState,
        ...dataToSave,
        id,
        ownerId: usuario.uid,
        banderas:
          dataToSave.banderas ||
          tripFromState?.banderas ||
          construirBanderasViaje(dataToSave.code || tripFromState?.code, paradasDelViaje),
        ciudades:
          dataToSave.ciudades ||
          tripFromState?.ciudades ||
          construirCiudadesViaje(paradasDelViaje),
      };

      setBitacora((prev) => {
        const next = prev.map((viaje) => (viaje.id === id ? updatedViaje : viaje));
        setBitacoraData(construirBitacoraData(next, allStopsRef.current));
        return next;
      });

      logger.info('Viaje actualizado exitosamente', { viajeId: id });
      toast.success('Viaje guardado correctamente');
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
      setTodasLasParadas((prev) => prev.filter((p) => p.viajeId !== id && p.tripId !== id));
      
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

  const eliminarParada = async (viajeId, paradaId) => {
    if (!usuario || !viajeId || !paradaId) return false;

    try {
      await eliminarParadaRepo({ db, userId: usuario.uid, viajeId, paradaId });
      return true;
    } catch (err) {
      logger.error('Error eliminando parada', { error: err.message, viajeId, paradaId });
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
    eliminarParada,
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
    updateStopsBatch: async (newStops, tripId, existingStops) => {
      if (!usuario || !tripId) return false;

      const userId = usuario.uid;
      const isTargetTripStop = (stop) => {
        const belongsToTrip = stop?.viajeId === tripId || stop?.tripId === tripId;
        const belongsToUser = !stop?.ownerId || stop.ownerId === userId;
        return belongsToTrip && belongsToUser;
      };

      const previousTripStops = (Array.isArray(todasLasParadas) ? todasLasParadas : [])
        .filter(isTargetTripStop);

      const optimisticStops = (Array.isArray(newStops) ? newStops : []).map((stop, index) => ({
        ...stop,
        id: stop?.id || `optimistic-${tripId}-${index}`,
        viajeId: tripId,
        ownerId: userId,
      }));

      // Optimistic update: keeps dashboard cards in sync with edited stops instantly.
      setTodasLasParadas((prev) => {
        const untouchedStops = (Array.isArray(prev) ? prev : []).filter((stop) => !isTargetTripStop(stop));
        return [...untouchedStops, ...optimisticStops];
      });

      try {
        await applyStopsBatchMutations({
          db,
          userId,
          tripId,
          draftStops: newStops,
          existingStops
        });
        return true;
      } catch (err) {
        // Rollback local optimistic state if persistence fails.
        setTodasLasParadas((prev) => {
          const untouchedStops = (Array.isArray(prev) ? prev : []).filter((stop) => !isTargetTripStop(stop));
          return [...untouchedStops, ...previousTripStops];
        });
        logger.error('Error applying writeBatch to stops', { error: err.message, tripId });
        return false;
      }
    },
    loading,
    error,
    fetchError,
    isError: !!fetchError,
  };
};
