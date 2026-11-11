import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCw, MapPin, Calendar, Compass, ArrowRight, Plus, ExternalLink, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CountryEmblem3D from './CountryEmblem3D';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

export default function CountryEmblemModal({ emblem, isOpen, onClose, onCreateTripForCountry }) {
  const { t, i18n } = useTranslation('hub');
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen || !emblem) return null;

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
    daysCount = 0,
    cities = [],
    firstVisitedAt,
    discoveryCode,
    trips = [],
    catalogSpec,
  } = emblem;

  const effectiveCode = countryCode || iso2 || 'XX';
  const localizedName = getLocalizedCountryName(effectiveCode, i18n.language) || countryName || effectiveCode;

  const handleOpenSingleTrip = (tripId) => {
    onClose?.();
    navigate(`/trips/${tripId}`);
  };

  const handleFilterTripsByCountry = () => {
    onClose?.();
    navigate(`/trips?country=${effectiveCode}`);
  };

  const handleCreateTrip = () => {
    onClose?.();
    if (onCreateTripForCountry) {
      onCreateTripForCountry(emblem);
    } else {
      navigate(`/trips?new=true&country=${effectiveCode}`);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-emblem-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      style={{ zIndex: 1200 }}
      onClick={onClose}
      data-testid="country-emblem-modal"
    >
      <div
        data-testid="country-emblem-modal-card"
        style={{ width: 'min(92vw, 520px)', maxWidth: '520px', minWidth: 'min(100%, 320px)' }}
        className="relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[32px] bg-white border border-slate-200 shadow-2xl p-5 sm:p-7 text-slate-800 shrink-0 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <CountryFlag code={effectiveCode} size="md" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {discoveryCode ? `${discoveryCode} · ` : ''}
              {iso3 || catalogSpec?.iso3 || effectiveCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:close', 'Cerrar')}
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <CountryEmblem3D
            catalogSpec={catalogSpec}
            countryCode={effectiveCode}
            discoveryCode={discoveryCode}
            firstVisitedAt={firstVisitedAt}
            isFlipped={isFlipped}
            status={status}
            tier={tier}
            variant="detail"
          />

          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="mt-4 min-h-[44px] px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            data-testid="emblem-flip-button"
          >
            <RotateCw className="text-[#FF6B35]" size={14} />
            <span>
              {isFlipped
                ? t('emblems.modal.viewFront', 'Ver anverso cromático')
                : t('emblems.modal.viewBack', 'Girar reverso grabado (180°)')}
            </span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <h2 id="country-emblem-modal-title" className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900">
            {localizedName}
          </h2>
          <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {stars > 0 && (
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                {[...Array(stars)].map((_, i) => (
                  <Star className="fill-amber-400 text-amber-400" key={i} size={12} />
                ))}
              </span>
            )}
            <span>{tierName}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('emblems.modal.visits', 'Viajes')}
            </span>
            <span className="mt-0.5 block font-mono text-lg font-extrabold text-slate-900">{visitsCount}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('emblems.modal.cities', 'Ciudades')}
            </span>
            <span className="mt-0.5 block font-mono text-lg font-extrabold text-slate-900">{cities.length}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('emblems.modal.days', 'Días')}
            </span>
            <span className="mt-0.5 block font-mono text-lg font-extrabold text-slate-900">{daysCount || '—'}</span>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MapPin className="text-[#FF6B35]" size={13} />
              <span>{t('emblems.modal.citiesExplored', 'Ciudades y paradas exploradas')}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => (
                <span key={city} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-sans text-xs font-semibold">
                  {city}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-200">
          {trips.length === 1 ? (
            <div data-testid="emblem-modal-single-trip">
              <button
                type="button"
                onClick={() => handleOpenSingleTrip(trips[0].id)}
                className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#FF6B35] hover:bg-[#e85a26] text-white font-sans font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>
                  {t('emblems.modal.openSingleTrip', 'Abrir viaje')}: {trips[0].titulo || localizedName}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : trips.length >= 2 ? (
            <div className="space-y-3" data-testid="emblem-modal-multi-trips">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="text-[#FF6B35]" size={13} />
                <span>
                  {t('emblems.modal.yourTripsInCountry', 'Tus viajes en')} {localizedName} ({trips.length})
                </span>
              </h3>

              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => handleOpenSingleTrip(trip.id)}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                    data-testid={`emblem-trip-item-${trip.id}`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-heading font-bold text-sm text-slate-800 truncate">
                        {trip.titulo || localizedName}
                      </p>
                      {trip.fechaInicio && (
                        <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          <span>{String(trip.fechaInicio).slice(0, 10)}</span>
                        </p>
                      )}
                    </div>
                    <ExternalLink className="text-[#FF6B35] shrink-0" size={15} />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFilterTripsByCountry}
                className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#FF6B35] hover:bg-[#e85a26] text-white font-sans font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                data-testid="emblem-filter-all-trips-btn"
              >
                <span>
                  {t('emblems.modal.viewAllFilteredTrips', {
                    count: trips.length,
                    defaultValue: `Ver los ${trips.length} viajes filtrados en Mis Viajes`,
                  })}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div data-testid="emblem-modal-zero-trips">
              <button
                type="button"
                onClick={handleCreateTrip}
                className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#FF6B35] hover:bg-[#e85a26] text-white font-sans font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                data-testid="emblem-create-trip-btn"
              >
                <Plus size={16} />
                <span>
                  {t('emblems.modal.createTripCta', {
                    country: localizedName,
                    defaultValue: `Crear viaje a ${localizedName} (+500 XP)`,
                  })}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}