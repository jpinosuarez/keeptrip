import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Calendar, ArrowLeft, Trash2, LoaderCircle, Edit3 } from 'lucide-react';
import { formatDateRange, getInitials } from '@shared/lib/utils/viajeUtils';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { COLORS, FONTS, RADIUS, SHADOWS, GLASS, Z_INDEX } from '@shared/config';
import { ShareStoryButton } from '@features/share';

/**
 * DocumentaryHero — ACT I of the Keeptrip Manuscript.
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
  const flags = useMemo(() => {
    const uniqueCodes = [...new Set((data.banderas || []).map(b => {
      // Banderas might be URLs or codes. Let's try to normalize.
      if (b.startsWith('http')) return b;
      return getFlagUrl(b);
    }))].filter(Boolean);
    return uniqueCodes;
  }, [data.banderas]);

  const hasPhotos = Boolean(fotoMostrada);

  return (
    <div style={styles.heroWrapper}>
      {/* Background Layer */}
      <div style={styles.heroBgContainer(isMobile)}>
        {hasPhotos ? (
          <div style={styles.heroImage(fotoMostrada, isMobile)}>
            <div style={styles.heroGradient} />
          </div>
        ) : (
          <FlagBackground flags={flags} isMobile={isMobile} />
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

          <h1 style={styles.editorialTitle(isMobile)}>
            {data.titulo || viajeBase?.nombreEspanol || 'Travesía Sin Nombre'}
          </h1>

          <div style={styles.metaRow}>
            <span style={styles.metaBadge}>
              <Calendar size={13} strokeWidth={2.5} /> {formatDateRange(data.fechaInicio, data.fechaFin)}
            </span>

            {isSharedTrip && (
              <span style={styles.sharedBadge}>
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

// Internal component for the geometric flag magic
const FlagBackground = ({ flags, isMobile }) => {
  if (!flags || flags.length === 0) return <div style={{ background: COLORS.charcoalBlue, width: '100%', height: '100%' }} />;

  const count = flags.length;

  // Case 1: Single Flag
  if (count === 1) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        backgroundImage: `url(${flags[0]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.6) saturate(0.8)'
      }} />
    );
  }

  // Case 2: 2-3 Flags (Slashes)
  if (count <= 3) {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
        {flags.map((f, i) => {
          const isMiddle = count === 3 && i === 1;
          const clipPath = isMiddle 
            ? 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' 
            : i === 0 
              ? `polygon(0 0, ${count === 2 ? '55%' : '40%'} 0, ${count === 2 ? '45%' : '30%'} 100%, 0 100%)`
              : `polygon(${count === 2 ? '45%' : '75%'} 0, 100% 0, 100% 100%, ${count === 2 ? '35%' : '65%'} 100%)`;

          return (
            <div 
              key={i} 
              style={{ 
                flex: 1, 
                backgroundImage: `url(${f})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                filter: 'brightness(0.5) saturate(0.7)',
                clipPath: count > 1 ? clipPath : 'none',
                marginLeft: i > 0 ? '-10%' : 0 // Overlap for the slash
              }} 
            />
          );
        })}
      </div>
    );
  }

  // Case 3: 4+ Flags (Bento Shards)
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(4, 1fr)', 
      gridTemplateRows: 'repeat(2, 1fr)',
      width: '100%', 
      height: '100%',
      background: '#000'
    }}>
      {flags.slice(0, 8).map((f, i) => (
        <div 
          key={i} 
          style={{ 
            backgroundImage: `url(${f})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            filter: 'brightness(0.5) saturate(0.7)',
            border: '0.5px solid rgba(255,255,255,0.1)'
          }} 
        />
      ))}
    </div>
  );
};

export default DocumentaryHero;
