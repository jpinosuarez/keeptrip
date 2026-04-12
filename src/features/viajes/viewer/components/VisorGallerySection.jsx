import { Star, Trash2, Share2, Sparkles } from 'lucide-react';
import { GalleryGrid } from '@shared/ui/components/GalleryGrid';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';

const VisorGallerySection = ({
  styles,
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
    <div style={styles.recapGalleryWrapper}>
      <div style={styles.galleryHeaderRow}>
        <h3 style={styles.sectionTitle}>Recuerdos Consolidados</h3>
        {!isSharedTrip && (
          <button
            type="button"
            style={styles.galleryToggleBtn(showGalleryTools)}
            onClick={onToggleGalleryTools}
          >
            {showGalleryTools ? 'Ocultar edición' : 'Editar galería'}
          </button>
        )}
      </div>
      
      {galeria.fotos.length > 0 ? (
        <>
          <p style={styles.gallerySubtitle}>La colección completa de tu aventura.</p>
          <GalleryGrid
            fotos={galeria.fotos}
            fotosSubiendo={fotosSubiendo}
            onReintentarFoto={onReintentarFoto}
            isMobile={isMobile}
          />
        </>
      ) : (
        <div style={styles.emptyState}>No hay fotos adicionales en la galería.</div>
      )}


      {showGalleryTools && galeria.fotos.length > 0 && (
        <div style={styles.galleryManageBlock}>
          {galeria.fotos.map((f) => (
            <div key={f.id} style={styles.galleryManageCard(f.esPortada)}>
              <img src={f.url} alt={f.caption || 'foto'} loading="lazy" style={styles.galleryManageImg} />
              <input
                type="text"
                value={captionDrafts[f.id] ?? (f.caption || '')}
                onChange={(e) => onCaptionChange(f.id, e.target.value)}
                onBlur={() => onCaptionSave(f)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="Agregar caption..."
                style={styles.captionInput}
              />
              <div style={styles.galleryActionsRow}>
                <button
                  type="button"
                  className="tap-btn"
                  style={styles.galleryActionBtn(f.esPortada)}
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
                  className="tap-btn"
                  style={styles.galleryDangerBtn}
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
