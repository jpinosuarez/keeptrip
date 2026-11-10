import React from 'react';
import { Heart, Home, Star, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CountryEmblem3D from './CountryEmblem3D';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

function renderIdentityBadge(identityBadge, t) {
  if (!identityBadge) return null;

  if (identityBadge.type === 'roots_and_base') {
    return (
      <span
        style={{ backgroundColor: '#45B0A8', borderColor: '#2C3E50' }}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white border-2 shadow-xs whitespace-nowrap"
        data-testid="identity-badge-roots-and-base"
      >
        <Heart className="fill-current" size={10} />
        <Home size={10} />
        <span>{t('emblems.identity.rootsAndBase', 'Raíces y Base')}</span>
      </span>
    );
  }

  if (identityBadge.type === 'roots') {
    return (
      <span
        style={{ backgroundColor: '#2C3E50' }}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs whitespace-nowrap"
        data-testid="identity-badge-roots"
      >
        <Heart className="fill-current" size={10} />
        <span>{t('emblems.identity.roots', 'Raíces')}</span>
      </span>
    );
  }

  if (identityBadge.type === 'base') {
    return (
      <span
        style={{ backgroundColor: '#45B0A8' }}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs whitespace-nowrap"
        data-testid="identity-badge-base"
      >
        <Home size={10} />
        <span>{t('emblems.identity.base', 'Mi Base')}</span>
      </span>
    );
  }

  return null;
}

export default function CountryEmblemCard({ emblem, variant = 'card', onSelect, className }) {
  const { t, i18n } = useTranslation('hub');
  if (!emblem) return null;

  const {
    countryCode,
    iso2,
    iso3,
    countryName,
    status = 'visited',
    tier = 'explorador',
    stars = 1,
    tierName = 'Explorador',
    visitsCount = 0,
    cities = [],
    firstVisitedAt,
    discoveryCode,
    identityBadge,
    catalogSpec,
  } = emblem;

  const effectiveCode = countryCode || iso2 || 'XX';
  const localizedName = getLocalizedCountryName(effectiveCode, i18n.language) || countryName || effectiveCode;
  const isLocked = status === 'locked' || tier === 'locked';
  const isWishlist = status === 'wishlist' || tier === 'wishlist';
  const isLegend = tier === 'leyenda';
  const yearLabel = firstVisitedAt ? String(firstVisitedAt).slice(0, 4) : null;

  if (variant === 'thumbnail') {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(emblem)}
        title={`${localizedName} (${tierName})`}
        className={cn(
          'relative inline-flex items-center justify-center p-1 rounded-2xl bg-slate-900 border border-slate-700 hover:scale-105 transition-transform cursor-pointer',
          className,
        )}
        data-testid={`emblem-card-thumbnail-${effectiveCode}`}
      >
        <CountryEmblem3D
          catalogSpec={catalogSpec}
          countryCode={effectiveCode}
          interactive={false}
          status={status}
          tier={tier}
          variant="thumbnail"
        />
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(emblem)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(emblem);
        }
      }}
      className={cn(
        'group relative w-full rounded-[28px] border p-4 md:p-5 flex flex-col items-center justify-between text-center transition-all duration-300 cursor-pointer select-none overflow-hidden box-border',
        isLegend
          ? 'bg-slate-900 border-amber-400/60 text-white shadow-[0_8px_30px_rgba(245,158,11,0.18)] hover:shadow-[0_12px_36px_rgba(255,107,53,0.28)]'
          : isLocked
            ? 'bg-slate-50/70 border-slate-200/80 text-slate-500 opacity-80 hover:opacity-100'
            : isWishlist
              ? 'bg-[#F8FAFC] border-[#45B0A8]/40 border-dashed hover:border-[#45B0A8] text-slate-800 shadow-xs hover:shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
        className,
      )}
      data-testid={`emblem-card-${effectiveCode}`}
      data-status={status}
      data-tier={tier}
    >
      <div className="w-full flex items-center justify-between gap-1.5 mb-3 z-10">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wider uppercase',
            isLegend ? 'bg-slate-800 text-amber-300 border border-amber-400/30' : 'bg-slate-100 text-slate-600',
          )}
        >
          <CountryFlag code={effectiveCode} size="xs" />
          <span>
            {discoveryCode ? `${discoveryCode} · ` : ''}
            {iso3 || catalogSpec?.iso3 || effectiveCode}
          </span>
        </span>

        <div className="flex items-center gap-1">
          {renderIdentityBadge(identityBadge, t)}
          {catalogSpec?.isMicrostate && (
            <span
              title={t('emblems.microstateHint', 'Microestado — Vista con lupa cartográfica')}
              className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-mono text-[9px] font-bold"
            >
              LUPA
            </span>
          )}
        </div>
      </div>

      <div className="my-1 z-10 flex items-center justify-center">
        <CountryEmblem3D
          catalogSpec={catalogSpec}
          countryCode={effectiveCode}
          discoveryCode={discoveryCode}
          firstVisitedAt={firstVisitedAt}
          status={status}
          tier={tier}
          variant="card"
        />
      </div>

      <div className="w-full mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-col items-center z-10">
        <h4
          className={cn(
            'w-full font-heading font-extrabold text-base md:text-lg tracking-tight truncate',
            isLegend ? 'text-white' : isLocked ? 'text-slate-500' : 'text-slate-800',
          )}
        >
          {localizedName}
        </h4>

        <div className="mt-1 flex items-center justify-center gap-1.5">
          {stars > 0 ? (
            <div className="flex items-center gap-0.5" aria-label={`${stars}/5`}>
              {[1, 2, 3, 4, 5].map((idx) => (
                <Star
                  key={idx}
                  size={11}
                  className={cn(
                    idx <= stars
                      ? 'fill-amber-400 text-amber-400'
                      : isLegend
                        ? 'text-slate-700'
                        : 'text-slate-200',
                  )}
                />
              ))}
            </div>
          ) : isWishlist ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#45B0A8]">
              <Sparkles size={11} />
              <span>{t('emblems.tiers.wishlist', 'En Wishlist')}</span>
            </span>
          ) : null}

          <span
            className={cn(
              'font-sans text-[11px] font-bold',
              isLegend ? 'text-amber-300' : isWishlist ? 'text-[#45B0A8]' : 'text-slate-500',
            )}
          >
            {stars > 0 ? tierName : !isWishlist ? tierName : ''}
          </span>
        </div>

        <div className="mt-2 w-full flex items-center justify-center gap-2 font-mono text-[11px]">
          {visitsCount > 0 ? (
            <>
              <span className={cn('font-semibold', isLegend ? 'text-slate-300' : 'text-slate-600')}>
                {visitsCount} {visitsCount === 1 ? t('emblems.tripSingular', 'viaje') : t('emblems.tripPlural', 'viajes')}
              </span>
              {cities.length > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className={cn(isLegend ? 'text-slate-300' : 'text-slate-600')}>
                    {cities.length} {cities.length === 1 ? t('emblems.citySingular', 'ciudad') : t('emblems.cityPlural', 'ciudades')}
                  </span>
                </>
              )}
              {yearLabel && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[#FF6B35] font-bold">{yearLabel}</span>
                </>
              )}
            </>
          ) : isWishlist ? (
            <span className="text-[#45B0A8] font-sans text-xs font-semibold">
              {t('emblems.wishlistPrompt', '+500 XP al conquistar')}
            </span>
          ) : (
            <span className="text-slate-400 font-sans text-xs">
              {t('emblems.lockedPrompt', 'Pendiente de explorar')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
