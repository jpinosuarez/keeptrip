import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Star, LoaderCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';
import { useToast } from '@app/providers/ToastContext';
import { MAX_FILE_SIZE } from '@shared/lib/utils/imageUtils';

/**
 * GalleryUploader — drag & drop photo queue for the trip editor.
 * Works for brand-new trips (no Firestore id yet) and supports a custom overlay
 * (e.g. per-photo stop tagging) via `renderFileOverlay`.
 */
export function GalleryUploader({
  files = [],
  onChange,
  maxFiles = 10,
  portadaIndex = 0,
  onPortadaChange,
  disabled = false,
  renderFileOverlay,
}) {
  const { t } = useTranslation(['gallery', 'editor', 'common']);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const { pushToast } = useToast();

  // Keep object-URL previews in sync with the current `files` array and revoke
  // any URL that no longer has a matching file.
  useEffect(() => {
    const current = new Set(files);
    setPreviews((prev) => {
      const map = new Map(prev.map((p) => [p.file, p.url]));
      const next = files.map((file) => {
        let url = map.get(file);
        if (!url) {
          url = URL.createObjectURL(file);
          objectUrlsRef.current.add(url);
        }
        return { file, url };
      });
      const nextUrls = new Set(next.map((n) => n.url));
      prev.forEach((p) => {
        if (!nextUrls.has(p.url)) {
          URL.revokeObjectURL(p.url);
          objectUrlsRef.current.delete(p.url);
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const applyFiles = (selectedFiles) => {
    if (disabled) return;

    const incoming = Array.from(selectedFiles || []);
    const validFiles = [];
    let invalidTypeCount = 0;
    let invalidSizeCount = 0;

    incoming.forEach((file) => {
      const isValidFormat = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE;
      if (!isValidFormat) {
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
      pushToast(t('gallery:invalidFormat', '{{count}} archivo(s) no son imágenes válidas y se descartaron.', { count: invalidTypeCount }), 'warning');
    }
    if (invalidSizeCount > 0) {
      pushToast(t('gallery:tooLarge', '{{count}} foto(s) superan el tamaño máximo y se descartaron.', { count: invalidSizeCount }), 'warning');
    }
    if (skippedByLimit > 0) {
      pushToast(t('gallery:limitReached', 'Alcanzaste el límite de {{max}} fotos. Se omitieron {{skipped}}.', { max: maxFiles, skipped: skippedByLimit }), 'info');
    }
    if (acceptedFiles.length === 0) return;

    onChange?.([...files, ...acceptedFiles].slice(0, maxFiles));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onChange?.(updatedFiles);
    if (index === portadaIndex && updatedFiles.length > 0) {
      onPortadaChange?.(0);
    } else if (index < portadaIndex) {
      onPortadaChange?.(portadaIndex - 1);
    }
  };

  const getPreviewUrl = (file) => previews.find((p) => p.file === file)?.url || null;
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {files.length < maxFiles && (
        <div
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 px-5 text-center transition-all duration-200',
            isDragging ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-slate-200 bg-slate-50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#FF6B35]/60'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload size={30} className="text-[#FF6B35] mx-auto" />
          <p className="text-base font-semibold text-slate-800 mt-3 mb-1">
            {isDragging
              ? t('gallery:dropHere', 'Suelta tus fotos aquí')
              : t('gallery:dragOrClick', 'Arrastra tus fotos aquí o haz clic para seleccionar')}
          </p>
          <p className="text-[13px] text-slate-500 m-0">
            {t('gallery:specs', 'JPG, PNG o WebP · Comprimimos automáticamente sin perder calidad')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple={maxFiles > 1}
            className="hidden"
            onChange={(e) => {
              applyFiles(e.target.files);
              e.target.value = '';
            }}
            disabled={disabled}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-4">
          {files.map((file, index) => {
            const previewUrl = getPreviewUrl(file);
            const isCover = index === portadaIndex;
            return (
              <div
                key={`${file.name}-${index}`}
                className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt={file.name} className="w-full h-full object-cover block" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                    <LoaderCircle size={22} className="text-[#FF6B35] animate-spin" />
                    <span className="text-[10px] font-semibold text-slate-500">{t('gallery:optimizing', 'Optimizando...')}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onPortadaChange?.(index)}
                  disabled={disabled || isCover}
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
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-slate-900/65 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                  aria-label={t('gallery:deletePhoto', 'Eliminar foto')}
                >
                  <Trash2 size={13} />
                </button>

                {typeof renderFileOverlay === 'function' ? (
                  <div className="absolute inset-x-2 bottom-2 z-10">{renderFileOverlay(index, file)}</div>
                ) : (
                  <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between text-[11px] font-semibold text-white/90 bg-slate-900/55 rounded-lg px-2 py-1">
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0">{formatFileSize(file.size)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <p className="mt-3 text-center text-[13px] font-semibold text-slate-500 m-0">
          {t('gallery:photosSelected', '{{count}} / {{max}} fotos seleccionadas', { count: files.length, max: maxFiles })}
        </p>
      )}
    </div>
  );
}
