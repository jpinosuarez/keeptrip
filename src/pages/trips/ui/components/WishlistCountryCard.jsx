import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, MapPin, Trash2, Plane, X } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { getCountryISO3, getCountryName } from '@shared/lib/utils/countryUtils';
import { COUNTRIES_DB } from '../../../../assets/sellos';

// ISO-3 → continent lookup (COUNTRIES_DB keys are ISO-3 codes).
const CONTINENT_BY_ISO3 = new Map(COUNTRIES_DB.map((country) => [country.code, country.continente]));
const CONTINENT_KEYS = new Set(['americas', 'europe', 'asia', 'africa', 'oceania']);

/**
 * WishlistCountryCard — editorial Bento card for one wishlisted country.
 * Header: flag + name + translated continent + delete-all. Body: per-city
 * removable pills (or a "whole country" badge). Footer: refined conversion CTA.
 */
const WishlistCountryCard = ({ group, onDeleteCountry, onDeleteItem, onCreateTrip }) => {
  const { t } = useTranslation('dashboard');

  const iso3 = getCountryISO3(group.paisCodigo);
  const continentRaw = CONTINENT_BY_ISO3.get(iso3) || '';
  const continentKey = continentRaw.toLowerCase();
  const continentLabel = CONTINENT_KEYS.has(continentKey)
    ? t(`wishlist.continents.${continentKey}`, continentRaw)
    : continentRaw;
  const countryName = group.paisNombre || getCountryName(group.paisCodigo) || group.paisCodigo;

  return (
    <div className="flex flex-col p-5 rounded-[24px] bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      {/* Header */}
      <div className="flex items-start gap-3">
        <CountryFlag code={group.paisCodigo} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-bold text-base text-slate-900 truncate">{countryName}</h3>
          {continentLabel && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {continentLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDeleteCountry?.(group)}
          aria-label={t('wishlist.deleteCountry', 'Quitar país de la Wishlist')}
          title={t('wishlist.deleteCountry', 'Quitar país de la Wishlist')}
          className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Body: per-city removable pills, or a whole-country badge */}
      <div className="mt-4">
        {group.ciudades.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {group.ciudades.map((city) => (
              <span
                key={city.id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#45B0A8]/10 border border-[#45B0A8]/25 text-xs font-semibold text-[#2C3E50]"
              >
                <MapPin className="text-[#45B0A8] shrink-0" size={12} />
                <span>{city.nombre}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem?.(city.id);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-[#45B0A8]/20 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-0.5"
                  title={`Quitar ${city.nombre}`}
                  aria-label={`Quitar ${city.nombre}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs italic text-slate-400">
            {t('wishlist.wholeCountry', 'País en lista de deseos')}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          {group.ciudades?.length > 0 ? (
            <>
              <MapPin className="text-[#45B0A8]" size={12} />
              <span>{group.ciudades.length === 1 ? '1 ciudad' : `${group.ciudades.length} ciudades`}</span>
            </>
          ) : (
            <>
              <Globe className="text-[#45B0A8]" size={12} />
              <span>{t('dashboard:wishlist.countryComplete', 'País completo')}</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => onCreateTrip?.(group)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#FF6B35] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Plane size={13} />
          {t('wishlist.createTrip', 'Crear viaje')}
        </button>
      </div>
    </div>
  );
};

export default WishlistCountryCard;
