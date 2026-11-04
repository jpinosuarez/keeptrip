import { cn } from '@shared/lib/utils/cn';
import React, { useEffect, useRef } from 'react';
import { Star, Trash2, MapPin } from 'lucide-react';
import { GalleryUploader } from '@shared/ui/components/GalleryUploader';

const ParadaSelect = ({ t, value, paradas = [], onChange, disabled }) => (
  <label className="flex items-center gap-1 text-[0.72rem] font-bold text-textSecondary">
    <MapPin size={13} />
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className="min-h-[40px] rounded-md border border-border bg-background px-1.5 py-1 text-[0.72rem] font-semibold text-textPrimary outline-none focus:border-atomicTangerine max-w-full"
    >
      <option value="">{t('gallery.paradaUnassigned', 'Sin asignar')}</option>
      {paradas.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  </label>
);

const EdicionGallerySection = ({
  t,
  files = [],
  onFilesChange,
  portadaIndex = 0,
  onPortadaChange,
  isBusy,
  galeria = { fotos: [], uploading: false },
  captionDrafts = {},
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
  onAssignParada,
  paradas = [],
  draftTags = {},
  onDraftTagChange,
  portadaUrl,
  isReadOnlyMode = false,
  maxFiles = 15,
}) => {
  const prevFotosCount = useRef(galeria.fotos.length);
  useEffect(() => {
    if (
      galeria.fotos.length === 1 &&
      prevFotosCount.current === 0 &&
      galeria.fotos[0]?.url &&
      !portadaUrl
    ) {
      onPortadaChange?.(galeria.fotos[0].url);
    }
    prevFotosCount.current = galeria.fotos.length;
  }, [galeria.fotos.length, galeria.fotos, portadaUrl, onPortadaChange]);

  return (
    <div className="flex flex-col gap-3 bg-background p-4 rounded-lg border border-border">
      <label className="text-[0.78rem] font-extrabold text-textSecondary uppercase tracking-[0.5px] flex items-center gap-1.5">
        {t('labels.gallery')}
      </label>

      {/* Saved / network photos with dual-entry assignment */}
      {galeria.fotos.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
          {galeria.fotos.map((f) => (
            <div
              key={f.id}
              className={cn(
                'border rounded-sm overflow-hidden bg-surface flex flex-col gap-2 p-2 transition-all',
                f.esPortada ? 'border-atomicTangerine shadow-md' : 'border-border shadow-sm'
              )}
            >
              <img src={f.url} alt={f.caption || t('labels.gallery')} loading="lazy" className="w-full h-[120px] object-cover rounded-sm" />
              {onCaptionChange && (
                <input
                  type="text"
                  value={captionDrafts[f.id] ?? (f.caption || '')}
                  onChange={(e) => onCaptionChange(f.id, e.target.value)}
                  onBlur={() => !isReadOnlyMode && onCaptionSave?.(f)}
                  onKeyDown={(e) => e.key === 'Enter' && !isReadOnlyMode && e.currentTarget.blur()}
                  placeholder={t('labels.captionPlaceholder')}
                  className="w-full border border-border rounded-sm px-2.5 py-2 text-[0.85rem] text-textPrimary outline-none bg-background transition-all focus:border-atomicTangerine"
                  maxLength={200}
                  disabled={isReadOnlyMode}
                />
              )}
              <ParadaSelect
                t={t}
                value={f.paradaId}
                paradas={paradas}
                disabled={isBusy || isReadOnlyMode}
                onChange={(paradaId) => onAssignParada?.(f, paradaId)}
              />
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  className={cn(
                    'border rounded-full px-2.5 py-1.5 text-[0.72rem] font-bold inline-flex items-center gap-1 cursor-pointer transition-all',
                    f.esPortada ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine' : 'border-border bg-surface text-textPrimary'
                  )}
                  onClick={() => onSetPortadaExistente?.(f.id)}
                  disabled={isBusy || isReadOnlyMode}
                  aria-label={t('gallery.setAsCover', 'Set as cover')}
                >
                  <Star size={13} fill={f.esPortada ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className="border border-border bg-surface text-danger rounded-full px-2.5 py-1.5 text-[0.72rem] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                  onClick={() => onEliminarFoto?.(f.id)}
                  disabled={isBusy || isReadOnlyMode}
                  aria-label={t('gallery.deletePhoto')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft uploader: works before the trip exists (?new=true) */}
      <GalleryUploader
        files={files}
        onChange={onFilesChange}
        portadaIndex={portadaIndex}
        onPortadaChange={onPortadaChange}
        maxFiles={maxFiles}
        disabled={isBusy || galeria.uploading || isReadOnlyMode}
      />

      {/* Per-draft stop tagging */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 border border-border rounded-md px-2.5 py-2">
              <span className="text-[0.78rem] font-semibold text-textPrimary truncate">{file.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                {index === portadaIndex && (
                  <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-atomicTangerine"><Star size={12} fill="currentColor" /> {t('labels.portada')}</span>
                )}
                <ParadaSelect
                  t={t}
                  value={draftTags[index]?.paradaId}
                  paradas={paradas}
                  disabled={isReadOnlyMode}
                  onChange={(paradaId) => onDraftTagChange?.(index, paradaId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <span className="text-[0.8rem] font-semibold text-mutedTeal">
        {t('gallery.draftNotice', 'Tus fotos se subirán al guardar el viaje.')}
      </span>
      {galeria.uploading && (
        <span className="text-[0.8rem] font-semibold text-mutedTeal">{t('toast.uploadingPhotos')}</span>
      )}
    </div>
  );
};

export default EdicionGallerySection;
