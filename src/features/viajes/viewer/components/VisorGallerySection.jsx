import { cn } from '@shared/lib/utils/cn';
import { Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GalleryGrid } from '@shared/ui/components/GalleryGrid';

const VisorGallerySection = ({
  isOwner = true,
  showGalleryTools,
  toggleGalleryTools,
  galeria,
  fotosSubiendo,
  onReintentarFoto,
  isMobile,
  captionDrafts,
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
  isBusy,
  onAddPhotos,
}) => {
  const { t } = useTranslation('visor');
  const fotos = galeria?.fotos || [];

  // Zero-slop: a shared trip without photos hides the whole section.
  if (fotos.length === 0 && !isOwner) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal font-extrabold m-0">{t('gallery.title', 'Recuerdos Consolidados')}</h3>
        {isOwner && fotos.length > 0 && (
          <button
            type="button"
            className={cn(
              "border rounded-full px-3 py-1.5 text-[0.75rem] font-bold cursor-pointer transition-all",
              showGalleryTools 
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine" 
                : "border-border bg-white text-textPrimary"
            )}
            onClick={toggleGalleryTools}
          >
            {showGalleryTools ? t('hideEditing', 'Ocultar edición') : t('editGallery', 'Editar galería')}
          </button>
        )}
      </div>
      
      {fotos.length > 0 ? (
        <>
          <p className="mt-[-6px] mb-3 text-textSecondary text-[0.9rem]">{t('gallerySubtitle', 'Tu colección completa de la aventura.')}</p>
          <div className="w-full">
            <GalleryGrid
              fotos={fotos}
              fotosSubiendo={fotosSubiendo}
              onReintentarFoto={onReintentarFoto}
              isMobile={isMobile}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onAddPhotos}
          data-testid="gallery-add-photos"
          className="w-full min-h-[44px] rounded-xl border border-dashed border-border bg-white text-textPrimary text-sm font-semibold px-4 py-3 transition-all hover:border-atomicTangerine hover:text-atomicTangerine cursor-pointer"
        >
          + {t('gallery.addPhotos', 'Añadir fotos a este viaje')}
        </button>
      )}


      {showGalleryTools && fotos.length > 0 && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {fotos.map((f) => (
            <div key={f.id} className={cn(
              "border rounded-md overflow-hidden bg-surface flex flex-col gap-2 p-2 transition-all",
              f.esPortada ? "border-atomicTangerine shadow-md" : "border-border shadow-sm"
            )}>
              <img src={f.url} alt={f.caption || 'foto'} loading="lazy" className="w-full h-[120px] object-cover rounded-sm" />
              <input
                type="text"
                value={captionDrafts[f.id] ?? (f.caption || '')}
                onChange={(e) => onCaptionChange(f.id, e.target.value)}
                onBlur={() => onCaptionSave(f)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="Agregar caption..."
                className="w-full border border-border rounded-sm px-2 py-1.5 text-[0.85rem] text-textPrimary outline-none bg-background"
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={cn(
                    "border rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all tap-btn",
                    f.esPortada 
                      ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine" 
                      : "border-border bg-white text-textPrimary"
                  )}
                  onClick={() => onSetPortadaExistente(f.id)}
                  disabled={isBusy}
                  title={t('aria.currentCover', 'Marcar como portada')}
                  aria-label={t('aria.currentCover', 'Marcar como portada')}
                >
                  <Star size={14} />
                  {f.esPortada ? t('cover', 'Portada') : t('makeCover', 'Hacer portada')}
                </button>
                <button
                  type="button"
                  className="border border-border bg-surface text-danger rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all tap-btn"
                  onClick={() => onEliminarFoto(f.id)}
                  disabled={isBusy}
                  title={t('aria.deletePhoto', 'Eliminar foto')}
                  aria-label={t('aria.deletePhoto', 'Eliminar foto')}
                >
                  <Trash2 size={14} />
                  {t('aria.deletePhoto', 'Eliminar')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisorGallerySection;
