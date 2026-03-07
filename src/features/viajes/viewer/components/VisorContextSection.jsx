import React from 'react';
import { COLORS } from '@shared/config';
import { getInitials } from '@shared/lib/utils/viajeUtils';
import ContextCard from '../ContextCard';

const VisorContextSection = ({
  data,
  isMobile,
  styles,
  carouselRef,
  activeCarouselDot,
  onCarouselScroll,
}) => {
  const hasHighlights = data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip;
  const hasCompanions = (data.companions || []).length > 0;
  const hasVibe = (data.vibe || []).length > 0;
  const hasContextCards = hasHighlights || hasCompanions || hasVibe || data.presupuesto;

  if (!hasContextCards) return null;

  const highlightItems = [
    data.highlights?.topFood && { icon: '🍽️', text: data.highlights.topFood },
    data.highlights?.topView && { icon: '👀', text: data.highlights.topView },
    data.highlights?.topTip && { icon: '💡', text: data.highlights.topTip },
  ].filter(Boolean);

  const cards = [];
  if (highlightItems.length > 0) {
    cards.push(
      <ContextCard key="highlights" icon="⭐" label="Highlights" style={isMobile ? styles.contextCarouselCard : undefined}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {highlightItems.map((h, i) => (
            <div key={i} style={styles.highlightListItem}>
              <span>{h.icon}</span>
              <span style={{ fontSize: '0.9rem', color: COLORS.textPrimary }}>{h.text}</span>
            </div>
          ))}
        </div>
      </ContextCard>
    );
  }

  if (data.presupuesto) {
    cards.push(
      <ContextCard
        key="presupuesto"
        icon="💰"
        label="Presupuesto"
        value={data.presupuesto}
        style={isMobile ? styles.contextCarouselCard : undefined}
      />
    );
  }

  if (hasVibe) {
    cards.push(
      <ContextCard key="vibe" icon="✨" label="Vibe" value={(data.vibe || []).join(', ')} style={isMobile ? styles.contextCarouselCard : undefined} />
    );
  }

  if (hasCompanions) {
    cards.push(
      <ContextCard key="companions" icon="👥" label="Compañeros" style={isMobile ? styles.contextCarouselCard : undefined}>
        <div style={styles.companionsGrid}>
          {(data.companions || []).map((c, idx) => (
            <div key={idx} title={c.name || c.email || ''} style={styles.companionAvatar}>
              {getInitials(c.name || c.email)}
            </div>
          ))}
        </div>
      </ContextCard>
    );
  }

  if (isMobile) {
    return (
      <div style={styles.contextCarouselWrapper}>
        <div
          ref={carouselRef}
          className="hide-scrollbar"
          style={styles.contextCarousel}
          onScroll={onCarouselScroll}
        >
          {cards}
        </div>
        {cards.length > 1 && <div style={styles.contextCarouselPeek} />}
        {cards.length > 1 && (
          <div style={styles.contextCarouselDots}>
            {cards.map((_, i) => (
              <div key={i} style={styles.contextCarouselDot(i === activeCarouselDot)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div style={styles.contextGrid}>{cards}</div>;
};

export default VisorContextSection;
