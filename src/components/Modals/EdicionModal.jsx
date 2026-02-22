import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Camera, Calendar, LoaderCircle, Star, Trash2 } from 'lucide-react';
import { styles } from './EdicionModal.styles';
import { db } from '../../firebase';
import { createInvitation as createInvitationService } from '../../services/invitationsService';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import CityManager from '../Shared/CityManager';
import { compressImage } from '../../utils/imageUtils';
import { generarTituloInteligente } from '../../utils/viajeUtils';
import { GalleryUploader } from '../Shared/GalleryUploader';
import { useGaleriaViaje } from '../../hooks/useGaleriaViaje';

const EdicionModal = ({ viaje, onClose, onSave, esBorrador, ciudadInicial, isSaving = false }) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  // useUpload puede no estar disponible en tests aislados; usar fallback seguro
  let iniciarSubida = () => {};
  try {
    const uploadCtx = useUpload();
    iniciarSubida = uploadCtx?.iniciarSubida || (() => {});
  } catch (e) {
    iniciarSubida = () => {};
  }
  const { isMobile } = useWindowSize(768);
  const [formData, setFormData] = useState({});
  const [paradas, setParadas] = useState([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPortada, setGalleryPortada] = useState(0);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [isTituloAuto, setIsTituloAuto] = useState(true);
  const [titlePulse, setTitlePulse] = useState(false);
  const [companionDraft, setCompanionDraft] = useState('');
  const [companionResults, setCompanionResults] = useState([]);
  const titlePulseRef = useRef(null);
  const prevViajeIdRef = useRef(null);

  // Hook de galería: no cargar para borradores (id 'new') — solo cuando es un viaje guardado
  const galeria = useGaleriaViaje(!esBorrador && viaje?.id ? viaje.id : null);

  // Limpieza total cuando cambia el viaje o se abre para nuevo registro
  useEffect(() => {
    const currentViajeId = viaje?.id || null;
    const prevViajeId = prevViajeIdRef.current;

    // Si cambió el viajeId, limpiar todo (no dependemos de la referencia de `galeria`)
    if (prevViajeId !== currentViajeId) {
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      // llamar a limpiar si está disponible
      galeria.limpiar?.();
      prevViajeIdRef.current = currentViajeId;
    }
  }, [viaje?.id]);


  // Inicialización de estado al abrir modal
  useEffect(() => {
    if (!viaje) {
      // Sin viaje: limpiar todo
      setFormData({});
      setParadas([]);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      setIsTituloAuto(true);
      galeria.limpiar?.();
      return;
    }

    // Nuevo viaje (borrador): limpiar archivos locales
    if (esBorrador) {
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      galeria.limpiar?.();
    }

    // Inicializar formData (incluye nuevos campos de storytelling)
    setFormData({
      ...viaje,
      titulo: esBorrador ? (viaje.titulo || '') : (viaje.titulo || `Viaje a ${viaje.nombreEspanol}`),
      fechaInicio: viaje.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: viaje.fechaFin || new Date().toISOString().split('T')[0],
      foto: viaje.foto,
      texto: viaje.texto || "",
      flag: viaje.flag,
      code: viaje.code,
      nombreEspanol: viaje.nombreEspanol,
      // Storytelling defaults
      presupuesto: viaje.presupuesto || null,
      vibe: viaje.vibe || [],
      highlights: viaje.highlights || { topFood: '', topView: '', topTip: '' },
      companions: viaje.companions || []
    });

    // Solo activar auto si es borrador Y no hay título manual existente
    setIsTituloAuto(esBorrador && (!viaje.titulo || viaje.titulo.trim() === ''));

    // Paradas
    if (esBorrador && ciudadInicial) {
      setParadas([{ 
        id: 'init', 
        nombre: ciudadInicial.nombre, 
        coordenadas: ciudadInicial.coordenadas,
        fecha: viaje.fechaInicio || new Date().toISOString().split('T')[0],
        paisCodigo: ciudadInicial.paisCodigo,
        flag: viaje.flag 
      }]);
    } else if (!esBorrador && usuario && viaje.id) {
      const cargarParadas = async () => {
        try {
          const paradasRef = collection(db, `usuarios/${usuario.uid}/viajes/${viaje.id}/paradas`);
          const snap = await getDocs(paradasRef);
          const loaded = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setParadas(loaded.sort((a,b) => new Date(a.fecha) - new Date(b.fecha)));
        } catch (e) {
          setParadas([]);
        }
      };
      cargarParadas();
    } else {
      setParadas([]); 
    }
  }, [viaje, esBorrador, ciudadInicial, usuario]);

  // Limpieza de estado al cerrar modal
  useEffect(() => {
    return () => {
      setFormData({});
      setParadas([]);
      setGalleryFiles([]);
      setGalleryPortada(0);
      setCaptionDrafts({});
      setIsTituloAuto(true);
    };
  }, []);

  // Actualiza el título automáticamente solo si isTituloAuto está activo
  useEffect(() => {
    if (!esBorrador || !isTituloAuto) return;
    const tituloAuto = generarTituloInteligente(formData.nombreEspanol, paradas);
    if (tituloAuto !== formData.titulo) {
      setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
      setTitlePulse(true);
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
      titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
    }
    // eslint-disable-next-line
  }, [esBorrador, isTituloAuto, paradas, formData.nombreEspanol]);

  // Si el usuario cambia de manual a auto, regenerar el título inmediatamente
  useEffect(() => {
    if (!esBorrador) return;
    if (isTituloAuto) {
      const tituloAuto = generarTituloInteligente(formData.nombreEspanol, paradas);
      setFormData((prev) => ({ ...prev, titulo: tituloAuto }));
      setTitlePulse(true);
      if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
      titlePulseRef.current = setTimeout(() => setTitlePulse(false), 900);
    }
    // eslint-disable-next-line
  }, [isTituloAuto]);

  useEffect(() => () => {
    if (titlePulseRef.current) clearTimeout(titlePulseRef.current);
  }, []);

  // Validación cruzada fechas/paradas
  const paradasFueraDeRango = paradas.some(p =>
    (formData.fechaInicio && new Date(p.fecha) < new Date(formData.fechaInicio)) ||
    (formData.fechaFin && new Date(p.fecha) > new Date(formData.fechaFin))
  );

  const limpiarEstado = () => {
    setFormData({});
    setParadas([]);
    setGalleryFiles([]);
    setGalleryPortada(0);
    setCaptionDrafts({});
    setIsTituloAuto(true);
    galeria.limpiar?.();
  };

  const handleSave = async () => {
    if (!formData.nombreEspanol || isProcessingImage || isSaving) return;

    // Guardar viaje (retorna el viajeId o null)
    const savedViajeId = await onSave(viaje.id, { ...formData, paradasNuevas: paradas });

    if (savedViajeId) {
      // Iniciar subida de fotos en background (no bloquea)
      if (galleryFiles.length > 0) {
        // iniciarSubida envía las fotos al contexto global
        // la subida continúa incluso después de cerrar el modal
        iniciarSubida(savedViajeId, galleryFiles, galleryPortada);
        pushToast('Subiendo fotos en segundo plano...', 'info');
      }
      limpiarEstado();
      onClose();
    }
  };

  const handleSetPortadaExistente = async (fotoId) => {
    const ok = await galeria.cambiarPortada(fotoId);
    if (!ok) pushToast('No se pudo actualizar la portada.', 'error');
  };

  const handleEliminarFoto = async (fotoId) => {
    const confirm = window.confirm('Eliminar esta foto de la galeria?');
    if (!confirm) return;
    const ok = await galeria.eliminar(fotoId);
    if (!ok) pushToast('No se pudo eliminar la foto.', 'error');
  };

  const handleCaptionChange = (fotoId, value) => {
    setCaptionDrafts((prev) => ({ ...prev, [fotoId]: value }));
  };

  const handleCaptionSave = async (foto) => {
    const draft = captionDrafts[foto.id];
    if (draft === undefined) return;
    const normalized = draft.trim();
    const nextCaption = normalized.length ? normalized : null;
    const currentCaption = foto.caption || null;
    if (currentCaption === nextCaption) return;
    const ok = await galeria.actualizarCaption(foto.id, nextCaption);
    if (!ok) {
      pushToast('No se pudo guardar el caption.', 'error');
      return;
    }
    pushToast('Caption actualizado.', 'success', 1500);
  };

  // Buscar usuarios por nombre/email (autocomplete simple) — con debounce
  const searchTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  const performCompanionQuery = async (q) => {
    if (!q || q.length < 2) {
      setCompanionResults([]);
      return;
    }

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      try {
        const usuariosRef = collection(db, 'usuarios');
        const qName = query(usuariosRef, where('displayName', '>=', q), where('displayName', '<=', q + '\uf8ff'));
        const snap = await getDocs(qName);
        const results = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setCompanionResults(results.slice(0, 8));
        return;
      } catch (err) {
        setCompanionResults([]);
        return;
      }
    } catch (err) {
      setCompanionResults([]);
    }
  };

  const handleCompanionSearch = (q) => {
    setCompanionDraft(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    // Debounce 250ms
    searchTimerRef.current = setTimeout(() => performCompanionQuery(q), 250);
  };

  const handleAddCompanionFromResult = async (user) => {
    // Evitar duplicados por userId o email
    const exists = (formData.companions || []).some(c => c.userId === user.uid || (c.email && user.email && c.email === user.email));
    if (exists) {
      pushToast('Este compañero ya está agregado.', 'warning');
      setCompanionResults([]);
      setCompanionDraft('');
      return;
    }

    const next = { name: user.displayName || user.email || 'Invitado', email: user.email || null, userId: user.uid, status: 'pending' };
    setFormData(prev => ({ ...prev, companions: [...(prev.companions || []), next] }));

    if (viaje?.id && usuario?.uid) {
      try {
        await createInvitationService({ db, inviterId: usuario.uid, inviteeUid: user.uid, viajeId: viaje.id });
        pushToast('Invitación enviada.', 'success');
      } catch (err) {
        pushToast('No se pudo crear la invitación.', 'error');
      }
    }
    setCompanionResults([]);
    setCompanionDraft('');
  };

  const handleAddCompanionFreeform = async (text) => {
    const trimmed = text.trim();
    const exists = (formData.companions || []).some(c => (c.email && c.email === trimmed) || (c.name && c.name === trimmed));
    if (exists) {
      pushToast('Este compañero ya está agregado.', 'warning');
      return setCompanionDraft('');
    }

    const next = { name: trimmed, email: trimmed.includes('@') ? trimmed : null, userId: null, status: 'pending' };
    setFormData(prev => ({ ...prev, companions: [...(prev.companions || []), next] }));

    // crear invitation si el viaje existe y parece un email
    if (viaje?.id && usuario?.uid && trimmed.includes('@')) {
      try {
        await createInvitationService({ db, inviterId: usuario.uid, inviteeEmail: trimmed, viajeId: viaje.id });
        pushToast('Invitación creada.', 'info');
      } catch (err) {
        pushToast('No se pudo crear la invitación.', 'error');
      }
    }
    setCompanionDraft('');
  };

  const handleFileChange = async (e) => {
    setIsProcessingImage(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsProcessingImage(false);
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      pushToast('Formato no soportado. Usa JPG o PNG.', 'error');
      e.target.value = '';
      setIsProcessingImage(false);
      return;
    }

    try {
      const { blob, dataUrl } = await compressImage(file, 1920, 0.8);
      const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setFormData((prev) => ({ ...prev, foto: dataUrl, fotoFile: optimizedFile }));
    } catch (error) {
      console.error('Error optimizando imagen:', error);
      pushToast('No se pudo optimizar la imagen seleccionada.', 'error');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  if (!viaje) return null;

  const isBusy = isSaving || isProcessingImage;
  const fechasInvalidas =
    formData.fechaInicio &&
    formData.fechaFin &&
    new Date(formData.fechaInicio) > new Date(formData.fechaFin);
  const sinParadas = paradas.length === 0;

  return (
    <AnimatePresence>
      <motion.div style={styles.overlay(isMobile)} onClick={onClose} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <motion.div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()} initial={{y:50}} animate={{y:0}} exit={{y:50}}>
          <div style={styles.header(formData.foto, isMobile)}>
            <div style={styles.headerOverlay} />
            <div style={styles.headerContent}>
                {formData.flag ? (
                    <img src={formData.flag} alt="Bandera" style={styles.flagImg} onError={(e) => e.target.style.display = 'none'}/>
                ) : <span style={{fontSize:'3rem'}}>🌍</span>}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      name="titulo"
                      value={formData.titulo || ''}
                      onChange={e => {
                        setFormData(prev => ({...prev, titulo: e.target.value}));
                        // Solo desactivar auto si estaba en auto y el valor cambia manualmente
                        if (esBorrador && isTituloAuto) setIsTituloAuto(false);
                      }}
                      style={titlePulse ? styles.titleInputAutoPulse : styles.titleInput}
                      placeholder="Título del viaje"
                      disabled={isBusy}
                    />
                    {esBorrador && (
                      <button
                        type="button"
                        style={styles.autoBadge(isTituloAuto)}
                        title={isTituloAuto
                          ? 'Se actualiza al agregar o quitar ciudades'
                          : 'Usando título manual. Click para volver a auto.'}
                        onClick={() => {
                          // Si pasa de manual a auto, regenerar el título
                          setIsTituloAuto((prev) => !prev);
                        }}
                        disabled={isBusy}
                      >
                        {isTituloAuto ? 'Auto' : 'Manual'}
                      </button>
                    )}
                  </div>
                </div>
            </div>
            {isProcessingImage && (
              <div style={styles.processingBadge}>
                <LoaderCircle size={14} className="spin" />
                Optimizando...
              </div>
            )}
            <label style={styles.cameraBtn(isBusy)}>
              <Camera size={18} />
              <input type="file" hidden onChange={handleFileChange} accept="image/jpeg,image/png" disabled={isBusy} />
            </label>
          </div>

          <div style={styles.body} className="custom-scroll">
            {/* Galería de fotos (siempre disponible) */}
            <div style={styles.section}>
              <label style={styles.label}>Galería de fotos</label>
              <GalleryUploader
                files={galleryFiles}
                onChange={setGalleryFiles}
                portadaIndex={galleryPortada}
                onPortadaChange={setGalleryPortada}
                maxFiles={10}
                disabled={isBusy || galeria.uploading}
                isMobile={isMobile}
              />
              {galeria.uploading && <span style={styles.inlineInfo}>Subiendo fotos...</span>}
              {/* Mostrar galería solo si el viaje tiene id */}
              {/* Mostrar galería del servidor SOLO para viajes guardados (no para borradores) */}
              {!esBorrador && viaje?.id && galeria.fotos.length > 0 && (
                <div style={styles.galleryManageBlock}>
                  <div style={styles.galleryManageGrid}>
                    {galeria.fotos.map((f) => (
                      <div key={f.id} style={styles.galleryManageCard(f.esPortada)}>
                        <img src={f.url} alt={f.caption || 'foto'} style={styles.galleryManageImg} />
                        <input
                          type="text"
                          value={captionDrafts[f.id] ?? (f.caption || '')}
                          onChange={(e) => handleCaptionChange(f.id, e.target.value)}
                          onBlur={() => handleCaptionSave(f)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          placeholder="Caption"
                          style={styles.captionInput}
                          aria-label="Editar caption"
                        />
                        <div style={styles.galleryActionsRow}>
                          <button
                            type="button"
                            style={styles.galleryActionBtn(f.esPortada)}
                            onClick={() => handleSetPortadaExistente(f.id)}
                            disabled={isBusy}
                            title="Marcar como portada"
                            aria-label={f.esPortada ? 'Imagen actual de portada' : 'Marcar como portada'}
                          >
                            <Star size={14} />
                          </button>
                          <button
                            type="button"
                            style={styles.galleryDangerBtn}
                            onClick={() => handleEliminarFoto(f.id)}
                            disabled={isBusy}
                            title="Eliminar foto"
                            aria-label="Eliminar foto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {f.esPortada && <span style={styles.portadaBadgeMini}>Portada</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Fechas y ciudades agrupadas visualmente */}
            <div style={styles.section}>
              <label style={styles.label}><Calendar size={14}/> Fechas y Paradas</label>
              <div style={styles.row}>
                <input
                  type="date"
                  value={formData.fechaInicio || ''}
                  onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                  style={styles.dateInput}
                  disabled={isBusy}
                  aria-label="Fecha de inicio"
                  title="Fecha de inicio del viaje"
                />
                <span style={{color:'#94a3b8'}}>hasta</span>
                <input
                  type="date"
                  value={formData.fechaFin || ''}
                  onChange={e => setFormData({...formData, fechaFin: e.target.value})}
                  style={styles.dateInput}
                  disabled={isBusy}
                  aria-label="Fecha de fin"
                  title="Fecha de fin del viaje"
                />
              </div>
              {fechasInvalidas && (
                <span style={styles.inlineError}>La fecha de fin no puede ser anterior al inicio.</span>
              )}
              <CityManager paradas={paradas} setParadas={setParadas} rango={{inicio: formData.fechaInicio, fin: formData.fechaFin}} />
              {sinParadas && (
                <span style={styles.inlineError}>Agrega al menos una ciudad para continuar.</span>
              )}
              {paradasFueraDeRango && (
                <span style={styles.inlineError}>Hay paradas fuera del rango de fechas del viaje.</span>
              )}
            </div>

            {/* Contexto del viaje: presupuesto, vibe, companions */}
            <div style={styles.section}>
              <label style={styles.label}>Contexto del viaje</label>

              <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <label style={{fontSize:'0.75rem', color:'#94a3b8'}}>Presupuesto</label>
                  <select
                    value={formData.presupuesto || ''}
                    onChange={e => setFormData({...formData, presupuesto: e.target.value || null})}
                    style={styles.dateInput}
                  >
                    <option value=''>-- seleccionar --</option>
                    <option value='Mochilero'>Mochilero</option>
                    <option value='Económico'>Económico</option>
                    <option value='Confort'>Confort</option>
                    <option value='Lujo'>Lujo</option>
                  </select>
                </div>

                <div style={{flex:1}}>
                  <label style={{fontSize:'0.75rem', color:'#94a3b8'}}>Vibe</label>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
                    {['Gastronómico','Aventura','Relax','Roadtrip','Cultural'].map(v => {
                      const selected = (formData.vibe || []).includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, vibe: prev.vibe.includes(v) ? prev.vibe.filter(x => x !== v) : [...prev.vibe, v]}))}
                          style={{padding:'6px 10px', borderRadius:12, border:selected ? '1px solid #f59e0b' : '1px solid #e2e8f0', background: selected ? '#fffbf0' : '#fff', cursor:'pointer'}}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{marginTop:12}}>
                <label style={{fontSize:'0.75rem', color:'#94a3b8'}}>Compañeros</label>
                <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
                  <input
                    placeholder='Nombre o email'
                    value={companionDraft || ''}
                    onChange={e=> handleCompanionSearch(e.target.value)}
                    style={{flex:1, padding:8, borderRadius:8, border:'1px solid #e2e8f0'}}
                  />
                  <button
                    type='button'
                    onClick={() => companionDraft && companionDraft.trim() && handleAddCompanionFreeform(companionDraft)}
                    style={styles.saveBtn(false)}
                  >Agregar</button>
                </div>

                {companionResults.length > 0 && (
                  <div style={{border:'1px solid #e2e8f0', borderRadius:8, marginTop:8, maxHeight:160, overflowY:'auto', background:'#fff'}}>
                    {companionResults.map(u => (
                      <div key={u.uid} style={{padding:8, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}} onClick={() => handleAddCompanionFromResult(u)}>
                        <div>
                          <strong style={{display:'block'}}>{u.displayName || u.email}</strong>
                          <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>{u.email}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleAddCompanionFromResult(u); }} style={{padding:'6px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff'}}>Agregar</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Si no hay resultados y el usuario escribió un email, ofrecer invitar */}
                {companionResults.length === 0 && companionDraft && companionDraft.includes('@') && (
                  <div style={{marginTop:8}}>
                    <button type="button" style={{padding:'8px 12px', borderRadius:8, border:'1px dashed #94a3b8', background:'#fff'}} onClick={() => handleAddCompanionFreeform(companionDraft)}>
                      ✉️ Invitar por email: {companionDraft}
                    </button>
                  </div>
                )}
                <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
                  {(formData.companions || []).map((c, idx) => (
                    <div key={idx} style={{padding:'6px 10px', borderRadius:12, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', gap:8, alignItems:'center'}}>
                      <span style={{fontSize:'0.9rem'}}>{c.name}</span>
                      <button type='button' onClick={() => setFormData(prev => ({...prev, companions: prev.companions.filter((_,i)=>i!==idx)}))} style={{background:'transparent', border:'none', color:'#ef4444'}}>x</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Highlights</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <input placeholder='🍽️ El Plato' value={(formData.highlights?.topFood) || ''} onChange={e => setFormData(prev => ({...prev, highlights: {...(prev.highlights||{}), topFood: e.target.value}}))} style={styles.dateInput} />
                <input placeholder='👀 La Vista' value={(formData.highlights?.topView) || ''} onChange={e => setFormData(prev => ({...prev, highlights: {...(prev.highlights||{}), topView: e.target.value}}))} style={styles.dateInput} />
                <input placeholder='💡 El Tip' value={(formData.highlights?.topTip) || ''} onChange={e => setFormData(prev => ({...prev, highlights: {...(prev.highlights||{}), topTip: e.target.value}}))} style={{gridColumn:'1 / -1', padding:8, borderRadius:8, border:'1px solid #e2e8f0'}} />
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Notas</label>
              <textarea value={formData.texto || ''} onChange={e => setFormData({...formData, texto: e.target.value})} style={styles.textarea} placeholder="Escribe tus recuerdos aquí..." disabled={isBusy} />
            </div>
            <div style={styles.footer}>
                <button onClick={onClose} style={styles.cancelBtn(isBusy)} disabled={isBusy}>Cancelar</button>
                <button onClick={handleSave} style={styles.saveBtn(isBusy)} disabled={isBusy}>
                  {isBusy ? <LoaderCircle size={18} className="spin" /> : <Save size={18} />}
                  {isProcessingImage ? 'Procesando...' : (isSaving ? 'Guardando...' : (esBorrador ? 'Crear Viaje' : 'Guardar'))}
                </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EdicionModal;
