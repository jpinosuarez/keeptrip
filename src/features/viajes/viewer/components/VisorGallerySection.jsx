import React, { useMemo } from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GalleryGrid } from '@shared/ui/components/GalleryGrid';

/**
 * Read-only consolidated trip album (cover + stop-tagged + unassigned photos,
 * deduplicated) with Lightbox. Editing lives exclusively in the Trip Editor,
 * reachable via the "Manage photos" deep-link (?editing=ID&tab=galeria).
 */
const VisorGallerySection = ({
  isOwner = true,
  galeria,
  fotosSubiendo,
  onReintentarFoto,
  isMobile,
  onManagePhotos,
  paradas = [],
}) => {
  const { t } = useTranslation('visor');
  const rawFotos = galeria?.fotos || [];

  const fotos = useMemo(() => {
    const seen = new Set();
    return rawFotos.filter((foto) => {
      const key = foto?.url;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawFotos]);

  const stopNameById = useMemo(() => {
    const map = {};
    (Array.isArray(paradas) ? paradas : []).forEach((p) => {
      if (p?.id) map[p.id] = p.nombre;
    });
    return map;
  }, [paradas]);

  const locationFor = (foto) =>
    foto?.paradaId && stopNameById[foto.paradaId] ? stopNameById[foto.paradaId] : null;

  // Zero-slop: a shared trip without photos hides the whole section.
  if (fotos.length === 0 && !isOwner) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal font-extrabold m-0">
          {t('gallery.title', 'Recuerdos Consolidados')}
        </h3>
        {isOwner && (
          <button
            type="button"
            onClick={onManagePhotos}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Camera size={14} className="text-[#FF6B35]" />
            {t('gallery.managePhotos', 'Gestionar fotos')}
          </button>
        )}
      </div>

      {fotos.length > 0 ? (
        <>
          <p className="mt-[-6px] mb-3 text-textSecondary text-[0.9rem]">
            {t('gallerySubtitle', 'Tu colección completa de la aventura.')}
          </p>
          <div className="w-full">
            <GalleryGrid
              fotos={fotos}
              fotosSubiendo={fotosSubiendo}
              onReintentarFoto={onReintentarFoto}
              isMobile={isMobile}
              locationFor={locationFor}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onManagePhotos}
          data-testid="gallery-add-photos"
          className="w-full min-h-[44px] rounded-xl border border-dashed border-border bg-white text-textPrimary text-sm font-semibold px-4 py-3 transition-all hover:border-atomicTangerine hover:text-atomicTangerine cursor-pointer"
        >
          + {t('gallery.addPhotos', 'Añadir fotos a este viaje')}
        </button>
      )}
    </div>
  );
};

export default VisorGallerySection;
