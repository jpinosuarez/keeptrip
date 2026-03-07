import React from 'react';
import { Calendar, ArrowLeft, Trash2, LoaderCircle, Edit3 } from 'lucide-react';
import { formatDateRange, getInitials } from '@shared/lib/utils/viajeUtils';
import ShareStoryButton from '@shared/ui/legacy_components/Share/ShareStoryButton';

const VisorHero = ({
  styles,
  isMobile,
  fotoMostrada,
  isBusy,
  onClose,
  storyData,
  isSharedTrip,
  onDelete,
  isDeleting,
  onOpenEdit,
  data,
  viajeBase,
  ownerDisplayName,
  isRouteMode,
  galeriaFotosCount,
}) => {
  return (
    <div style={styles.heroWrapper}>
      <div style={styles.heroImage(fotoMostrada, isMobile)}>
        <div style={styles.heroGradient} />

        <div style={styles.navBar}>
          <button onClick={onClose} style={styles.iconBtn(isBusy)} disabled={isBusy}>
            <ArrowLeft size={22} />
          </button>

          <div style={styles.navActions}>
            <ShareStoryButton data={storyData} />
            {!isSharedTrip && (
              <button onClick={onDelete} style={styles.secondaryBtn(isBusy)} disabled={isBusy}>
                {isDeleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} color="#ff6b6b" />}
              </button>
            )}
            {!isSharedTrip && (
              <button onClick={onOpenEdit} style={styles.primaryBtn(false, isBusy)} disabled={isBusy}>
                <Edit3 size={15} /> Editar
              </button>
            )}
          </div>
        </div>

        <div style={styles.heroContent(isMobile)}>
          <div style={styles.flagRow}>
            {data.banderas && data.banderas.length > 0 ? (
              data.banderas.map((b, i) => <img key={i} src={b} alt="flag" loading="lazy" style={styles.flagImg} />)
            ) : (
              <span style={styles.flagIcon}>✈️</span>
            )}
          </div>

          <h1 style={styles.titleDisplay}>{data.titulo || viajeBase?.nombreEspanol || ''}</h1>

          <div style={styles.metaRow}>
            <span style={styles.metaBadge}>
              <Calendar size={13} /> {formatDateRange(data.fechaInicio, data.fechaFin)}
            </span>

            {isSharedTrip && (
              <span data-testid="visor-shared-badge" style={styles.sharedBadge}>
                🤝 Compartido por {ownerDisplayName || '...'}
              </span>
            )}
          </div>

          {isRouteMode && (
            <div data-testid="visor-storytelling">
              <div style={styles.storytellingRow}>
                {data.presupuesto && (
                  <span data-testid="visor-presupuesto" style={styles.storytellingChip}>
                    💰 {data.presupuesto}
                  </span>
                )}
                {(data.vibe || []).map((v, i) => (
                  <span key={i} style={styles.storytellingVibeChip}>
                    {v}
                  </span>
                ))}
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', alignItems: 'center' }}>
                  {(data.companions || []).slice(0, 4).map((c, idx) => (
                    <div key={idx} title={c.name || c.email || ''} style={styles.companionDot}>
                      {getInitials(c.name || c.email)}
                    </div>
                  ))}
                  {(data.companions || []).length > 4 && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                      +{(data.companions || []).length - 4}
                    </span>
                  )}
                </div>
              </div>

              {(data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip) && (
                <div style={{ ...styles.storytellingRow, marginTop: '6px' }}>
                  {data.highlights?.topFood && <span style={styles.highlightTag}>🍽️ {data.highlights.topFood}</span>}
                  {data.highlights?.topView && <span style={styles.highlightTag}>👀 {data.highlights.topView}</span>}
                  {data.highlights?.topTip && <span style={styles.highlightTag}>💡 {data.highlights.topTip}</span>}
                </div>
              )}
            </div>
          )}

          {fotoMostrada && data.fotoCredito && galeriaFotosCount === 0 && (
            <a
              href={`${data.fotoCredito.link}?utm_source=keeptrip&utm_medium=referral`}
              target="_blank"
              rel="noreferrer"
              style={styles.creditLink}
            >
              📷 {data.fotoCredito.nombre} / Pexels
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisorHero;
