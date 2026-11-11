import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@shared/firebase';
import {
  generarTituloInteligente,
  parseFlexibleDate,
  normalizeToIsoDate,
  resolveCoverPhotoUrl,
  calcularRangoFechasParadas,
} from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

export function useEdicionModalLifecycle({
  viaje,
  esBorrador,
  ciudadInicial,
  paradasIniciales = [],
  usuarioUid,
  galeria,
  formData,
  setFormData,
  paradas,
  setParadas,
  setGalleryFiles,
  setGalleryPortada,
  setCaptionDrafts,
  t,
  i18n,
}) {
  const [isTituloAuto, setIsTituloAuto] = useState(true);
  const [titlePulse, setTitlePulse] = useState(false);
  const [isHydratingStops, setIsHydratingStops] = useState(false);
  const language = i18n?.language || 'es';

  const titlePulseRef = useRef(null);
  const prevViajeIdRef = useRef(null);
  const initSignatureRef = useRef(null);
  const limpiarGaleriaRef = useRef(() => {});
  const initializedParadasRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const hasHydratedStopsRef = useRef(false);
  const prevIsHydratingStopsRef = useRef(false);
  const previousAutoModeRef = useRef(true);
  const initialStopsSignatureRef = useRef(null);
  const hasStopsChangedSinceOpenRef = useRef(false);
  const deferAutoTitleUntilStopsChangeRef = useRef(false);
  const formDataRef = useRef(formData);
  const tRef = useRef(t);

  const buildStopsSignature = useCallback((stops = []) => {
    const safeStops = Array.isArray(stops) ? stops : [];
    const normalized = safeStops.map((stop) => ({
      id: stop?.id || null,
      nombre: stop?.nombre || '',
      paisCodigo: stop?.paisCodigo || stop?.countryCode || stop?.code || '',
      fecha: stop?.fecha || stop?.fechaLlegada || stop?.fechaSalida || '',
      lat: Array.isArray(stop?.coordenadas) ? stop.coordenadas[1] ?? null : null,
      lng: Array.isArray(stop?.coordenadas) ? stop.coordenadas[0] ?? null : null,
    }));
    return JSON.stringify(normalized);
  }, []);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    limpiarGaleriaRef.current = galeria?.limpiar || (() => {});
  }, [galeria]);

  useEffect(() => {
    const currentViajeId = viaje?.id || null;
    const prevViajeId = prevViajeIdRef.current;

    if (prevViajeId !== currentViajeId) {
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      limpiarGaleriaRef.current();
      prevViajeIdRef.current = currentViajeId;
      initializedParadasRef.current = false; // Reset flag when trip changes
      hasHydratedRef.current = false;
      hasHydratedStopsRef.current = false;
      prevIsHydratingStopsRef.current = false;
      previousAutoModeRef.current = true;
      initialStopsSignatureRef.current = null;
      hasStopsChangedSinceOpenRef.current = false;
      deferAutoTitleUntilStopsChangeRef.current = false;
    }
  }, [setCaptionDrafts, setGalleryFiles, setGalleryPortada, viaje?.id]);

  useEffect(() => {
    if (!viaje) {
      setFormData({});
      setParadas([]);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      setIsTituloAuto(true);
      setIsHydratingStops(false);
      limpiarGaleriaRef.current();
      initSignatureRef.current = null;
      hasHydratedRef.current = false;
      hasHydratedStopsRef.current = false;
      prevIsHydratingStopsRef.current = false;
      previousAutoModeRef.current = true;
      initialStopsSignatureRef.current = null;
      hasStopsChangedSinceOpenRef.current = false;
      deferAutoTitleUntilStopsChangeRef.current = false;
      return;
    }

    const normalizedStartDate = normalizeToIsoDate(viaje.fechaInicio || viaje.startDate || viaje.date) || '';
    const normalizedEndDate = normalizeToIsoDate(viaje.fechaFin || viaje.endDate) || '';
    const normalizedCover = resolveCoverPhotoUrl(viaje);

    const initSignature = JSON.stringify({
      id: viaje.id || 'none',
      mode: esBorrador ? 'borrador' : 'edicion',
      userId: usuarioUid || 'anon',
      code: viaje.code || '',
      countryName: viaje.nombreEspanol || '',
      flag: viaje.flag || '',
      title: viaje.titulo || '',
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      text: viaje.texto || '',
      budget: viaje.presupuesto || null,
      vibe: Array.isArray(viaje.vibe) ? viaje.vibe : [],
      companions: Array.isArray(viaje.companions) ? viaje.companions : [],
      highlights: viaje.highlights || { topFood: '', topView: '', topTip: '' },
      photo: normalizedCover,
      coverPhoto: normalizedCover,
      cityInitial: {
        name: ciudadInicial?.nombre || '',
        countryCode: ciudadInicial?.paisCodigo || '',
        coordinates: ciudadInicial?.coordenadas || [],
        selectionId: ciudadInicial?._selectionId || '',
      },
    });

    if (initSignatureRef.current === initSignature) return;
    initSignatureRef.current = initSignature;

    if (esBorrador) {
      setIsHydratingStops(false);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      limpiarGaleriaRef.current();
    }

    const resolvedTitulo = esBorrador
      ? viaje.titulo || ''
      : viaje.titulo || viaje.nombreEspanol || viaje.code || `Viaje a ${viaje.nombreEspanol || ''}`;

    const fallbackStart = esBorrador ? new Date().toISOString().split('T')[0] : '';
    const safeStart = normalizedStartDate || fallbackStart;
    const safeEnd = normalizedEndDate || safeStart;

    setFormData({
      ...viaje,
      titulo: resolvedTitulo,
      fechaInicio: safeStart,
      fechaFin: safeEnd,
      foto: normalizedCover,
      portadaUrl: normalizedCover,
      texto: viaje.texto || '',
      titular: viaje.titular || '',
      flag: viaje.flag,
      code: viaje.code,
      nombreEspanol: viaje.nombreEspanol,
      presupuesto: viaje.presupuesto || null,
      vibe: viaje.vibe || [],
      highlights: viaje.highlights || { topFood: '', topView: '', topTip: '' },
      companions: viaje.companions || [],
    });

    const hasStoredTitle = Boolean(viaje.titulo && viaje.titulo.trim());
    // Existing trips start in auto mode to react on the first stop mutation.
    setIsTituloAuto(esBorrador ? !hasStoredTitle : true);
    deferAutoTitleUntilStopsChangeRef.current = !esBorrador && hasStoredTitle;
    hasStopsChangedSinceOpenRef.current = false;
    initialStopsSignatureRef.current = null;

    if (esBorrador && ciudadInicial) {
      setIsHydratingStops(false);
      const initialDate = normalizeToIsoDate(viaje.fechaInicio || viaje.startDate) || new Date().toISOString().split('T')[0];
      setParadas([
        {
          id: 'init',
          nombre: ciudadInicial.nombre,
          coordenadas: ciudadInicial.coordenadas,
          fecha: initialDate,
          fechaLlegada: initialDate,
          fechaSalida: '',
          paisCodigo: ciudadInicial.paisCodigo,
          flag: ciudadInicial.flag || ciudadInicial.paisCodigo,
          orden: 1,
        },
      ]);
      return;
    }

    if (!esBorrador && usuarioUid && viaje.id && !hasHydratedStopsRef.current) {
      hasHydratedStopsRef.current = true;
      setIsHydratingStops(true);
      const cargarParadas = async () => {
        try {
          const paradasRef = collection(db, `usuarios/${usuarioUid}/viajes/${viaje.id}/paradas`);
          const readStops = async () => {
            const snap = await getDocs(paradasRef);
            return snap.docs.map((d) => {
              const data = d.data();
              const fechaLlegada = normalizeToIsoDate(data.fechaLlegada || data.fecha) || '';
              const fechaSalida = normalizeToIsoDate(data.fechaSalida) || '';
              const fecha = normalizeToIsoDate(data.fecha || data.fechaLlegada) || fechaLlegada;
              return {
                ...data,
                id: d.id,
                fecha,
                fechaLlegada,
                fechaSalida,
                flag: data.flag || (data.paisCodigo ? getFlagUrl(data.paisCodigo) : ''),
              };
            });
          };

          const sortStops = (stops) =>
            stops
              .map((stop, idx) => ({ stop, idx }))
              .sort((a, b) => {
                const ordenA = Number.isFinite(Number(a.stop?.orden)) ? Number(a.stop.orden) : a.idx + 1;
                const ordenB = Number.isFinite(Number(b.stop?.orden)) ? Number(b.stop.orden) : b.idx + 1;
                if (ordenA !== ordenB) return ordenA - ordenB;
                const dateA = new Date(a.stop?.fecha).getTime();
                const dateB = new Date(b.stop?.fecha).getTime();
                return (Number.isFinite(dateA) ? dateA : 0) - (Number.isFinite(dateB) ? dateB : 0);
              })
              .map(({ stop }) => stop);

          const loaded = await readStops();
          const fallbackStops = Array.isArray(viaje?.paradas)
            ? viaje.paradas
            : Array.isArray(viaje?.destinos)
              ? viaje.destinos
              : [];
          const paradasOrdenadas = sortStops(loaded.length > 0 ? loaded : fallbackStops);
          setParadas(paradasOrdenadas);

          // Right after creating a trip, its stops can land a beat after the
          // trip document that renders the card. Re-read once in the background
          // (without delaying `isHydratingStops`) so Save enables on reopen.
          if (loaded.length === 0) {
            setTimeout(() => {
              void readStops().then((retried) => {
                if (retried.length > 0) setParadas(sortStops(retried));
              });
            }, 600);
          }

          // Restore auto-title mode if the saved title identically matches the generated one for these stops
          if (!esBorrador && viaje.titulo) {
            const tituloEsperado = generarTituloInteligente(paradasOrdenadas, tRef.current, language);
            if (viaje.titulo === tituloEsperado) {
              setIsTituloAuto(true);
              deferAutoTitleUntilStopsChangeRef.current = false;
            }
          }
        } catch {
          setParadas([]);
        } finally {
          setIsHydratingStops(false);
        }
      };
      void cargarParadas();
      return;
    }

    setIsHydratingStops(false);
    // Existing trips: NEVER wipe already-hydrated stops on dependency churn.
    // The Firestore trips snapshot replaces `viaje` with a new object reference,
    // re-running this effect; clearing here disabled Save with "a trip must
    // include at least one destination" even though the stops were loaded.
    if (esBorrador) {
      setParadas([]);
    }
  }, [
    ciudadInicial,
    esBorrador,
    language,
    setCaptionDrafts,
    setFormData,
    setGalleryFiles,
    setGalleryPortada,
    setParadas,
    usuarioUid,
    viaje,
  ]);

  useEffect(() => {
    return () => {
      setFormData({});
      setParadas([]);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      setIsTituloAuto(true);
      setIsHydratingStops(false);
      initializedParadasRef.current = false; // Reset flag on unmount
      hasHydratedRef.current = false;
      hasHydratedStopsRef.current = false;
      initSignatureRef.current = null;
      prevIsHydratingStopsRef.current = false;
      previousAutoModeRef.current = true;
      initialStopsSignatureRef.current = null;
      hasStopsChangedSinceOpenRef.current = false;
      deferAutoTitleUntilStopsChangeRef.current = false;
    };
  }, [setCaptionDrafts, setFormData, setGalleryFiles, setGalleryPortada, setParadas]);

  useEffect(() => {
    // Explicit re-activation (manual -> auto) should regenerate immediately.
    if (isTituloAuto && !previousAutoModeRef.current) {
      deferAutoTitleUntilStopsChangeRef.current = false;
    }
    previousAutoModeRef.current = isTituloAuto;
  }, [isTituloAuto]);

  useEffect(() => {
    if (!isTituloAuto) return;

    const currentSignature = buildStopsSignature(paradas);

    if (isHydratingStops) {
      prevIsHydratingStopsRef.current = true;
      return;
    }

    if (initialStopsSignatureRef.current === null || prevIsHydratingStopsRef.current) {
      initialStopsSignatureRef.current = currentSignature;
      hasStopsChangedSinceOpenRef.current = false;
      prevIsHydratingStopsRef.current = false;
      return;
    }

    if (currentSignature !== initialStopsSignatureRef.current) {
      hasStopsChangedSinceOpenRef.current = true;
    }
  }, [buildStopsSignature, isHydratingStops, isTituloAuto, paradas]);

  // Effect 1 (Hydration): habilita el motor reactivo y define estado inicial del titulo
  useEffect(() => {
    const currentFormData = formDataRef.current || {};
    const hasStableId = Boolean(viaje?.id && viaje.id !== 'new');
    const isSameEntity = hasStableId && currentFormData?.id === viaje.id;
    const isDraftWithoutStableId = esBorrador && !hasStableId;
    const hasDraftContext = isDraftWithoutStableId && Boolean(currentFormData?.nombreEspanol || viaje?.nombreEspanol);

    if (!isSameEntity && !hasDraftContext) {
      return;
    }

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;

      if (
        deferAutoTitleUntilStopsChangeRef.current &&
        !hasStopsChangedSinceOpenRef.current
      ) {
        return;
      }

      if (isTituloAuto) {
        const tituloAuto = generarTituloInteligente(paradas, tRef.current, language);
        if (tituloAuto !== currentFormData.titulo) {
          setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
          setTitlePulse(true);
          if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
          titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
        }
      }
    }
  }, [esBorrador, formData?.id, formData?.nombreEspanol, isTituloAuto, language, paradas, setFormData, viaje?.id, viaje?.nombreEspanol]);

  // Effect 2 (Reactive Engine): reacciona a paradas + modo auto después de hidratar
  useEffect(() => {
    if (!hasHydratedRef.current || !isTituloAuto) return;

    if (
      deferAutoTitleUntilStopsChangeRef.current &&
      !hasStopsChangedSinceOpenRef.current
    ) {
      return;
    }

    const currentFormData = formDataRef.current || {};
    const tituloAuto = generarTituloInteligente(paradas, tRef.current, language);

    if (tituloAuto !== currentFormData.titulo) {
      setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
      setTitlePulse(true);
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
      titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
    }
  }, [isTituloAuto, language, paradas, setFormData]);

  useEffect(() => {
    return () => {
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
    };
  }, []);

  useEffect(() => {
    if (paradas.length === 0) return;

    const { fechaInicio: nuevoInicio, fechaFin: nuevoFin } = calcularRangoFechasParadas(paradas);

    if (nuevoInicio && nuevoFin) {
      setFormData((prev) => {
        if (prev.fechaInicio === nuevoInicio && prev.fechaFin === nuevoFin) {
          return prev;
        }
        return {
          ...prev,
          fechaInicio: nuevoInicio,
          fechaFin: nuevoFin,
        };
      });
    }
  }, [paradas, setFormData]);

  useEffect(() => {
    if (!esBorrador || !viaje) return;

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      if (!next.code && viaje.code) {
        next.code = viaje.code;
        changed = true;
      }
      if (!next.nombreEspanol && viaje.nombreEspanol) {
        next.nombreEspanol = viaje.nombreEspanol;
        changed = true;
      }
      if (!next.flag && viaje.flag) {
        next.flag = viaje.flag;
        changed = true;
      }
      if (!next.coordenadas && Array.isArray(viaje.coordenadas)) {
        next.coordenadas = viaje.coordenadas;
        changed = true;
      }
      if (!next.latlng && Array.isArray(viaje.latlng)) {
        next.latlng = viaje.latlng;
        changed = true;
      }

      return changed ? next : prev;
    });

    // KILL ZOMBIE HOOK: Only initialize paradas on FIRST MOUNT, not when user deletes them.
    // Block 2.5 / Finding F1: a wishlist "create trip" seed can carry MULTIPLE
    // cities; seed them all so nothing is silently dropped, then let the user prune.
    if (paradas.length === 0 && !initializedParadasRef.current) {
      const hasInitialStops = Array.isArray(paradasIniciales) && paradasIniciales.length > 0;
      if (hasInitialStops) {
        initializedParadasRef.current = true;
        setParadas(
          paradasIniciales.map((stop, index) => ({
            ...stop,
            id: stop?.id || `init-${index}`,
            orden: stop?.orden ?? index + 1,
          }))
        );
      } else if (ciudadInicial) {
        initializedParadasRef.current = true;
        const initialDate = normalizeToIsoDate(viaje.fechaInicio || viaje.startDate) || new Date().toISOString().split('T')[0];
        setParadas([
          {
            id: 'init',
            nombre: ciudadInicial.nombre,
            coordenadas: ciudadInicial.coordenadas,
            fecha: initialDate,
            fechaLlegada: initialDate,
            fechaSalida: '',
            paisCodigo: ciudadInicial.paisCodigo,
            flag: viaje.flag,
            orden: 1,
          },
        ]);
      }
    }
  }, [
    ciudadInicial,
    esBorrador,
    paradas.length,
    paradasIniciales,
    setFormData,
    setParadas,
    viaje,
  ]);

  const limpiarEstado = useCallback(() => {
    setFormData({});
    setParadas([]);
    setGalleryFiles([]);
    setGalleryPortada(0);
    setCaptionDrafts({});
    setIsTituloAuto(true);
    limpiarGaleriaRef.current();
  }, [setCaptionDrafts, setFormData, setGalleryFiles, setGalleryPortada, setParadas]);

  const handleTituloChange = useCallback(
    (titulo) => {
      setFormData((prev) => ({ ...prev, titulo }));
      if (isTituloAuto) setIsTituloAuto(false);
    },
    [isTituloAuto, setFormData]
  );

  return {
    isTituloAuto,
    setIsTituloAuto,
    isHydratingStops,
    titlePulse,
    limpiarEstado,
    handleTituloChange,
  };
}
