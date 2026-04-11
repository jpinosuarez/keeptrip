import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@shared/firebase';
import { generarTituloInteligente, parseFlexibleDate } from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

export function useEdicionModalLifecycle({
  viaje,
  esBorrador,
  ciudadInicial,
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
  const titlePulseRef = useRef(null);
  const prevViajeIdRef = useRef(null);
  const initSignatureRef = useRef(null);
  const limpiarGaleriaRef = useRef(() => {});
  const initializedParadasRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const hasHydratedStopsRef = useRef(false);
  const formDataRef = useRef(formData);
  const tRef = useRef(t);

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
    }
  }, [setCaptionDrafts, setGalleryFiles, setGalleryPortada, viaje?.id]);

  useEffect(() => {
    if (!viaje) {
      setFormData({});
      setParadas([]);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTituloAuto(true);
      setIsHydratingStops(false);
      limpiarGaleriaRef.current();
      initSignatureRef.current = null;
      hasHydratedRef.current = false;
      hasHydratedStopsRef.current = false;
      return;
    }

    const initSignature = JSON.stringify({
      id: viaje.id || 'none',
      mode: esBorrador ? 'borrador' : 'edicion',
      userId: usuarioUid || 'anon',
      code: viaje.code || '',
      countryName: viaje.nombreEspanol || '',
      flag: viaje.flag || '',
      title: viaje.titulo || '',
      startDate: viaje.fechaInicio || '',
      endDate: viaje.fechaFin || '',
      text: viaje.texto || '',
      budget: viaje.presupuesto || null,
      vibe: Array.isArray(viaje.vibe) ? viaje.vibe : [],
      companions: Array.isArray(viaje.companions) ? viaje.companions : [],
      highlights: viaje.highlights || { topFood: '', topView: '', topTip: '' },
      photo: viaje.foto || null,
      coverPhoto: viaje.portadaUrl || null,
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

    setFormData({
      ...viaje,
      titulo: resolvedTitulo,
      fechaInicio: viaje.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: viaje.fechaFin || new Date().toISOString().split('T')[0],
      foto: viaje.foto,
      portadaUrl: viaje.portadaUrl || viaje.foto || null,
      texto: viaje.texto || '',
      flag: viaje.flag,
      code: viaje.code,
      nombreEspanol: viaje.nombreEspanol,
      presupuesto: viaje.presupuesto || null,
      vibe: viaje.vibe || [],
      highlights: viaje.highlights || { topFood: '', topView: '', topTip: '' },
      companions: viaje.companions || [],
    });

    setIsTituloAuto(!viaje.titulo || viaje.titulo.trim() === '');

    if (esBorrador && ciudadInicial) {
      setIsHydratingStops(false);
      setParadas([
        {
          id: 'init',
          nombre: ciudadInicial.nombre,
          coordenadas: ciudadInicial.coordenadas,
          fecha: viaje.fechaInicio || new Date().toISOString().split('T')[0],
          paisCodigo: ciudadInicial.paisCodigo,
          flag: ciudadInicial.flag || ciudadInicial.paisCodigo,
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
          const snap = await getDocs(paradasRef);
          const loaded = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              flag: data.flag || (data.paisCodigo ? getFlagUrl(data.paisCodigo) : ''),
            };
          });
          setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
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
    setParadas([]);
  }, [
    ciudadInicial,
    esBorrador,
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
    };
  }, [setCaptionDrafts, setFormData, setGalleryFiles, setGalleryPortada, setParadas]);

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

      if (isTituloAuto) {
        const tituloAuto = generarTituloInteligente(paradas, tRef.current, i18n.language);
        if (tituloAuto !== currentFormData.titulo) {
          setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTitlePulse(true);
          if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
          titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
        }
      }
    }
  }, [esBorrador, formData?.id, formData?.nombreEspanol, isTituloAuto, paradas, setFormData, viaje?.id, viaje?.nombreEspanol]);

  // Effect 2 (Reactive Engine): reacciona a paradas + modo auto después de hidratar
  useEffect(() => {
    if (!hasHydratedRef.current || !isTituloAuto) return;

    const currentFormData = formDataRef.current || {};
    const tituloAuto = generarTituloInteligente(paradas, tRef.current, i18n.language);

    if (tituloAuto !== currentFormData.titulo) {
      setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitlePulse(true);
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
      titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
    }
  }, [paradas, isTituloAuto, setFormData]);

  useEffect(() => {
    return () => {
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
    };
  }, []);

  useEffect(() => {
    if (paradas.length === 0) return;

    const fechasIso = paradas
      .map((p) => parseFlexibleDate(p.fechaLlegada) || p.fecha)
      .filter(Boolean)
      .sort();

    const fechasSalidaIso = paradas.map((p) => parseFlexibleDate(p.fechaSalida)).filter(Boolean);
    const allDates = [...fechasIso, ...fechasSalidaIso].filter(Boolean).sort();

    if (allDates.length > 0) {
      const inicio = allDates[0];
      const fin = allDates[allDates.length - 1];
      setFormData((prev) => ({
        ...prev,
        fechaInicio: inicio,
        fechaFin: fin >= inicio ? fin : inicio,
      }));
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

    // KILL ZOMBIE HOOK: Only initialize paradas on FIRST MOUNT, not when user deletes them
    if (ciudadInicial && paradas.length === 0 && !initializedParadasRef.current) {
      initializedParadasRef.current = true;
      setParadas([
        {
          id: 'init',
          nombre: ciudadInicial.nombre,
          coordenadas: ciudadInicial.coordenadas,
          fecha: viaje.fechaInicio || new Date().toISOString().split('T')[0],
          paisCodigo: ciudadInicial.paisCodigo,
          flag: viaje.flag,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ciudadInicial,
    esBorrador,
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
