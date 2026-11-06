import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Calendar, ArrowLeft, Trash2, LoaderCircle, Edit3, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateRange, FOTO_DEFAULT_URL } from '@shared/lib/utils/viajeUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';
import CountryFlag from '@shared/ui/components/CountryFlag';
import DocumentaryFlagHero from '@shared/ui/components/DocumentaryFlagHero';
import { formatKmLabel } from '../lib/buildTripStoryDeck';

const ACTION_BUTTON_CLASS =
  'bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-full p-2.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer';

/**
 * Premium editorial cover: 100% full-bleed photo with floating actions and
 * bottom-anchored trip details. The cover image is a direct child of the
 * full-width root so it always spans the viewport with zero side gaps.
 */
const DocumentaryHero = ({
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
  countryCodes = [],
  telemetry = null,
  homeStatus = null,
  onOpenStories,
}) => {
  const { t, i18n } = useTranslation(['countries', 'visor']);
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/trips');
    }
  };

  const coverPhotoUrl =
    fotoMostrada && fotoMostrada !== FOTO_DEFAULT_URL ? fotoMostrada : null;
  const countryCode = data?.paisCodigo || data?.code || viajeBase?.paisCodigo || viajeBase?.code || null;
  const localizedCountryName = getLocalizedCountryName(countryCode, i18n.language, t);
  const legacyCountryName = data?.nombreEspanol || data?.nameSpanish || viajeBase?.nombreEspanol || viajeBase?.nameSpanish;
  const fallbackTitle =
    localizedCountryName ||
    legacyCountryName ||
    t('untitledTrip', { ns: 'visor', defaultValue: 'Travesía Sin Nombre' });
  const heroTitle = data?.titulo || fallbackTitle;

  return (
    <div className="relative w-full min-h-[420px] md:min-h-[460px] overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Full-bleed cover: direct child of the root, never inside a max-w row. */}
      {coverPhotoUrl ? (
        <img
          src={coverPhotoUrl}
          alt={data?.titulo || 'Portada del viaje'}
          className="absolute inset-0 w-full h-full object-cover object-center block"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full">
          <DocumentaryFlagHero
            banderas={data?.banderas}
            paises={countryCodes}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Protective full-bleed gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/60 pointer-events-none" />

      {/* Top Bar: dedicated in-flow header row (never overlaps bottom content) */}
      <div className="relative z-20 w-full flex items-center justify-between p-4 md:p-6 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          data-testid="documentary-hero-back"
          disabled={isBusy}
          className={ACTION_BUTTON_CLASS}
          title={t('hero.back', { ns: 'visor', defaultValue: 'Volver' })}
          aria-label={t('hero.back', { ns: 'visor', defaultValue: 'Volver' })}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <ShareStoryButton data={storyData} />
          {!isSharedTrip && (
            <button
              type="button"
              onClick={onDelete}
              data-testid="documentary-hero-delete"
              disabled={isBusy}
              className={ACTION_BUTTON_CLASS}
              title={t('hero.delete', { ns: 'visor', defaultValue: 'Eliminar viaje' })}
            >
              {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} className="text-danger" />}
            </button>
          )}
          {!isSharedTrip && (
            <button
              type="button"
              onClick={onOpenEdit}
              data-testid="documentary-hero-open-edit"
              disabled={isBusy}
              className={ACTION_BUTTON_CLASS}
              title={t('hero.edit', { ns: 'visor', defaultValue: 'Editar' })}
              aria-label={t('hero.edit', { ns: 'visor', defaultValue: 'Editar' })}
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom: trip details */}
      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mt-auto w-full max-w-5xl mx-auto px-4 md:px-10 pb-6 md:pb-8 flex flex-col gap-3 md:gap-4"
      >
        {countryCodes.length > 0 && (
          <div className="flex gap-2 items-center">
            {countryCodes.slice(0, 5).map((code) => (
              <CountryFlag key={code} code={code} size="xl" className="shadow-sm border border-white/20" />
            ))}
          </div>
        )}

        <h1
          data-testid="visor-title"
          className={`text-white font-black leading-[0.95] tracking-tighter [text-shadow:0_10px_40px_rgba(0,0,0,0.6)] [text-wrap:balance] max-w-[900px] font-heading ${isMobile ? 'text-[2rem]' : 'text-[3.6rem]'}`}
        >
          {heroTitle}
        </h1>

        {data?.titular && String(data.titular).trim() ? (
          <p className="w-full text-slate-200/90 text-sm md:text-base font-normal italic leading-relaxed mt-1.5 whitespace-normal break-words [text-wrap:pretty]">
            {data.titular}
          </p>
        ) : null}

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3.5 py-[7px] rounded-full text-white text-[0.82rem] font-semibold border border-white/20">
            <Calendar size={13} strokeWidth={2.5} /> {formatDateRange(data.fechaInicio, data.fechaFin)}
          </span>

          {isSharedTrip && (
            <span data-testid="visor-shared-badge" className="inline-flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3.5 py-[7px] rounded-full text-[#e0e7ff] text-[0.82rem] font-semibold border border-white/10">
              🤝 {t('hero.sharedBy', { ns: 'visor', name: ownerDisplayName || '...', defaultValue: 'Compartido por {{name}}' })}
            </span>
          )}
        </div>

        {(telemetry || homeStatus) && (
          <div className="flex items-center gap-2 flex-wrap">
            {telemetry && telemetry.totalDays > 0 && (
              <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-mono border border-white/15">
                {t('hero.days', { ns: 'visor', count: telemetry.totalDays, defaultValue: '{{count}} días' })}
              </span>
            )}
            {telemetry && telemetry.totalStops > 0 && (
              <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-mono border border-white/15">
                {t('hero.stops', { ns: 'visor', count: telemetry.totalStops, defaultValue: '{{count}} paradas' })}
              </span>
            )}
            {telemetry && telemetry.totalKm > 0 && (
              <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-mono border border-white/15">
                {formatKmLabel(telemetry.totalKm)}
              </span>
            )}
            {homeStatus?.type === 'local' && (
              <span data-testid="visor-home-local" className="backdrop-blur-md bg-mutedTeal/25 px-3 py-[6px] rounded-full text-[#9de4de] text-[0.78rem] font-semibold border border-mutedTeal/40">
                🏡 {t('hero.localBadge', { ns: 'visor', defaultValue: 'Aventura Local' })}
              </span>
            )}
            {homeStatus?.type === 'distance' && (
              <span data-testid="visor-home-distance" className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/15">
                ✈️ {t('hero.distanceBadge', { ns: 'visor', distance: formatKmLabel(homeStatus.distanceKm), city: homeStatus.baseCityName || '', defaultValue: 'A {{distance}} km de {{city}}' })}
              </span>
            )}
          </div>
        )}

        {onOpenStories && (
          <button
            type="button"
            onClick={onOpenStories}
            data-testid="documentary-hero-stories"
            className="inline-flex items-center justify-center gap-2 self-start bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-bold px-6 py-3 rounded-full transition-all shadow-md min-w-[240px]"
          >
            <Play size={16} fill="currentColor" /> {t('hero.storiesCta', { ns: 'visor', defaultValue: 'Revivir en Stories' })}
          </button>
        )}

        {isRouteMode && (
          <div data-testid="visor-storytelling" className="flex flex-col gap-2">
            <div className="flex gap-2 items-center flex-wrap">
              {data.presupuesto && (
                <span className="px-2.5 py-[5px] rounded-full backdrop-blur-md bg-black/40 text-white/90 text-[0.78rem] font-semibold border border-white/10">💰 {data.presupuesto}</span>
              )}
              {(data.vibe || []).map((vibe, index) => (
                <span key={index} className="px-2.5 py-[5px] rounded-full bg-atomicTangerine/20 text-[#ffd4b8] text-[0.78rem] font-semibold border border-atomicTangerine/25">{vibe}</span>
              ))}

              {data.companionType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-[5px] rounded-full backdrop-blur-md bg-black/40 text-white/90 text-[0.72rem] font-semibold border border-white/15">
                  {t(`context.companionType.${data.companionType}`, { ns: 'visor', defaultValue: data.companionType })}
                </span>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {(data.companions || []).slice(0, 4).map((companion, index) => {
                  const name = typeof companion === 'string' ? companion : (companion?.name || companion?.email || '');
                  if (!name) return null;
                  return (
                    <span
                      key={index}
                      title={name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/40 text-white/90 text-[0.72rem] font-bold border border-white/15"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#45B0A8]/25 text-white flex items-center justify-center text-[10px] font-extrabold">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[120px] truncate">{name}</span>
                    </span>
                  );
                })}
                {(data.companions || []).length > 4 && (
                  <span className="flex items-center text-[0.7rem] text-white font-black pl-1">+{(data.companions || []).length - 4}</span>
                )}
              </div>
            </div>

            {(data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip) && (
              <div className="flex gap-2 items-center flex-wrap">
                {data.highlights?.topFood && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">🍽️ {data.highlights.topFood}</span>}
                {data.highlights?.topView && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">👀 {data.highlights.topView}</span>}
                {data.highlights?.topTip && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">💡 {data.highlights.topTip}</span>}
              </div>
            )}
          </div>
        )}
      </Motion.div>
    </div>
  );
};

export default DocumentaryHero;
