import { cn } from '@shared/lib/utils/cn';
import { Star, Trash2, Share2, Sparkles } from 'lucide-react';
import { GalleryGrid } from '@shared/ui/components/GalleryGrid';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';

const VisorGallerySection = ({
  isSharedTrip,
  showGalleryTools,
  onToggleGalleryTools,
  galeria,
  fotosSubiendo,
  onReintentarFoto,
  isMobile,
  captionDrafts,
  onCaptionChange,
  onCaptionSave,
  onSetPortada,
  onEliminarFoto,
  isBusy,
}) => {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal font-extrabold m-0">Recuerdos Consolidados</h3>
        {!isSharedTrip && (
          <button
            type="button"
            className={cn(
              "border rounded-full px-3 py-1.5 text-[0.75rem] font-bold cursor-pointer transition-all",
              showGalleryTools 
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine" 
                : "border-border bg-white text-textPrimary"
            )}
            onClick={onToggleGalleryTools}
          >
            {showGalleryTools ? 'Ocultar edición' : 'Editar galería'}
          </button>
        )}
      </div>
      
      {galeria.fotos.length > 0 ? (
        <>
          <p className="mt-[-6px] mb-3 text-textSecondary text-[0.9rem]">La colección completa de tu aventura.</p>
          <GalleryGrid
            fotos={galeria.fotos}
            fotosSubiendo={fotosSubiendo}
            onReintentarFoto={onReintentarFoto}
            isMobile={isMobile}
          />
        </>
      ) : (
        <div className="italic text-textSecondary">No hay fotos adicionales en la galería.</div>
      )}


      {showGalleryTools && galeria.fotos.length > 0 && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {galeria.fotos.map((f) => (
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
                  onClick={() => onSetPortada(f.id)}
                  disabled={isBusy}
                  title="Marcar como portada"
                  aria-label="Marcar como portada"
                >
                  <Star size={14} />
                  {f.esPortada ? 'Portada' : 'Hacer portada'}
                </button>
                <button
                  type="button"
                  className="border border-border bg-surface text-danger rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all tap-btn"
                  onClick={() => onEliminarFoto(f.id)}
                  disabled={isBusy}
                  title="Eliminar foto"
                  aria-label="Eliminar foto"
                >
                  <Trash2 size={14} />
                  Eliminar
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
