import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { GalleryUploader } from '@shared/ui/components/GalleryUploader';

const EdicionGallerySection = ({
  styles,
  t,
  files,
  onFilesChange,
  portadaIndex,
  onPortadaChange,
  isBusy,
  isMobile,
  galeria,
  esBorrador,
  viajeId,
  captionDrafts,
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
}) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>{t('labels.gallery')}</label>
      <GalleryUploader
        files={files}
        onChange={onFilesChange}
        portadaIndex={portadaIndex}
        onPortadaChange={onPortadaChange}
        maxFiles={10}
        disabled={isBusy || galeria.uploading}
        isMobile={isMobile}
      />
      {galeria.uploading && <span style={styles.inlineInfo}>Subiendo fotos...</span>}

      {!esBorrador && viajeId && galeria.fotos.length > 0 && (
        <div style={styles.galleryManageBlock}>
          <div style={styles.galleryManageGrid}>
            {galeria.fotos.map((f) => (
              <div key={f.id} style={styles.galleryManageCard(f.esPortada)}>
                <img src={f.url} alt={f.caption || 'foto'} style={styles.galleryManageImg} />
                <input
                  type="text"
                  value={captionDrafts[f.id] ?? (f.caption || '')}
                  onChange={(e) => onCaptionChange(f.id, e.target.value)}
                  onBlur={() => onCaptionSave(f)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder="Caption"
                  style={styles.captionInput}
                  aria-label="Editar caption"
                />
                <div style={styles.galleryActionsRow}>
                  <button
                    type="button"
                    style={styles.galleryActionBtn(f.esPortada)}
                    onClick={() => onSetPortadaExistente(f.id)}
                    disabled={isBusy}
                    title="Marcar como portada"
                    aria-label={f.esPortada ? 'Imagen actual de portada' : 'Marcar como portada'}
                  >
                    <Star size={14} />
                  </button>
                  <button
                    type="button"
                    style={styles.galleryDangerBtn}
                    onClick={() => onEliminarFoto(f.id)}
                    disabled={isBusy}
                    title="Eliminar foto"
                    aria-label="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {f.esPortada && <span style={styles.portadaBadgeMini}>{t('labels.portada')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdicionGallerySection;
