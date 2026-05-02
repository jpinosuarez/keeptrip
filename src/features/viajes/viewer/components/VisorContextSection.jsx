import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { getInitials } from '@shared/lib/utils/viajeUtils';
import ContextCard from '../ContextCard';

const VisorContextSection = ({
  data,
  isMobile,
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
      <ContextCard key="highlights" icon="⭐" label="Highlights" className={isMobile ? "min-w-[220px] max-w-[280px] shrink-0 snap-start" : undefined}>
        <div className="flex flex-col gap-1.5">
          {highlightItems.map((h, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span>{h.icon}</span>
              <span className="text-[0.9rem] text-textPrimary">{h.text}</span>
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
        className={isMobile ? "min-w-[220px] max-w-[280px] shrink-0 snap-start" : undefined}
      />
    );
  }

  if (hasVibe) {
    cards.push(
      <ContextCard key="vibe" icon="✨" label="Vibe" value={(data.vibe || []).join(', ')} className={isMobile ? "min-w-[220px] max-w-[280px] shrink-0 snap-start" : undefined} />
    );
  }

  if (hasCompanions) {
    cards.push(
      <ContextCard key="companions" icon="👥" label="Compañeros" className={isMobile ? "min-w-[220px] max-w-[280px] shrink-0 snap-start" : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {(data.companions || []).map((c, idx) => (
            <div key={idx} title={c.name || c.email || ''} className="w-[30px] h-[30px] rounded-full bg-background flex items-center justify-center text-[0.7rem] font-bold border border-border text-textPrimary">
              {getInitials(c.name || c.email)}
            </div>
          ))}
        </div>
      </ContextCard>
    );
  }

  if (isMobile) {
    return (
      <div className="relative mb-8">
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide"
          onScroll={onCarouselScroll}
        >
          {cards}
        </div>
        {cards.length > 1 && <div className="absolute top-0 right-0 bottom-3 w-12 bg-gradient-to-r from-transparent to-[#f8fafa]/95 pointer-events-none z-[2] rounded-r-lg" />}
        {cards.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-1">
            {cards.map((_, i) => (
              <div key={i} className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeCarouselDot ? "w-4 bg-atomicTangerine" : "w-1.5 bg-border"
              )} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-8">{cards}</div>;
};

export default VisorContextSection;
