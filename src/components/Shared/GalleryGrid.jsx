import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, GLASS, TRANSITIONS } from '../../theme';

/**
 * Hook para lazy loading de imágenes con Intersection Observer
 */
function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

/**
 * Componente de imagen con lazy loading
 */
function LazyImage({ src, alt, onClick, isPortada }) {
  const [ref, isVisible] = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div ref={ref} style={styles.imageContainer(isPortada)} onClick={onClick}>
      {isVisible ? (
        <>
          {!isLoaded && <div style={styles.imagePlaceholder} />}
          <img
            src={src}
            alt={alt}
            style={{ ...styles.image, opacity: isLoaded ? 1 : 0 }}
            onLoad={() => setIsLoaded(true)}
          />
          {isPortada && (
            <div style={styles.portadaBadge}>
              <Star size={12} fill="white" color="white" />
              <span>Portada</span>
            </div>
          )}
        </>
      ) : (
        <div style={styles.imagePlaceholder} />
      )}
    </div>
  );
}

/**
 * Componente para mostrar foto en proceso de subida
 * @param {Object} props
 * @param {string} props.preview - URL de preview (base64)
 * @param {'pending'|'uploading'|'success'|'error'} props.status
 * @param {boolean} props.esPortada
 * @param {string} props.error - Mensaje de error si falló
 * @param {Function} props.onRetry - Callback para reintentar
 */
function UploadingImage({ preview, status, esPortada, error, onRetry }) {
  const isLoading = status === 'pending' || status === 'uploading';
  const isFailed = status === 'error';
  const isSuccess = status === 'success';

  return (
    <div style={styles.imageContainer(esPortada)}>
      {/* Preview de la imagen */}
      <img
        src={preview}
        alt="Subiendo..."
        style={{ 
          ...styles.image, 
          opacity: isFailed ? 0.4 : 0.7,
          filter: isLoading ? 'blur(2px)' : 'none'
        }}
      />

      {/* Overlay de carga */}
      {isLoading && (
        <div style={styles.uploadOverlay}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={32} color="white" />
          </motion.div>
          <span style={styles.uploadText}>
            {status === 'pending' ? 'En cola...' : 'Subiendo...'}
          </span>
        </div>
      )}

      {/* Overlay de error */}
      {isFailed && (
        <div style={styles.errorOverlay}>
          <AlertCircle size={28} color={COLORS.error || '#ff4444'} />
          <span style={styles.errorText}>{error || 'Error'}</span>
          {onRetry && (
            <button style={styles.retryBtn} onClick={onRetry}>
              <RefreshCw size={16} />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      )}

      {/* Check de éxito (breve) */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 1, scale: 1.2 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={styles.successOverlay}
        >
          <Star size={32} fill="white" color="white" />
        </motion.div>
      )}

      {/* Badge de portada */}
      {esPortada && (
        <div style={styles.portadaBadge}>
          <Star size={12} fill="white" color="white" />
          <span>Portada</span>
        </div>
      )}
    </div>
  );
}

/**
 * Lightbox/Modal para ver foto en fullscreen
 */
function Lightbox({ foto, onClose, onPrev, onNext, hasNext, hasPrev, totalFotos, currentIndex }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onPrev, onNext, hasNext, hasPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.lightboxOverlay}
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button style={styles.closeBtn} onClick={onClose}>
        <X size={24} />
      </button>

      {/* Contador */}
      <div style={styles.counter}>
        {currentIndex + 1} / {totalFotos}
      </div>

      {/* Navegación previa */}
      {hasPrev && (
        <button
          style={{ ...styles.navBtn, left: '20px' }}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Navegación siguiente */}
      {hasNext && (
        <button
          style={{ ...styles.navBtn, right: '20px' }}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Imagen */}
      <motion.div
        key={foto.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={styles.lightboxContent}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={foto.url} alt={foto.caption || 'Foto'} style={styles.lightboxImage} />
        
        {foto.caption && (
          <div style={styles.captionBox}>
            <p style={styles.captionText}>{foto.caption}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Grid de galería de fotos con lazy loading y lightbox
 * 
 * @param {Object} props
 * @param {Array} props.fotos - Array de objetos foto {id, url, caption, esPortada}
 * @param {Array} props.fotosSubiendo - Array de fotos en proceso de subida
 * @param {Function} props.onReintentarFoto - Callback para reintentar foto fallida
 * @param {boolean} props.isMobile - Si es vista móvil
 */
export function GalleryGrid({ fotos = [], fotosSubiendo = [], onReintentarFoto, isMobile = false }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Solo fotos guardadas son clickeables para lightbox
  const handleOpenLightbox = (index) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < fotos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Filtrar fotos que están subiendo (no completadas)
  const fotosEnProceso = fotosSubiendo.filter(f => f.status !== 'success');
  const totalVisible = fotos.length + fotosEnProceso.length;

  if (totalVisible === 0) {
    return (
      <div style={styles.emptyState}>
        <Star size={48} color={COLORS.textSecondary} />
        <p style={styles.emptyText}>Aun no hay fotos en la galeria</p>
        <p style={styles.emptySubtext}>Agrega momentos para darle vida a esta historia.</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.grid(isMobile)}>
        {/* Fotos guardadas */}
        {fotos.map((foto, index) => (
          <LazyImage
            key={foto.id}
            src={foto.url}
            alt={foto.caption || `Foto ${index + 1}`}
            isPortada={foto.esPortada}
            onClick={() => handleOpenLightbox(index)}
          />
        ))}

        {/* Fotos en proceso de subida */}
        {fotosEnProceso.map((foto) => (
          <UploadingImage
            key={foto.id}
            preview={foto.preview}
            status={foto.status}
            esPortada={foto.esPortada}
            error={foto.error}
            onRetry={foto.status === 'error' && onReintentarFoto 
              ? () => onReintentarFoto(foto.id) 
              : undefined}
          />
        ))}
      </div>

      {/* Lightbox - solo para fotos ya guardadas */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <Lightbox
            foto={fotos[selectedIndex]}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < fotos.length - 1}
            totalFotos={fotos.length}
            currentIndex={selectedIndex}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  grid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile 
      ? 'repeat(auto-fill, minmax(120px, 1fr))' 
      : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: isMobile ? '8px' : '16px',
    width: '100%',
  }),
  imageContainer: (isPortada) => ({
    position: 'relative',
    width: '100%',
    paddingBottom: '100%', // Aspecto cuadrado
    overflow: 'hidden',
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
    border: isPortada ? `3px solid ${COLORS.atomicTangerine}` : 'none',
    boxShadow: isPortada ? SHADOWS.md : SHADOWS.sm,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: SHADOWS.lg,
    },
  }),
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  portadaBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: SHADOWS.sm,
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: RADIUS.md,
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: '16px',
  },
  emptySubtext: {
    marginTop: '6px',
    fontSize: '13px',
    color: COLORS.textSecondary,
  },
  
  // Lightbox styles
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  lightboxContent: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: RADIUS.md,
  },
  captionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '16px 24px',
    borderRadius: RADIUS.md,
    maxWidth: '600px',
  },
  captionText: {
    fontSize: '16px',
    color: COLORS.textPrimary,
    margin: 0,
    lineHeight: '1.6',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '48px',
    height: '48px',
    border: 'none',
    borderRadius: RADIUS.full,
    ...GLASS.medium,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10001,
  },
  counter: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    ...GLASS.medium,
    color: 'white',
    padding: '8px 16px',
    borderRadius: RADIUS.full,
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 10001,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '56px',
    height: '56px',
    border: 'none',
    borderRadius: RADIUS.full,
    ...GLASS.medium,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10001,
  },

  // Upload overlay styles
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backdropFilter: 'blur(2px)',
  },
  uploadText: {
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '11px',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: RADIUS.full,
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    marginTop: '4px',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Animación de pulse para placeholders
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    [style*="imageContainer"]:hover {
      transform: scale(1.05) !important;
      box-shadow: ${SHADOWS.lg} !important;
    }
  `;
  document.head.appendChild(style);
}
