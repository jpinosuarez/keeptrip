import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit3, Calendar, Check, X, Camera, Trash2, LoaderCircle, Star } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { styles } from './VisorViaje.styles';
import { COLORS } from '../../theme';
import CityManager from '../Shared/CityManager';
import MiniMapaRuta from '../Shared/MiniMapaRuta';
import { compressImage } from '../../utils/imageUtils';
import { useGaleriaViaje } from '../../hooks/useGaleriaViaje';
import { GalleryGrid } from '../Shared/GalleryGrid';
import { useWindowSize } from '../../hooks/useWindowSize';

const VisorViaje = ({
  viajeId,
  bitacoraData,
  bitacoraLista,
  onClose,
  onEdit,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false
}) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { getEstadoViaje, reintentarFoto } = useUpload();
  const { isMobile } = useWindowSize(900);
  const viajeBase = bitacoraLista.find((v) => v.id === viajeId);
  const data = bitacoraData[viajeId] || viajeBase || {};

  const [modoEdicion, setModoEdicion] = useState(false);
  const [formTemp, setFormTemp] = useState({});
  const [paradas, setParadas] = useState([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [showGalleryTools, setShowGalleryTools] = useState(false);

  // Detectar si el viaje es compartido (owner ≠ usuario actual)
  const isSharedTrip = data.ownerId && usuario && data.ownerId !== usuario.uid;
  const [ownerDisplayName, setOwnerDisplayName] = useState(null);

  useEffect(() => {
    if (!isSharedTrip) { setOwnerDisplayName(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const perfilSnap = await getDoc(doc(db, 'usuarios', data.ownerId));
        if (!cancelled && perfilSnap.exists()) {
          setOwnerDisplayName(perfilSnap.data().displayName || data.ownerId);
        }
      } catch (_) { /* no bloquear */ }
    })();
    return () => { cancelled = true; };
  }, [isSharedTrip, data.ownerId]);

  useEffect(() => {
    if (viajeId && usuario) {
      const fetchParadas = async () => {
        const ref = collection(db, `usuarios/${usuario.uid}/viajes/${viajeId}/paradas`);
        const snap = await getDocs(ref);
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setParadas(loaded.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      };
      fetchParadas();
    }
  }, [viajeId, usuario]);

  // Galería de fotos del viaje
  const galeria = useGaleriaViaje(viajeId);

  // Estado de fotos subiendo (desde UploadContext)
  const uploadState = getEstadoViaje(viajeId);
  const fotosSubiendo = uploadState?.fotos || [];
  const isUploading = uploadState?.isUploading || false;

  // Recargar galería cuando se completen subidas
  useEffect(() => {
    // Cuando hay fotos subidas exitosamente, recargar la galería
    const fotosExitosas = fotosSubiendo.filter(f => f.status === 'success');
    if (fotosExitosas.length > 0 && !isUploading) {
      galeria.recargar?.();
    }
  }, [fotosSubiendo, isUploading]);

  if (!viajeId || !data) return null;

  const iniciarEdicion = () => {
    setFormTemp({
      ...data,
      titulo: data.titulo || viajeBase?.nombreEspanol || '',
      texto: data.texto || ''
    });
    setModoEdicion(true);
  };

  const guardarCambios = async () => {
    if (isProcessingImage || isSaving) return;
    const ok = await onSave(viajeId, { ...formTemp, paradasNuevas: paradas });
    if (ok) setModoEdicion(false);
  };

  const eliminarEsteViaje = () => {
    onDelete(viajeId);
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

  const handleReplaceImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      pushToast('Formato no soportado. Usa JPG o PNG.', 'error');
      e.target.value = '';
      return;
    }

    setIsProcessingImage(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 1920, 0.8);
      const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setFormTemp((prev) => ({
        ...prev,
        foto: dataUrl,
        fotoFile: optimizedFile,
        fotoCredito: null
      }));
    } catch (error) {
      console.error('Error optimizando imagen en visor:', error);
      pushToast('No se pudo optimizar la imagen seleccionada.', 'error');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const getClimaTexto = (clima, temperatura) => {
    if (!clima) return null;
    const desc = clima.toLowerCase();
    const temp = Math.round(temperatura);
    if (desc.includes('despejado') || desc.includes('sol')) return `Dia soleado, ${temp}C`;
    if (desc.includes('nublado') || desc.includes('nubes')) return `Cielo nublado, ${temp}C`;
    if (desc.includes('lluvia')) return `Llovio, ${temp}C`;
    return `${clima}, ${temp}C`;
  };

  const fotoMostrada = modoEdicion
    ? formTemp.foto
    : (data.foto && typeof data.foto === 'string' && data.foto.trim()
      ? data.foto
      : (viajeBase?.foto && typeof viajeBase.foto === 'string' && viajeBase.foto.trim() ? viajeBase.foto : null));
  const isBusy = isSaving || isDeleting || isProcessingImage;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        style={styles.expandedOverlay}
      >
        <div style={styles.expandedHeader(fotoMostrada)}>
          <div style={styles.fotoOverlay} />

          <div style={styles.navBar}>
            <button onClick={onClose} style={styles.iconBtn(isBusy)} disabled={isBusy}><ArrowLeft size={24} /></button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {!modoEdicion ? (
                <>
                  {!isSharedTrip && (
                    <button onClick={eliminarEsteViaje} style={styles.secondaryBtn(isBusy)} disabled={isBusy}>
                      {isDeleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} color="#ff6b6b" />}
                    </button>
                  )}
                  {!isSharedTrip && (
                    <button onClick={iniciarEdicion} style={styles.primaryBtn(false, isBusy)} disabled={isBusy}>
                      <Edit3 size={16} /> Editar
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => setModoEdicion(false)} style={styles.secondaryBtn(isBusy)} disabled={isBusy}><X size={16} /></button>
                  <button onClick={guardarCambios} style={styles.primaryBtn(true, isBusy)} disabled={isBusy}>
                    {isBusy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                    {isProcessingImage ? 'Optimizando...' : (isSaving ? 'Guardando...' : 'Guardar')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.headerContent}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {data.banderas && data.banderas.length > 0 ? (
                data.banderas.map((b, i) => (
                  <img
                    key={i}
                    src={b}
                    alt="flag"
                    style={{
                      width: '40px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}
                  />
                ))
              ) : (
                <span style={styles.flagIcon}>viaje</span>
              )}
            </div>

            {modoEdicion ? (
              <div style={styles.editHeaderStack}>
                <input
                  style={styles.titleInput}
                  value={formTemp.titulo || ''}
                  onChange={(e) => setFormTemp({ ...formTemp, titulo: e.target.value })}
                  placeholder="Titulo del viaje"
                />
                <div style={styles.imageActionsRow}>
                  <label style={styles.imageReplaceBtn(isProcessingImage)}>
                    <Camera size={14} />
                    {isProcessingImage ? 'Optimizando...' : 'Reemplazar portada'}
                    <input
                      type="file"
                      hidden
                      onChange={handleReplaceImage}
                      accept="image/jpeg,image/png"
                      disabled={isProcessingImage}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <h1 style={styles.titleDisplay}>
                {data.titulo || viajeBase?.nombreEspanol || ''}
              </h1>
            )}

            <div style={styles.metaBadge}>
              <Calendar size={14} /> {data.fechaInicio}{' '}
              {data.fechaFin && data.fechaFin !== data.fechaInicio
                ? ` - ${data.fechaFin}`
                : ''}
            </div>

            {isSharedTrip && (
              <div
                data-testid="visor-shared-badge"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(99,102,241,0.25)', padding: '6px 14px',
                  borderRadius: 8, color: '#e0e7ff', fontSize: '0.85rem',
                  fontWeight: 600, backdropFilter: 'blur(5px)', marginTop: 6
                }}
              >
                🤝 Compartido por {ownerDisplayName || '…'}
              </div>
            )}

            {/* Trip summary (presupuesto, vibe, companions, highlights) */}
            <div data-testid="visor-storytelling" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {data.presupuesto && (
                  <span data-testid="visor-presupuesto" style={{ padding: '6px 10px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>{data.presupuesto}</span>
                )}
                {(data.vibe || []).map((v, i) => (
                  <span key={i} style={{ padding: '6px 10px', borderRadius: 16, background: '#fff7ed', border: '1px solid #fce6c6', fontSize: '0.8rem' }}>{v}</span>
                ))}

                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                  {(data.companions || []).slice(0,4).map((c, idx) => (
                    <div key={idx} title={c.name} style={{ width: 28, height: 28, borderRadius: 14, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}>{(c.name || 'U').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                  ))}
                  {(data.companions || []).length > 4 && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>+{(data.companions || []).length - 4}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {data.highlights?.topFood && <div style={{ background: '#ffffff', border: '1px solid #e6edf3', padding: '8px 12px', borderRadius: 10 }}>🍽️ {data.highlights.topFood}</div>}
                {data.highlights?.topView && <div style={{ background: '#ffffff', border: '1px solid #e6edf3', padding: '8px 12px', borderRadius: 10 }}>👀 {data.highlights.topView}</div>}
                {data.highlights?.topTip && <div style={{ background: '#ffffff', border: '1px solid #e6edf3', padding: '8px 12px', borderRadius: 10 }}>💡 {data.highlights.topTip}</div>}
              </div>
            </div>

            {!modoEdicion && fotoMostrada && data.fotoCredito && (
              <a
                href={`${data.fotoCredito.link}?utm_source=keeptrip&utm_medium=referral`}
                target="_blank"
                rel="noreferrer"
                style={styles.creditLink}
              >
                <Camera size={12} /> Foto por {data.fotoCredito.nombre} / Pexels
              </a>
            )}
          </div>
        </div>

        <div style={styles.bodyContent}>
          <div style={styles.mainColumn}>
            <h3 style={styles.sectionTitle}>Bitacora</h3>
            {modoEdicion ? (
              <textarea
                style={styles.textArea}
                value={formTemp.texto || ''}
                onChange={(e) => setFormTemp({ ...formTemp, texto: e.target.value })}
                placeholder="Escribe aqui tu relato..."
              />
            ) : (
              <p style={styles.readText}>{data.texto || 'Sin relato aun...'}</p>
            )}

            {/* Galería de fotos */}
            <div style={{ marginTop: '32px' }}>
              <div style={styles.galleryHeaderRow}>
                <h3 style={styles.sectionTitle}>Galería de fotos</h3>
                <button
                  type="button"
                  style={styles.galleryToggleBtn(showGalleryTools)}
                  onClick={() => setShowGalleryTools((prev) => !prev)}
                >
                  {showGalleryTools ? 'Ocultar edicion' : 'Editar galeria'}
                </button>
              </div>
              <p style={styles.gallerySubtitle}>Tus recuerdos, listos para contar la historia.</p>
              <GalleryGrid 
                fotos={galeria.fotos} 
                fotosSubiendo={fotosSubiendo}
                onReintentarFoto={(fotoTempId) => reintentarFoto(viajeId, fotoTempId)}
                isMobile={isMobile} 
              />
              {showGalleryTools && galeria.fotos.length > 0 && (
                <div style={styles.galleryManageBlock}>
                  {galeria.fotos.map((f) => (
                    <div key={f.id} style={styles.galleryManageCard(f.esPortada)}>
                      <img src={f.url} alt={f.caption || 'foto'} style={styles.galleryManageImg} />
                      <input
                        type="text"
                        value={captionDrafts[f.id] ?? (f.caption || '')}
                        onChange={(e) => handleCaptionChange(f.id, e.target.value)}
                        onBlur={() => handleCaptionSave(f)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        placeholder="Agregar caption..."
                        style={styles.captionInput}
                      />
                      <div style={styles.galleryActionsRow}>
                        <button
                          type="button"
                          style={styles.galleryActionBtn(f.esPortada)}
                          onClick={() => handleSetPortadaExistente(f.id)}
                          disabled={isBusy}
                          title="Marcar como portada"
                          aria-label="Marcar como portada"
                        >
                          <Star size={14} />
                          {f.esPortada ? 'Portada' : 'Hacer portada'}
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
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '40px' }}>
              <h3 style={styles.sectionTitle}>Ruta</h3>
              <MiniMapaRuta paradas={paradas} />
            </div>
          </div>

          <div style={styles.sideColumn}>
            <h3 style={styles.sectionTitle}>Itinerario</h3>
            {modoEdicion ? (
              <CityManager paradas={paradas} setParadas={setParadas} />
            ) : (
              <div style={styles.timeline}>
                {paradas.map((p, i) => (
                  <div key={i} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    <div style={styles.stopCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '1rem', color: COLORS.charcoalBlue }}>{p.nombre}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.fecha}</span>
                      </div>
                      {p.clima && (
                        <div style={styles.weatherNote}>
                          {getClimaTexto(p.clima.desc, p.clima.max)}
                          <span style={styles.verifiedBadge}>Historico</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {paradas.length === 0 && <p style={styles.emptyState}>No hay paradas registradas.</p>}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default VisorViaje;
