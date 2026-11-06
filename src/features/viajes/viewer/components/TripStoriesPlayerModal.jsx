import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Pause, Play, MapPin, X } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';
import { STORY_SLIDE_DURATION_MS, formatKmLabel } from '../lib/buildTripStoryDeck';
import { getInitials } from '@shared/lib/utils/viajeUtils';

/**
 * Instagram-Stories style vertical player for a trip deck.
 * - 4.5s auto-advance per slide
 * - tap left half → previous, right half → next
 * - hold (≥260ms) or pause button → pause
 * - Esc → close, Arrow keys → navigate
 */
const TripStoriesPlayerModal = ({ isOpen = false, slides = [], onClose, shareData = null }) => {
  const { t } = useTranslation('visor');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const holdTimerRef = useRef(null);
  const didHoldRef = useRef(false);

  const total = Array.isArray(slides) ? slides.length : 0;
  const slide = total > 0 ? slides[activeIndex] || null : null;

  const goNext = useCallback(() => {
    setActiveIndex((index) => Math.min(index + 1, Math.max(0, total - 1)));
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
    setIsPaused(false);
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex > total - 1) setActiveIndex(Math.max(0, total - 1));
  }, [activeIndex, total]);

  useEffect(() => {
    if (!isOpen || isPaused || total === 0) return undefined;
    if (activeIndex >= total - 1) return undefined;
    const timer = setTimeout(() => {
      setActiveIndex((index) => Math.min(index + 1, total - 1));
    }, STORY_SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isPaused, activeIndex, total]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') { onClose?.(); return; }
      if (event.key === 'ArrowRight') { goNext(); return; }
      if (event.key === 'ArrowLeft') { goPrev(); return; }
      if (event.key === ' ') { event.preventDefault(); setIsPaused((prev) => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  useEffect(() => () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  }, []);

  // Lock body scroll while Stories is open so no mobile chrome can leak.
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handlePointerDown = () => {
    didHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      setIsPaused(true);
    }, 260);
  };

  const handlePointerUp = (navigate) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (didHoldRef.current) {
      didHoldRef.current = false;
      setIsPaused(false);
      return;
    }
    navigate();
  };

  if (!isOpen || !slide) return null;

  function renderSlideContent() {
    if (!slide) return null;

    if (slide.type === 'cover') {
      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 pb-14 bg-charcoalBlue">
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
          <div className="relative z-10 flex flex-col gap-2">
            {slide.countryCode ? <CountryFlag code={slide.countryCode} size="xl" className="mb-1" /> : null}
            <h2 className="font-heading text-[1.8rem] font-black leading-tight">
              {slide.title || t('stories.untitled', 'Mi viaje')}
            </h2>
            {slide.dates ? <p className="text-white/80 text-sm font-semibold">{slide.dates}</p> : null}
            {slide.totalDays > 0 ? (
              <span className="font-mono text-[0.72rem] text-white/70">
                {t('stories.daysCount', { count: slide.totalDays, defaultValue: '{{count}} días' })}
              </span>
            ) : null}
          </div>
        </div>
      );
    }

    if (slide.type === 'route') {
      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-center gap-4 p-6 bg-charcoalBlue">
          <div className="flex items-center gap-2">
            {slide.countryCode ? <CountryFlag code={slide.countryCode} size="lg" /> : null}
            <h2 className="font-heading text-lg font-extrabold">{t('stories.routeTitle', 'La ruta')}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 border border-white/15 p-2">
              <div className="font-mono text-lg font-bold">{slide.totalDays}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-white/60">{t('stories.metricDays', 'días')}</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-2">
              <div className="font-mono text-lg font-bold">{slide.totalStops}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-white/60">{t('stories.metricStops', 'paradas')}</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-2">
              <div className="font-mono text-lg font-bold">{formatKmLabel(slide.totalKm)}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-white/60">{t('stories.metricKm', 'recorridos')}</div>
            </div>
          </div>
          {slide.stopNames?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {slide.stopNames.slice(0, 6).map((name, index) => (
                <span key={`${name}-${index}`} className="rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[0.72rem]">
                  {index + 1}. {name}
                </span>
              ))}
            </div>
          ) : null}
          {slide.homeStatus?.type === 'local' ? (
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-[#45B0A8]/20 text-[#9de4de] border border-[#45B0A8]/40 px-3 py-1 text-[0.72rem] font-bold">
              🏡 {t('hero.localBadge', 'Aventura Local')}
            </span>
          ) : null}
          {slide.homeStatus?.type === 'distance' ? (
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-[#FF6B35]/20 text-[#ffd4b8] border border-[#FF6B35]/40 px-3 py-1 text-[0.72rem] font-bold">
              ✈️ {t('hero.distanceBadge', {
                distance: formatKmLabel(slide.homeStatus.distanceKm),
                city: slide.homeStatus.baseCityName || '',
                defaultValue: 'A {{distance}} km de {{city}}',
              })}
            </span>
          ) : null}
        </div>
      );
    }

    if (slide.type === 'stop') {
      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 pb-16 bg-charcoalBlue">
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#FF6B35] font-mono text-sm font-black">
              {slide.stopNumber}
            </span>
            <div className="flex items-center gap-2">
              {slide.countryCode ? <CountryFlag code={slide.countryCode} size="sm" /> : null}
              <h2 className="font-heading text-2xl font-black">{slide.title}</h2>
            </div>
            {slide.subtitle ? <p className="font-mono text-[0.72rem] text-white/70">{slide.subtitle}</p> : null}
            {slide.dayTripFrom ? (
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-[#45B0A8]/20 text-[#9de4de] border border-[#45B0A8]/40 px-3 py-1 text-[0.72rem] font-bold">
                <MapPin size={12} /> {t('timeline.dayTripFrom', { city: slide.dayTripFrom, defaultValue: 'Escapada de día desde {{city}}' })}
              </span>
            ) : null}
            {slide.note ? <p className="text-sm leading-relaxed text-white/90">{slide.note}</p> : null}
            {Array.isArray(slide.vibes) && slide.vibes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {slide.vibes.map((vibe) => (
                  <span key={vibe} className="rounded-full bg-[#FF6B35]/25 text-[#ffd6c7] border border-[#FF6B35]/40 px-2 py-0.5 text-[0.66rem] font-bold">
                    {vibe}
                  </span>
                ))}
              </div>
            )}
            {Array.isArray(slide.lugares) && slide.lugares.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {slide.lugares.map((lugar) => (
                  <span key={lugar.id || lugar.nombre} className="rounded-full bg-[#45B0A8]/20 text-[#9de4de] border border-[#45B0A8]/40 px-2 py-0.5 text-[0.66rem] font-bold">
                    {lugar.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (slide.type === 'context') {
      const highlightItems = [
        slide.highlights?.topFood && { icon: '🍽️', text: slide.highlights.topFood },
        slide.highlights?.topView && { icon: '👀', text: slide.highlights.topView },
        slide.highlights?.topTip && { icon: '💡', text: slide.highlights.topTip },
      ].filter(Boolean);

      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-center gap-4 p-6 bg-charcoalBlue">
          <h2 className="font-heading text-lg font-extrabold">{t('stories.contextTitle', 'Lo que recordarás')}</h2>
          {highlightItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {highlightItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          ) : null}
          {slide.companionNames?.length ? (
            <div className="flex flex-wrap gap-2 items-center">
              {slide.companionNames.slice(0, 6).map((name, index) => (
                <span key={`${name}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 pl-1 pr-2.5 py-1 text-[0.72rem]">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center text-[0.6rem] font-bold">
                    {getInitials(name)}
                  </span>
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          {slide.weather ? <p className="text-sm text-white/80">🌤️ {slide.weather}</p> : null}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-10 flex flex-col justify-end gap-4 p-6 pb-16 bg-charcoalBlue">
        {slide.image ? (
          <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        ) : null}
        <div className="relative z-10 flex flex-col gap-3">
          <h2 className="font-heading text-xl font-extrabold">{t('stories.finaleTitle', 'Fin del viaje')}</h2>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-center">
            <div className="font-mono text-3xl font-black text-[#FFD4B8]">+{slide.xp} XP</div>
            <div className="text-[0.62rem] uppercase tracking-widest text-white/60">
              {t('footer.xpEarned', { xp: slide.xp, defaultValue: '+{{xp}} XP' })}
            </div>
          </div>
          {slide.images?.length ? (
            <div className="grid grid-cols-4 gap-1.5">
              {slide.images.map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt="" loading="lazy" className="w-full h-16 object-cover rounded-md" />
              ))}
            </div>
          ) : null}
          {shareData ? (
            <div className="flex justify-center">
              <ShareStoryButton data={shareData} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none bg-black flex flex-col justify-between overflow-hidden md:items-center md:justify-center md:bg-slate-950/95 md:p-6"
      data-testid="trip-stories-player"
      role="dialog"
      aria-modal="true"
      aria-label={t('stories.aria', 'Trip stories')}
    >
      <div className="relative w-full h-full md:w-auto md:h-[min(92vh,844px)] md:aspect-[9/16] md:max-w-[420px] md:rounded-[28px] overflow-hidden bg-slate-950 text-white shadow-2xl">
        <style>{'@keyframes keeptripStoryProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }'}</style>

        {renderSlideContent()}

        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {slides.map((item, index) => (
            <div key={item.id || index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full w-full origin-left bg-white"
                style={{
                  transform: index < activeIndex ? 'scaleX(1)' : index > activeIndex ? 'scaleX(0)' : undefined,
                  animation: index === activeIndex ? 'keeptripStoryProgress 4500ms linear forwards' : 'none',
                  animationPlayState: isPaused ? 'paused' : 'running',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 z-20 flex">
          <button
            type="button"
            aria-label={t('stories.previous', 'Anterior')}
            className="h-full w-[40%] bg-transparent cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerUp={() => handlePointerUp(goPrev)}
            onPointerLeave={() => {
              if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
              if (didHoldRef.current) { didHoldRef.current = false; setIsPaused(false); }
            }}
          />
          <button
            type="button"
            aria-label={t('stories.next', 'Siguiente')}
            className="h-full w-[60%] bg-transparent cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerUp={() => handlePointerUp(goNext)}
            onPointerLeave={() => {
              if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
              if (didHoldRef.current) { didHoldRef.current = false; setIsPaused(false); }
            }}
          />
        </div>

        <div className="absolute top-6 right-3 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center"
            aria-label={t('stories.pause', 'Pausar')}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center"
            aria-label={t('stories.close', 'Cerrar')}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to document.body so the player escapes every parent stacking
  // context and fully covers mobile bottom bar / top bar / FAB.
  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};

export default TripStoriesPlayerModal;

