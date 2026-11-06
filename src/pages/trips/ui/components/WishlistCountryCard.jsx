import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plane, MapPin } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { getCountryISO3, getCountryName } from '@shared/lib/utils/countryUtils';
import { COUNTRIES_DB } from '../../../../assets/sellos';

// ISO-3 → continent lookup (COUNTRIES_DB keys are ISO-3 codes).
const CONTINENT_BY_ISO3 = new Map(COUNTRIES_DB.map((country) => [country.code, country.continente]));

/**
 * WishlistCountryCard — editorial Bento card for one wishlisted country.
 * Header: flag + country + continent. Body: saved city pills. Footer: delete + create.
 */
const WishlistCountryCard = ({ group, onRemove, onCreateTrip }) => {
  const { t } = useTranslation('dashboard');

  const iso3 = getCountryISO3(group.paisCodigo);
  const continent = CONTINENT_BY_ISO3.get(iso3) || '';
  const countryName = group.paisNombre || getCountryName(group.paisCodigo) || group.paisCodigo;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[24px] bg-white border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3">
        <CountryFlag code={group.paisCodigo} size="xl" />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-lg font-extrabold text-[#1E293B] font-heading">
            {countryName}
          </h3>
          {continent && (
            <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#64748B]">
              {continent}
            </span>
          )}
        </div>
      </div>

      {group.ciudades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {group.ciudades.map((city) => (
            <span
              key={city.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#45B0A8]/12 text-[#2C3E50] text-[0.78rem] font-semibold"
            >
              <MapPin size={12} className="text-[#45B0A8]" />
              {city.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onRemove?.(group)}
          aria-label={t('wishlist.remove', 'Quitar de la Wishlist')}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border border-[#E2E8F0] bg-white text-[#64748B] cursor-pointer hover:text-danger hover:border-danger/40 transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onCreateTrip?.(group)}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-[#FF6B35] text-white font-bold border-none cursor-pointer shadow-[0_6px_20px_rgba(255,107,53,0.35)] font-heading"
        >
          <Plane size={15} />
          {t('wishlist.createTrip', 'Crear viaje')}
        </button>
      </div>
    </div>
  );
};

export default WishlistCountryCard;
