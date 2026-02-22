import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit3, Calendar, Check, X, Camera, Trash2, LoaderCircle, Star, MapPin } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { styles } from './VisorViaje.styles';
import { COLORS, RADIUS, SHADOWS, GLASS, FONTS } from '../../theme';
import CityManager from '../Shared/CityManager';
import MiniMapaRuta from '../Shared/MiniMapaRuta';
import { compressImage } from '../../utils/imageUtils';
import { useGaleriaViaje } from '../../hooks/useGaleriaViaje';
import { GalleryGrid } from '../Shared/GalleryGrid';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useActiveParada } from '../../hooks/useActiveParada';
import RouteMap from './RouteMap';
import ContextCard from './ContextCard';

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
  const [showMapModal, setShowMapModal] = useState(false);

  // Refs para IntersectionObserver en stop cards
  const paradaRefs = useRef([]);

  // Limpiar refs cuando paradas mutan (ej. salir de edición)
  useEffect(() => {
    paradaRefs.current = paradaRefs.current.slice(0, paradas.length);
  }, [paradas]);

  // Derivados del layout
  const isRouteMode = paradas.length > 1;
  const { activeIndex: activeParadaIndex, setParadaRef } = useActiveParada(
    paradaRefs,
    isRouteMode && !isMobile && !modoEdicion
  );
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

  // ========== Render helpers (reutilizados en ambos modos) ==========

  const renderBitacora = () => (
    <>
      <h3 style={styles.sectionTitle}>Bitácora</h3>
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
    </>
  );

  const renderGallery = () => (
    <div style={{ marginTop: '32px' }}>
      <div style={styles.galleryHeaderRow}>
        <h3 style={styles.sectionTitle}>Galería de fotos</h3>
        {!isSharedTrip && (
          <button
            type="button"
            style={styles.galleryToggleBtn(showGalleryTools)}
            onClick={() => setShowGalleryTools((prev) => !prev)}
          >
            {showGalleryTools ? 'Ocultar edicion' : 'Editar galeria'}
          </button>
        )}
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
  );

  const renderEnrichedStopCard = (p, i) => (
    <div
      key={p.id || i}
      ref={(node) => setParadaRef(i, node)}
      style={{
        ...styles.enrichedStopCard,
        ...(activeParadaIndex === i && !isMobile ? styles.enrichedStopCardActive : {}),
      }}
    >
      <div style={styles.stopCardHeader}>
        <span style={styles.stopCardName}>{p.nombre}</span>
        <span style={styles.stopCardDate}>
          {p.fechaLlegada && p.fechaSalida && p.fechaLlegada !== p.fechaSalida
            ? `${p.fechaLlegada} → ${p.fechaSalida}`
            : p.fechaLlegada || p.fecha}
        </span>
      </div>
      {p.transporte && (
        <span style={styles.transportBadge}>{p.transporte}</span>
      )}
      {p.notaCorta && (
        <p style={styles.notaCorta}>{p.notaCorta}</p>
      )}
      {p.clima && (
        <div style={styles.weatherNote}>
          {getClimaTexto(p.clima.desc, p.clima.max)}
          <span style={styles.verifiedBadge}>Historico</span>
        </div>
      )}
    </div>
  );

  const renderItinerario = () => (
    <>
      <h3 style={styles.sectionTitle}>Itinerario</h3>
      {modoEdicion ? (
        <CityManager paradas={paradas} setParadas={setParadas} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paradas.map((p, i) => renderEnrichedStopCard(p, i))}
        </div>
      )}
    </>
  );

  // ========== Body Layout Render ==========

  const renderRouteBody = () => {
    if (isMobile) {
      return (
        <>
          <div style={styles.mobileColumn}>
            {renderItinerario()}
            <div style={{ marginTop: '32px' }}>{renderBitacora()}</div>
            {renderGallery()}
          </div>

          {/* FAB para abrir mapa */}
          <button
            type="button"
            style={styles.fab}
            onClick={() => setShowMapModal(true)}
            aria-label="Ver mapa de ruta"
          >
            <MapPin size={24} />
          </button>

          {/* Modal fullscreen mapa — montaje condicional estricto para evitar bug de canvas 0px */}
          {showMapModal && (
            <div style={styles.mapModal}>
              <button
                type="button"
                style={styles.mapModalClose}
                onClick={() => setShowMapModal(false)}
                aria-label="Cerrar mapa"
              >
                <X size={20} />
              </button>
              <RouteMap paradas={paradas} activeIndex={activeParadaIndex} isModal />
            </div>
          )}
        </>
      );
    }

    // Desktop: split layout
    return (
      <div style={styles.routeLayout}>
        <div style={styles.scrollColumn}>
          {renderItinerario()}
          <div style={{ marginTop: '32px' }}>{renderBitacora()}</div>
          {renderGallery()}
        </div>
        <div style={styles.mapColumn}>
          <RouteMap paradas={paradas} activeIndex={activeParadaIndex} />
        </div>
      </div>
    );
  };

  const renderDestinoBody = () => {
    const hasHighlights = data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip;
    const hasCompanions = (data.companions || []).length > 0;
    const hasVibe = (data.vibe || []).length > 0;
    const hasContextCards = hasHighlights || hasCompanions || hasVibe || data.presupuesto || paradas.length === 1;

    return (
      <div style={styles.destinoBody}>
        {/* Context Grid Bento — storytelling movido del header aquí */}
        {hasContextCards && (
          <div style={styles.contextGrid}>
            {data.highlights?.topFood && (
              <ContextCard icon="🍽️" label="Top Food" value={data.highlights.topFood} />
            )}
            {data.highlights?.topView && (
              <ContextCard icon="👀" label="Top View" value={data.highlights.topView} />
            )}
            {data.highlights?.topTip && (
              <ContextCard icon="💡" label="Top Tip" value={data.highlights.topTip} />
            )}
            {data.presupuesto && (
              <ContextCard icon="💰" label="Presupuesto" value={data.presupuesto} />
            )}
            {hasVibe && (
              <ContextCard icon="✨" label="Vibe" value={(data.vibe || []).join(', ')} />
            )}
            {hasCompanions && (
              <ContextCard icon="👥" label="Compañeros">
                <div style={styles.companionsGrid}>
                  {(data.companions || []).map((c, idx) => (
                    <div key={idx} title={c.name} style={styles.companionAvatar}>
                      {(c.name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('')}
                    </div>
                  ))}
                </div>
              </ContextCard>
            )}
            {paradas.length === 1 && (
              <ContextCard icon="📍" label="Ubicación" style={{ gridColumn: 'span 2' }}>
                <MiniMapaRuta paradas={paradas} />
              </ContextCard>
            )}
          </div>
        )}

        {renderBitacora()}
        {renderGallery()}

        {/* CityManager en modo edición (Destino no muestra itinerario en lectura) */}
        {modoEdicion && (
          <div style={{ marginTop: '32px' }}>
            <h3 style={styles.sectionTitle}>Itinerario</h3>
            <CityManager paradas={paradas} setParadas={setParadas} />
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        style={styles.expandedOverlay}
      >
        {/* ========== HERO INMERSIVO ========== */}
        <div style={styles.heroWrapper}>
          <div style={styles.heroImage(fotoMostrada)}>
            <div style={styles.heroGradient} />

            {/* Floating NavBar */}
            <div style={styles.navBar}>
              <button onClick={onClose} style={styles.iconBtn(isBusy)} disabled={isBusy}>
                <ArrowLeft size={22} />
              </button>

              <div style={styles.navActions}>
                {!modoEdicion ? (
                  <>
                    {!isSharedTrip && (
                      <button onClick={eliminarEsteViaje} style={styles.secondaryBtn(isBusy)} disabled={isBusy}>
                        {isDeleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} color="#ff6b6b" />}
                      </button>
                    )}
                    {!isSharedTrip && (
                      <button onClick={iniciarEdicion} style={styles.primaryBtn(false, isBusy)} disabled={isBusy}>
                        <Edit3 size={15} /> Editar
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => setModoEdicion(false)} style={styles.secondaryBtn(isBusy)} disabled={isBusy}>
                      <X size={16} />
                    </button>
                    <button onClick={guardarCambios} style={styles.primaryBtn(true, isBusy)} disabled={isBusy}>
                      {isBusy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                      {isProcessingImage ? 'Optimizando...' : (isSaving ? 'Guardando...' : 'Guardar')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Hero Content — anclado abajo */}
            {modoEdicion ? (
              <div style={styles.editOverlay}>
                <input
                  style={styles.titleInput}
                  value={formTemp.titulo || ''}
                  onChange={(e) => setFormTemp({ ...formTemp, titulo: e.target.value })}
                  placeholder="Título del viaje"
                />
                <div style={styles.editActionsRow}>
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
              <div style={styles.heroContent}>
                {/* Flags */}
                <div style={styles.flagRow}>
                  {data.banderas && data.banderas.length > 0 ? (
                    data.banderas.map((b, i) => (
                      <img key={i} src={b} alt="flag" style={styles.flagImg} />
                    ))
                  ) : (
                    <span style={styles.flagIcon}>✈️</span>
                  )}
                </div>

                {/* Título grande */}
                <h1 style={styles.titleDisplay}>
                  {data.titulo || viajeBase?.nombreEspanol || ''}
                </h1>

                {/* Meta row: fecha + shared badge */}
                <div style={styles.metaRow}>
                  <span style={styles.metaBadge}>
                    <Calendar size={13} /> {data.fechaInicio}{' '}
                    {data.fechaFin && data.fechaFin !== data.fechaInicio
                      ? ` – ${data.fechaFin}`
                      : ''}
                  </span>

                  {isSharedTrip && (
                    <span data-testid="visor-shared-badge" style={styles.sharedBadge}>
                      🤝 Compartido por {ownerDisplayName || '…'}
                    </span>
                  )}
                </div>

                {/* Storytelling — solo Modo Ruta */}
                {isRouteMode && (
                  <div data-testid="visor-storytelling">
                    <div style={styles.storytellingRow}>
                      {data.presupuesto && (
                        <span data-testid="visor-presupuesto" style={styles.storytellingChip}>
                          💰 {data.presupuesto}
                        </span>
                      )}
                      {(data.vibe || []).map((v, i) => (
                        <span key={i} style={styles.storytellingVibeChip}>{v}</span>
                      ))}
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', alignItems: 'center' }}>
                        {(data.companions || []).slice(0, 4).map((c, idx) => (
                          <div key={idx} title={c.name} style={styles.companionDot}>
                            {(c.name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('')}
                          </div>
                        ))}
                        {(data.companions || []).length > 4 && (
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                            +{(data.companions || []).length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {(data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip) && (
                      <div style={{ ...styles.storytellingRow, marginTop: '6px' }}>
                        {data.highlights?.topFood && <span style={styles.highlightTag}>🍽️ {data.highlights.topFood}</span>}
                        {data.highlights?.topView && <span style={styles.highlightTag}>👀 {data.highlights.topView}</span>}
                        {data.highlights?.topTip && <span style={styles.highlightTag}>💡 {data.highlights.topTip}</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Foto crédito */}
                {fotoMostrada && data.fotoCredito && (
                  <a
                    href={`${data.fotoCredito.link}?utm_source=keeptrip&utm_medium=referral`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.creditLink}
                  >
                    <Camera size={11} /> {data.fotoCredito.nombre} / Pexels
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========== Body: layout condicional ========== */}
        {isRouteMode ? renderRouteBody() : renderDestinoBody()}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default VisorViaje;
