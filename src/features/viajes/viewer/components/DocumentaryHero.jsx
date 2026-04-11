import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Calendar, ArrowLeft, Trash2, LoaderCircle, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getInitials, FOTO_DEFAULT_URL } from '@shared/lib/utils/viajeUtils';    
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { COLORS, FONTS, RADIUS, SHADOWS, GLASS, Z_INDEX } from '@shared/config';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';
import DocumentaryFlagHero from '@shared/ui/components/DocumentaryFlagHero';

/**
 * Premium editorial cover with dynamic flag shards and spatial typography.
 */
const DocumentaryHero = ({
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
}) => {
  const { t, i18n } = useTranslation(['countries', 'visor']);

  const isDefaultPhoto = !fotoMostrada || fotoMostrada === FOTO_DEFAULT_URL;
  const countryCode = data?.paisCodigo || data?.code || viajeBase?.paisCodigo || viajeBase?.code || null;
  const localizedCountryName = getLocalizedCountryName(countryCode, i18n.language, t);
  const legacyCountryName = data?.nombreEspanol || data?.nameSpanish || viajeBase?.nombreEspanol || viajeBase?.nameSpanish;
  const fallbackTitle = localizedCountryName || legacyCountryName || t('untitledTrip', { ns: 'visor', defaultValue: 'Travesía Sin Nombre' });
  const heroTitle = data?.titulo || fallbackTitle;

  return (
    <div style={styles.heroWrapper(isMobile)}>
      {/* Background Layer */}
      <div style={styles.heroBgContainer(isMobile)}>
        {!isDefaultPhoto ? (
          <div style={styles.heroImage(fotoMostrada, isMobile)}>
            <img
              src={fotoMostrada}
              alt={heroTitle}
              fetchPriority="high"
              style={styles.heroImgLayer} 
            />
            <div style={styles.heroGradient} />
          </div>
        ) : (
          <DocumentaryFlagHero banderas={data.banderas} style={{ background: COLORS.charcoalBlue, width: '100%', height: '100%' }} />
        )}
        
        {/* Film Grain & Noise Overlay */}
        <div style={styles.noiseOverlay} />
        <div style={styles.heroVignette} />
      </div>

      {/* Navigation UI */}
      <div style={styles.navBar}>
        <button onClick={onClose} style={styles.iconBtn(isBusy)} disabled={isBusy}>
          <ArrowLeft size={22} />
        </button>

        <div style={styles.navActions}>
          <ShareStoryButton data={storyData} />
          {!isSharedTrip && (
            <button onClick={onDelete} style={styles.secondaryBtn(isBusy)} disabled={isBusy} title="Eliminar viaje">
              {isDeleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} color={COLORS.danger} />}
            </button>
          )}
          {!isSharedTrip && (
            <button onClick={onOpenEdit} style={styles.primaryBtn(false, isBusy)} disabled={isBusy}>
              <Edit3 size={15} /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Content Layer (Editorial Typography) */}
      <div style={styles.heroContent(isMobile)}>
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={styles.flagRow}>
            {data.banderas && data.banderas.length > 0 ? (
              data.banderas.slice(0, 5).map((b, i) => (
                <img 
                  key={i} 
                  src={b.startsWith('http') ? b : getFlagUrl(b)} 
                  alt="flag" 
                  loading="lazy" 
                  style={{ ...styles.flagImg, boxShadow: SHADOWS.sm }} 
                />
              ))
            ) : (
              <span style={styles.flagIcon}>✈️</span>
            )}
          </div>

          <h1 data-testid="visor-title" style={styles.editorialTitle(isMobile)}>
            {heroTitle}
          </h1>

          <div style={styles.metaRow}>
            <span style={styles.metaBadge}>
              <Calendar size={13} strokeWidth={2.5} /> {formatDateRange(data.fechaInicio, data.fechaFin)}
            </span>

            {isSharedTrip && (
              <span data-testid="visor-shared-badge" style={styles.sharedBadge}>
                🤝 Compartido por {ownerDisplayName || '...'}
              </span>
            )}
          </div>

          {isRouteMode && (
            <div data-testid="visor-storytelling" style={{ marginTop: '20px' }}>
              <div style={styles.storytellingRow}>
                {data.presupuesto && (
                  <span style={styles.storytellingChip}>💰 {data.presupuesto}</span>
                )}
                {(data.vibe || []).map((v, i) => (
                  <span key={i} style={styles.storytellingVibeChip}>{v}</span>
                ))}
                
                <div style={styles.companionsStack}>
                  {(data.companions || []).slice(0, 4).map((c, idx) => (
                    <div key={idx} title={c.name || c.email} style={styles.companionDot}>
                      {getInitials(c.name || c.email)}
                    </div>
                  ))}
                  {(data.companions || []).length > 4 && (
                    <span style={styles.compactCount}>+{(data.companions || []).length - 4}</span>
                  )}
                </div>
              </div>

              {(data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip) && (
                <div style={{ ...styles.storytellingRow, marginTop: '10px' }}>
                  {data.highlights?.topFood && <span style={styles.highlightTag}>🍽️ {data.highlights.topFood}</span>}
                  {data.highlights?.topView && <span style={styles.highlightTag}>👀 {data.highlights.topView}</span>}
                  {data.highlights?.topTip && <span style={styles.highlightTag}>💡 {data.highlights.topTip}</span>}
                </div>
              )}
            </div>
          )}
        </Motion.div>
      </div>
    </div>
  );
};

export default DocumentaryHero;
