import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, Eye, Lightbulb, Sparkles, Wallet, Users, Heart, CloudSun, User } from 'lucide-react';
import ContextCard from '../ContextCard';

const COMPANION_TYPE_META = {
  solo: { Icon: User, key: 'solo', fallback: 'En solitario' },
  couple: { Icon: Heart, key: 'couple', fallback: 'En pareja' },
  family: { Icon: Users, key: 'family', fallback: 'En familia' },
  friends: { Icon: Users, key: 'friends', fallback: 'Con amigos' },
};

const VisorContextSection = ({ data, isMobile, carouselRef, activeCarouselDot, onCarouselScroll }) => {
  const { t } = useTranslation('visor');
  const weatherLabel =
    typeof data?.weather === 'string' && data.weather.trim()
      ? data.weather.trim()
      : data?.weather?.desc || data?.clima || null;
  const hasHighlights = data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip;
  const companions = Array.isArray(data.companions) ? data.companions : [];
  const hasCompanions = companions.length > 0;
  const companionType = data.companionType || '';
  const hasVibe = (data.vibe || []).length > 0;
  const hasContextCards =
    hasHighlights || hasCompanions || hasVibe || data.presupuesto || Boolean(weatherLabel) || Boolean(companionType);

  if (!hasContextCards) return null;

  const mobileClass = isMobile ? 'min-w-[240px] max-w-[300px] shrink-0 snap-start' : undefined;

  const highlightItems = [
    data.highlights?.topFood && { Icon: Utensils, text: data.highlights.topFood },
    data.highlights?.topView && { Icon: Eye, text: data.highlights.topView },
    data.highlights?.topTip && { Icon: Lightbulb, text: data.highlights.topTip },
  ].filter(Boolean);

  const cards = [];

  if (highlightItems.length > 0) {
    cards.push(
      <ContextCard key="highlights" icon={<Sparkles size={16} className="text-[#FF6B35]" />} label={t('context.highlights', 'Highlights')} className={mobileClass}>
        <div className="flex flex-col gap-1.5">
          {highlightItems.map((h, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                <h.Icon size={15} />
              </span>
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
        icon={<Wallet size={16} className="text-[#FF6B35]" />}
        label={t('context.budget', 'Presupuesto')}
        value={data.presupuesto}
        className={mobileClass}
      />
    );
  }

  if (hasVibe) {
    cards.push(
      <ContextCard key="vibe" icon={<Sparkles size={16} className="text-[#FF6B35]" />} label={t('context.vibe', 'Vibe')} className={mobileClass}>
        <div className="flex flex-wrap gap-1.5">
          {(data.vibe || []).map((vibe, index) => (
            <span key={index} className="px-3 py-1.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold">
              {vibe}
            </span>
          ))}
        </div>
      </ContextCard>
    );
  }

  if (hasCompanions || companionType) {
    const typeMeta = COMPANION_TYPE_META[companionType];
    cards.push(
      <ContextCard key="companions" icon={<Users size={16} className="text-[#FF6B35]" />} label={t('context.companions', 'Compañeros')} className={mobileClass}>
        <div className="flex flex-col gap-2">
          {typeMeta && (
            <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-[#45B0A8]/15 text-[#2C3E50] text-xs font-bold">
              <typeMeta.Icon size={13} />
              {t(`context.companionType.${typeMeta.key}`, typeMeta.fallback)}
            </span>
          )}
          {hasCompanions && (
            <div className="flex flex-wrap gap-1.5">
              {companions.map((c, idx) => {
                const name = typeof c === 'string' ? c : c?.name || c?.email || '';
                if (!name) return null;
                return (
                  <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#45B0A8]/20 text-[#2C3E50] flex items-center justify-center text-[10px] font-extrabold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </ContextCard>
    );
  }

  if (weatherLabel) {
    cards.push(
      <ContextCard
        key="weather"
        icon={<CloudSun size={16} className="text-[#FF6B35]" />}
        label={t('context.weather', 'Clima histórico')}
        value={weatherLabel}
        className={mobileClass}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="relative mb-8">
        <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide" onScroll={onCarouselScroll}>
          {cards}
        </div>
        {cards.length > 1 && <div className="absolute top-0 right-0 bottom-3 w-12 bg-gradient-to-r from-transparent to-[#f8fafa]/95 pointer-events-none z-[2] rounded-r-lg" />}
        {cards.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-1">
            {cards.map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all', i === activeCarouselDot ? 'w-4 bg-atomicTangerine' : 'w-1.5 bg-border')} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-8">{cards}</div>;
};

export default VisorContextSection;
