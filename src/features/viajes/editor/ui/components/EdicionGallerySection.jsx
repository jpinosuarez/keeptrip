import { cn } from '@shared/lib/utils/cn';
import React, { useEffect, useRef, useState } from 'react';
import { Star, Trash2, MapPin, ChevronDown, Camera } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { GalleryUploader } from '@shared/ui/components/GalleryUploader';

/** Custom popover pill for assigning a photo to a stop (no native <select>). */
const StopTagPopover = ({ t, value, paradas = [], onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const selected = (paradas || []).find((p) => p.id === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center gap-1 rounded-lg bg-slate-900/60 hover:bg-slate-900/80 text-white px-2 py-1 text-[11px] font-bold transition-colors"
      >
        <MapPin size={12} className="text-[#FF6B35] shrink-0" />
        <span className="truncate">{selected?.nombre || t('editor:gallery.unassigned', 'Sin parada asignada')}</span>
        <ChevronDown size={12} className="shrink-0 ml-auto" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-white rounded-xl shadow-lg border border-slate-200 p-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange?.(null);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 shrink-0" />
              {t('editor:gallery.unassigned', 'Sin asignar')}
            </button>
            {paradas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange?.(p.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-semibold text-slate-800 hover:bg-slate-100"
              >
                {p.paisCodigo ? <CountryFlag code={p.paisCodigo} size="sm" /> : <MapPin size={12} />}
                <span className="truncate">{p.nombre}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EdicionGallerySection = ({
  t,
  files = [],
  onFilesChange,
  portadaIndex = 0,
  onPortadaChange,
  isBusy,
  galeria = { fotos: [], uploading: false },
  onSetPortadaExistente,
  onEliminarFoto,
  onAssignParada,
  paradas = [],
  draftTags = {},
  onDraftTagChange,
  defaultParadaId = null,
  portadaUrl,
  isReadOnlyMode = false,
  maxFiles = 15,
}) => {
  const prevFotosCount = useRef(galeria.fotos.length);
  useEffect(() => {
    if (galeria.fotos.length === 1 && prevFotosCount.current === 0 && galeria.fotos[0]?.url && !portadaUrl) {
      onPortadaChange?.(galeria.fotos[0].url);
    }
    prevFotosCount.current = galeria.fotos.length;
  }, [galeria.fotos.length, galeria.fotos, portadaUrl, onPortadaChange]);

  const networkPhotos = galeria.fotos || [];
  const disabled = isBusy || galeria.uploading || isReadOnlyMode;

  return (
    <div className="flex flex-col gap-3 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
        <Camera size={15} className="text-[#FF6B35]" /> {t('labels.gallery', 'Galería de fotos')}
      </h3>

      {networkPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {networkPhotos.map((f, index) => {
            const isCover = Boolean(f.esPortada) || (portadaUrl && f.url === portadaUrl);
            return (
              <div key={f.id || `net-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <img src={f.url} alt={f.caption || t('labels.gallery', 'Galería de fotos')} loading="lazy" className="w-full h-full object-cover block" />

                <button
                  type="button"
                  onClick={() => onSetPortadaExistente?.(f.id)}
                  disabled={disabled}
                  className={cn(
                    'absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm',
                    isCover ? 'bg-[#FF6B35] text-white' : 'bg-slate-900/65 hover:bg-slate-900/85 text-white'
                  )}
                >
                  <Star size={11} className={isCover ? 'fill-white' : ''} />
                  {t('editor:gallery.cover', 'Portada')}
                </button>

                <button
                  type="button"
                  onClick={() => onEliminarFoto?.(f.id)}
                  disabled={disabled}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-slate-900/65 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                  aria-label={t('gallery.deletePhoto', 'Eliminar foto')}
                >
                  <Trash2 size={13} />
                </button>

                <div className="absolute inset-x-2 bottom-2 z-10">
                  <StopTagPopover
                    t={t}
                    value={f.paradaId}
                    paradas={paradas}
                    disabled={disabled}
                    onChange={(paradaId) => onAssignParada?.(f, paradaId)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GalleryUploader
        files={files}
        onChange={onFilesChange}
        portadaIndex={portadaIndex}
        onPortadaChange={onPortadaChange}
        maxFiles={maxFiles}
        disabled={disabled}
        renderFileOverlay={(index) => (
          <StopTagPopover
            t={t}
            value={draftTags[index]?.paradaId || defaultParadaId || null}
            paradas={paradas}
            disabled={isReadOnlyMode}
            onChange={(paradaId) => onDraftTagChange?.(index, paradaId)}
          />
        )}
      />

      <span className="text-[0.8rem] font-semibold text-mutedTeal">
        {t('gallery.draftNotice', 'Tus fotos se subirán al guardar el viaje.')}
      </span>
    </div>
  );
};

export default EdicionGallerySection;
