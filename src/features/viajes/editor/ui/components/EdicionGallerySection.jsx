import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { GalleryUploader } from '@shared/ui/components/GalleryUploader';

import { useEffect, useRef } from 'react';

const EdicionGallerySection = ({
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
  isReadOnlyMode = false,
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
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <label className="text-[0.78rem] font-extrabold text-textSecondary uppercase tracking-[0.5px] flex items-center gap-1.5">{t('labels.gallery')}</label>

      {/* Fotos guardadas — PRIMERO, para que el usuario vea su galería antes de añadir más */}
      {galeria.fotos.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            {galeria.fotos.map((f) => (
              <div 
                key={f.id} 
                className={cn(
                  "border rounded-sm overflow-hidden bg-surface flex flex-col gap-2 p-2 transition-all",
                  f.esPortada ? "border-atomicTangerine shadow-md" : "border-border shadow-sm"
                )}
              >
                <img src={f.url} alt={f.caption || t('labels.gallery')} className="w-full h-[140px] object-cover rounded-sm" />
                <input
                  type="text"
                  value={captionDrafts[f.id] ?? (f.caption || '')}
                  onChange={(e) => onCaptionChange(f.id, e.target.value)}
                  onBlur={() => !isReadOnlyMode && onCaptionSave(f)}
                  onKeyDown={(e) => e.key === 'Enter' && !isReadOnlyMode && e.currentTarget.blur()}
                  placeholder={t('labels.captionPlaceholder')}
                  className="w-full border border-border rounded-sm px-2.5 py-2 text-[0.875rem] text-textPrimary outline-none bg-background transition-all focus:border-atomicTangerine"
                  aria-label={t('labels.captionPlaceholder')}
                  maxLength={200}
                  disabled={isReadOnlyMode}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className={cn(
                      "border rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all",
                      f.esPortada ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine" : "border-border bg-surface text-textPrimary"
                    )}
                    onClick={() => onSetPortadaExistente(f.id)}
                    disabled={isBusy || isReadOnlyMode}
                    aria-label={f.esPortada ? t('gallery.currentCover') : t('gallery.setCover')}
                  >
                    {/* fill sólido cuando es portada, outline cuando no — único indicador necesario */}
                    <Star size={14} fill={f.esPortada ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="border border-border bg-surface text-danger rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={() => onEliminarFoto(f.id)}
                    disabled={isBusy || isReadOnlyMode}
                    aria-label={t('gallery.deletePhoto')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
        disabled={isBusy || galeria.uploading || isReadOnlyMode}
        isMobile={isMobile}
      />
      <span className="text-[0.8rem] font-semibold text-mutedTeal">
        {t('gallery.coverOnlyNotice', 'Esta imagen será la foto de portada del viaje.')}
      </span>
      {galeria.uploading && (
        <span className="text-[0.8rem] font-semibold text-mutedTeal">{t('toast.uploadingPhotos')}</span>
      )}
    </div>
  );
};

export default EdicionGallerySection;
