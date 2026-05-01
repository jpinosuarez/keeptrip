import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Star, LoaderCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';
import { useToast } from '@app/providers/ToastContext';
import { MAX_FILE_SIZE } from '@shared/lib/utils/imageUtils';

export function GalleryUploader({
  files = [],
  onChange,
  maxFiles = 10,
  portadaIndex = 0,
  onPortadaChange,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [optimizing, setOptimizing] = useState(0);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const { pushToast } = useToast();
  const { t } = useTranslation('editor');

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
      const isValidFormat = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
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
      pushToast(
        t('gallery.invalidFormat', {
          count: invalidTypeCount,
          defaultValue: `${invalidTypeCount} foto(s) no son JPG ni PNG y se descartaron.`,
        }),
        'warning'
      );
    }

    if (invalidSizeCount > 0) {
      pushToast(
        t('gallery.tooLarge', {
          count: invalidSizeCount,
          max: Math.round(MAX_FILE_SIZE / 1024 / 1024),
          defaultValue: `${invalidSizeCount} foto(s) pesan más de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB y se descartaron.`,
        }),
        'warning'
      );
    }

    if (skippedByLimit > 0) {
      pushToast(
        t('gallery.limitReached', {
          max: maxFiles,
          skipped: skippedByLimit,
          defaultValue: `Alcanzaste el límite de ${maxFiles} fotos. Se omitieron ${skippedByLimit}.`,
        }),
        'info'
      );
    }

    if (acceptedFiles.length === 0) return;

    const nextFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    onChange?.(nextFiles);

    setOptimizing((prev) => prev + acceptedFiles.length);
    setTimeout(() => {
      acceptedFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.add(url);
        setPreviews((prev) => [...prev, { file, url }]);
        setOptimizing((prev) => Math.max(0, prev - 1));
      });
    }, 0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index) => {
    const removed = previews[index];
    if (removed) {
      URL.revokeObjectURL(removed.url);
      objectUrlsRef.current.delete(removed.url);
    }

    const updatedFiles = files.filter((_, i) => i !== index);
    onChange?.(updatedFiles);
    setPreviews((prev) => prev.filter((_, i) => i !== index));

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
            "border-2 border-dashed rounded-md p-10 px-5 text-center transition-all duration-200",
            isDragging ? "border-atomicTangerine bg-atomicTangerine/10" : "border-border bg-background",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload size={32} className="text-text-secondary mx-auto" />
          <p className="text-base font-semibold text-text-primary mt-3 mb-1">
            {isDragging ? t('gallery.dropHere') : t('gallery.dragOrClick')}
          </p>
          <p className="text-[13px] text-text-secondary m-0">
            {t('gallery.specs', { max: maxFiles, sizeMB: Math.round(MAX_FILE_SIZE / 1024 / 1024) })}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mt-4">
          {files.map((file, index) => {
            const previewUrl = getPreviewUrl(file);
            const isPortada = index === portadaIndex;

            return (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  "relative border-2 rounded-sm overflow-hidden bg-surface transition-all duration-150",
                  isPortada ? "border-atomicTangerine shadow-md" : "border-border shadow-sm"
                )}
              >
                <div className="relative w-full h-[140px] overflow-hidden bg-background">
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-background">
                      <LoaderCircle size={22} className="text-atomicTangerine animate-spin" />
                      <span className="text-[10px] font-semibold text-text-secondary tracking-wider">
                        {t('gallery.optimizing')}
                      </span>
                    </div>
                  )}

                  {isPortada && (
                    <div className="absolute top-2 left-2 bg-atomicTangerine text-white px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold shadow-sm">
                      <Star size={14} fill="white" color="white" />
                      <span className="uppercase tracking-wider">{t('labels.portada')}</span>
                    </div>
                  )}

                  <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-100 transition-all duration-150">
                    {!isPortada && (
                      <button
                        className="w-[30px] h-[30px] border-none rounded-full bg-black/70 text-surface flex items-center justify-center cursor-pointer backdrop-blur-sm"
                        onClick={() => onPortadaChange?.(index)}
                        title={t('gallery.setCover')}
                        aria-label={t('gallery.setCover')}
                        disabled={disabled}
                        type="button"
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      className="w-[30px] h-[30px] border-none rounded-full bg-black/70 text-surface flex items-center justify-center cursor-pointer backdrop-blur-sm"
                      onClick={() => handleRemoveFile(index)}
                      title={t('gallery.deletePhoto')}
                      aria-label={t('gallery.deletePhoto')}
                      disabled={disabled}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-[12px] font-medium text-text-primary m-0 truncate">{file.name}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 m-0">{formatFileSize(file.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 text-center">
          {optimizing > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-[12px] text-text-secondary mb-2 m-0">
              <LoaderCircle size={14} className="text-atomicTangerine animate-spin" />
              {t('gallery.optimizingCount', { count: optimizing })}
            </p>
          )}
          <p className="text-[13px] font-semibold text-text-secondary m-0">
            {files.length} / {maxFiles} {t('gallery.photosSelected')}
          </p>
        </div>
      )}
    </div>
  );
}
