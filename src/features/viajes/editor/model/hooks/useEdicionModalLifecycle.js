import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@shared/firebase';
import { generarTituloInteligente, parseFlexibleDate } from '@shared/lib/utils/viajeUtils';

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
}) {
  const [isTituloAuto, setIsTituloAuto] = useState(true);
  const [titlePulse, setTitlePulse] = useState(false);
  const titlePulseRef = useRef(null);
  const prevViajeIdRef = useRef(null);
  const initSignatureRef = useRef(null);
  const limpiarGaleriaRef = useRef(() => {});
  const initializedParadasRef = useRef(false);

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
      limpiarGaleriaRef.current();
      initSignatureRef.current = null;
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
      return;
    }

    if (!esBorrador && usuarioUid && viaje.id) {
      const cargarParadas = async () => {
        try {
          const paradasRef = collection(db, `usuarios/${usuarioUid}/viajes/${viaje.id}/paradas`);
          const snap = await getDocs(paradasRef);
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
        } catch {
          setParadas([]);
        }
      };
      void cargarParadas();
      return;
    }

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
      initializedParadasRef.current = false; // Reset flag on unmount
    };
  }, [setCaptionDrafts, setFormData, setGalleryFiles, setGalleryPortada, setParadas]);

  useEffect(() => {
    if (!isTituloAuto) return;

    const tituloAuto = generarTituloInteligente(formData.nombreEspanol, paradas, t);

    if (tituloAuto !== formData.titulo) {
      setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitlePulse(true);
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
      titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
    }
  }, [formData.nombreEspanol, formData.titulo, isTituloAuto, paradas, setFormData, t]);

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
    titlePulse,
    limpiarEstado,
    handleTituloChange,
  };
}
