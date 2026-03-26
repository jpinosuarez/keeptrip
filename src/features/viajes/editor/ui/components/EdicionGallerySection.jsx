import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { GalleryUploader } from '@shared/ui/components/GalleryUploader';

import { useEffect, useRef } from 'react';

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
  captionDrafts,
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
  portadaUrl, // NUEVO: url actual de portada
}) => {
  // Auto-cover: si no hay portada y se sube la primera foto, asignarla automáticamente
  const prevFotosCount = useRef(galeria.fotos.length);
  useEffect(() => {
    if (
      galeria.fotos.length === 1 &&
      prevFotosCount.current === 0 &&
      galeria.fotos[0]?.url &&
      !portadaUrl
    ) {
      onPortadaChange(galeria.fotos[0].url);
    }
    prevFotosCount.current = galeria.fotos.length;
  }, [galeria.fotos.length, galeria.fotos, portadaUrl, onPortadaChange]);

  return (
    <div style={styles.section}>
      <label style={styles.label}>{t('labels.gallery')}</label>

      {/* Fotos guardadas — PRIMERO, para que el usuario vea su galería antes de añadir más */}
      {galeria.fotos.length > 0 && (
        <div style={styles.galleryManageBlock}>
          <div style={styles.galleryManageGrid}>
            {galeria.fotos.map((f) => (
              <div key={f.id} style={styles.galleryManageCard(f.esPortada)}>
                <img src={f.url} alt={f.caption || t('labels.gallery')} style={styles.galleryManageImg} />
                <input
                  type="text"
                  value={captionDrafts[f.id] ?? (f.caption || '')}
                  onChange={(e) => onCaptionChange(f.id, e.target.value)}
                  onBlur={() => onCaptionSave(f)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder={t('labels.captionPlaceholder')}
                  style={styles.captionInput}
                  aria-label={t('labels.captionPlaceholder')}
                  maxLength={200}
                />
                <div style={styles.galleryActionsRow}>
                  <button
                    type="button"
                    style={styles.galleryActionBtn(f.esPortada)}
                    onClick={() => onSetPortadaExistente(f.id)}
                    disabled={isBusy}
                    aria-label={f.esPortada ? t('gallery.currentCover') : t('gallery.setCover')}
                  >
                    {/* fill sólido cuando es portada, outline cuando no — único indicador necesario */}
                    <Star size={14} fill={f.esPortada ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    style={styles.galleryDangerBtn}
                    onClick={() => onEliminarFoto(f.id)}
                    disabled={isBusy}
                    aria-label={t('gallery.deletePhoto')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {/* portadaBadgeMini eliminado: el borde naranja + estrella sólida ya comunican portada */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona de subida de fotos nuevas — siempre disponible para agregar más */}
      <GalleryUploader
        files={files}
        onChange={onFilesChange}
        portadaIndex={portadaIndex}
        onPortadaChange={onPortadaChange}
        maxFiles={1}
        disabled={isBusy || galeria.uploading}
        isMobile={isMobile}
      />
      <span style={styles.inlineInfo}>
        {t('gallery.coverOnlyNotice', 'Por ahora, solo permitimos 1 foto de portada para tu viaje.')}
      </span>
      {galeria.uploading && (
        <span style={styles.inlineInfo}>{t('toast.uploadingPhotos')}</span>
      )}
    </div>
  );
};

export default EdicionGallerySection;
