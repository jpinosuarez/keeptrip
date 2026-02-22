import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '../../theme';
import { useToast } from '../../context/ToastContext';

/**
 * Componente para subir múltiples fotos a la galería de un viaje
 * Soporta drag-and-drop, preview y selección de portada
 * 
 * @param {Object} props
 * @param {Array<File>} props.files - Array de archivos seleccionados
 * @param {Function} props.onChange - Callback cuando cambian los archivos
 * @param {number} props.maxFiles - Máximo de fotos permitidas (default: 10)
 * @param {number} props.portadaIndex - Índice de la foto que será portada
 * @param {Function} props.onPortadaChange - Callback cuando cambia la portada
 * @param {boolean} props.disabled - Si está deshabilitado
 */
export function GalleryUploader({ 
  files = [], 
  onChange, 
  maxFiles = 10,
  portadaIndex = 0,
  onPortadaChange,
  disabled = false,
  isMobile = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const { pushToast } = useToast();

  // Previews se generan localmente al seleccionar archivos (handleFileSelect).
  // No necesitamos un efecto que sincronice previews desde `files` — el padre
  // controla el array `files` y las previews se crean/limpian al usar `onChange`.


  const handleFileSelect = (newFiles) => {
    if (disabled) return;

    const incoming = Array.from(newFiles);
    const validFiles = [];
    let invalidTypeCount = 0;
    let invalidSizeCount = 0;

    incoming.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidFormat = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage || !isValidFormat) {
        invalidTypeCount += 1;
        return;
      }

      if (!isValidSize) {
        invalidSizeCount += 1;
        return;
      }

      validFiles.push(file);
    });

    const remainingSlots = Math.max(0, maxFiles - files.length);
    const acceptedFiles = validFiles.slice(0, remainingSlots);
    const skippedByLimit = Math.max(0, validFiles.length - acceptedFiles.length);

    if (invalidTypeCount > 0) {
      pushToast(`Se descartaron ${invalidTypeCount} archivo(s) por formato.`, 'error');
    }

    if (invalidSizeCount > 0) {
      pushToast(`Se descartaron ${invalidSizeCount} archivo(s) por tamano (max 10MB).`, 'error');
    }

    if (skippedByLimit > 0) {
      pushToast(`Solo puedes subir ${maxFiles} fotos. Se omitieron ${skippedByLimit}.`, 'info');
    }

    if (acceptedFiles.length === 0) return;

    const updatedFiles = [...files, ...acceptedFiles];
    onChange(updatedFiles);

    // Generar previews
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { file, url: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onChange(updatedFiles);

    setPreviews(prev => prev.filter((_, i) => i !== index));

    // Ajustar portada si se eliminó
    if (index === portadaIndex && updatedFiles.length > 0) {
      onPortadaChange?.(0);
    } else if (index < portadaIndex) {
      onPortadaChange?.(portadaIndex - 1);
    }
  };

  const handleSetPortada = (index) => {
    onPortadaChange?.(index);
  };

  const getPreviewUrl = (file) => {
    const preview = previews.find(p => p.file === file);
    return preview?.url || null;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={styles.container}>
      {/* Zona de drop */}
      {files.length < maxFiles && (
        <div
          style={styles.dropZone(isDragging, disabled)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload size={32} color={COLORS.textSecondary} />
          <p style={styles.dropText}>
            {isDragging
              ? 'Suelta las fotos aquí'
              : 'Arrastra fotos o haz clic para seleccionar'}
          </p>
          <p style={styles.dropSubtext}>
            JPG o PNG • Máximo {maxFiles} fotos • Hasta 10MB c/u
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Grid de previews */}
      {files.length > 0 && (
        <div style={styles.previewGrid}>
          {files.map((file, index) => {
            const previewUrl = getPreviewUrl(file);
            const isPortada = index === portadaIndex;

            return (
              <div key={`${file.name}-${index}`} style={styles.previewCard(isPortada)}>
                {/* Preview de imagen */}
                <div style={styles.previewImage}>
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} style={styles.img} />
                  ) : (
                    <div style={styles.loadingPlaceholder}>
                      <ImageIcon size={24} color={COLORS.textSecondary} />
                    </div>
                  )}

                  {/* Badge de portada */}
                  {isPortada && (
                    <div style={styles.portadaBadge}>
                      <Star size={14} fill="white" color="white" />
                      <span style={styles.portadaText}>Portada</span>
                    </div>
                  )}

                  {/* Overlay con acciones */}
                  <div style={styles.overlay(isMobile)}>
                    {!isPortada && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => handleSetPortada(index)}
                        title="Marcar como portada"
                        aria-label="Marcar como portada"
                        disabled={disabled}
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      style={styles.actionBtn}
                      onClick={() => handleRemoveFile(index)}
                      title="Eliminar"
                      aria-label="Eliminar"
                      disabled={disabled}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Info de archivo */}
                <div style={styles.fileInfo}>
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileSize}>{formatFileSize(file.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contador */}
      {files.length > 0 && (
        <div style={styles.footer}>
          <p style={styles.counter}>
            {files.length} / {maxFiles} fotos seleccionadas
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  dropZone: (isDragging, disabled) => ({
    border: `2px dashed ${isDragging ? COLORS.atomicTangerine : COLORS.border}`,
    borderRadius: RADIUS.md,
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: isDragging ? `${COLORS.atomicTangerine}10` : COLORS.background,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: TRANSITIONS.normal,
    opacity: disabled ? 0.5 : 1,
  }),
  dropText: {
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.textPrimary,
    margin: '12px 0 4px',
  },
  dropSubtext: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    margin: 0,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  previewCard: (isPortada) => ({
    position: 'relative',
    border: `2px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    boxShadow: isPortada ? SHADOWS.md : SHADOWS.sm,
    transition: TRANSITIONS.fast,
  }),
  previewImage: {
    position: 'relative',
    width: '100%',
    height: '140px',
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loadingPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  overlay: (isMobile) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '8px',
    display: 'flex',
    gap: '4px',
    opacity: 1,
    transition: TRANSITIONS.fast,
  }),
  actionBtn: {
    width: '30px',
    height: '30px',
    border: 'none',
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: COLORS.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
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
    fontSize: '11px',
    fontWeight: '700',
    boxShadow: SHADOWS.sm,
  },
  portadaText: {
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fileInfo: {
    padding: '8px',
  },
  fileName: {
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.textPrimary,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '11px',
    color: COLORS.textSecondary,
    margin: '2px 0 0',
  },
  footer: {
    marginTop: '12px',
    textAlign: 'center',
  },
  counter: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.textSecondary,
    margin: 0,
  },
};

// Acciones visibles por defecto para accesibilidad y soporte mobile
