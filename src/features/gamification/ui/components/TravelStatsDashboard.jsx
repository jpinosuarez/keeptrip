/**
 * TravelStatsDashboard — Deep Travel Analytics (Block 2.3)
 * 100% in-memory. Consumes `bitacora` + `bitacoraData` + `userProfile` via the
 * pure `useTravelAnalytics` hook. Zero additional Firestore reads.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe2,
  Route as RouteIcon,
  Compass,
  Clock,
  Calendar,
  TrendingUp,
  MapPin,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { CountryFlag } from '@shared/ui/components/CountryFlag';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';
import { formatLocalizedNumber, formatKmValue } from '@shared/lib/utils/numberUtils';
import { formatCardinalCoord } from '@features/gamification/model/travelAnalytics';
import { useTravelAnalytics } from '@features/gamification/model/hooks/useTravelAnalytics';

const CONTINENT_LABELS = { EU: 'Europa', AM: 'América', AS: 'Asia', AF: 'África', OC: 'Oceanía' };
const POLE_LABELS = { north: 'Norte', south: 'Sur', east: 'Este', west: 'Oeste' };
const POLE_KEYS = ['north', 'south', 'east', 'west'];

const isEnglishLanguage = (language) =>
  typeof language === 'string' && language.toLowerCase().startsWith('en');

const Card = ({ className, children }) => (
  <div className={cn('rounded-3xl bg-white border border-slate-200/80 shadow-sm p-5 min-w-0', className)}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={16} className="text-atomicTangerine" aria-hidden="true" />
    <h3 className="m-0 text-[0.78rem] font-extrabold uppercase tracking-widest text-charcoalBlue font-heading">
      {children}
    </h3>
  </div>
);

const TravelStatsDashboard = ({ trips = [], tripData = {}, userProfile = null }) => {
  const { t, i18n } = useTranslation('hub');
  const navigate = useNavigate();
  const language = i18n?.language || 'es';
  const [selectedYear, setSelectedYear] = useState('all');

  const analytics = useTravelAnalytics({ trips, tripData, userProfile, selectedYear });

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language, { month: 'short' });
    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(2021, index, 1)).replace('.', '')
    );
  }, [language]);

  const openTrip = useCallback((tripId) => {
    if (tripId) navigate(`/trips/${tripId}`);
  }, [navigate]);

  const countryName = useCallback(
    (code) => (code ? getLocalizedCountryName(code, language) || code : ''),
    [language]
  );

  if (!analytics.hasTrips) {
    return (
      <Card className="max-w-2xl mx-auto text-center flex flex-col items-center gap-3 py-10">
        <Globe2 size={40} className="text-atomicTangerine" aria-hidden="true" />
        <h2 className="m-0 text-xl font-black text-charcoalBlue font-heading">
          {t('statsDashboard.emptyTitle', 'Tu historia aún no tiene estadísticas')}
        </h2>
        <p className="m-0 max-w-sm text-sm font-semibold text-text-secondary">
          {t('statsDashboard.emptyMessage', 'Registra tu primera aventura y descubre tus continentes, distancias y días de viaje.')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-atomicTangerine text-white text-sm font-extrabold shadow-[0_4px_20px_rgba(255,107,53,0.3)] cursor-pointer hover:brightness-105 transition-all"
        >
          {t('statsDashboard.emptyCta', 'Registrar primera aventura')}
          <ArrowRight size={16} />
        </button>
      </Card>
    );
  }

  const {
    availableYears,
    yearBanner,
    totalKm,
    avgKmPerTrip,
    earthLaps,
    earthPercentage,
    continents,
    poles,
    farthestFromHome,
    totalDays,
    averageDaysPerTrip,
    longestTrip,
    pace,
    seasonality,
    topCountries,
    topCities,
    topCompanions,
    localTripsCount,
    internationalTripsCount,
  } = analytics;

  const hasPoles = POLE_KEYS.some((key) => Boolean(poles[key]));
  const peakMonth = seasonality.peakMonth;
  const maxMonthDays = Math.max(1, ...seasonality.months.map((month) => month.days));

  // Guard: the Farthest card only becomes a navigable Link when a tripId exists.
  const farthestTripId = farthestFromHome?.tripId || null;
  const FarthestWrapper = farthestTripId ? Link : 'div';

  const pillClass = (active) => cn(
    'min-h-[36px] px-4 rounded-full text-xs font-extrabold border transition-colors cursor-pointer',
    active
      ? 'bg-atomicTangerine text-white border-atomicTangerine shadow-[0_4px_20px_rgba(255,107,53,0.3)]'
      : 'bg-white text-slate-600 border-slate-200 hover:border-atomicTangerine/40 hover:text-atomicTangerine'
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Year segmented filter */}
      {availableYears.length > 0 && (
        <div
          role="tablist"
          aria-label={t('statsDashboard.filterLabel', 'Filtrar por año')}
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedYear === 'all'}
            onClick={() => setSelectedYear('all')}
            className={pillClass(selectedYear === 'all')}
          >
            {t('statsDashboard.filterAllYears', 'Todos los años')}
          </button>
          {availableYears.map((year) => {
            const value = String(year);
            const active = selectedYear === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedYear(value)}
                className={pillClass(active)}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {/* Year highlight banner */}
      {yearBanner && (
        <div className="rounded-2xl bg-atomicTangerine/10 border border-atomicTangerine/25 px-4 py-3 text-sm font-semibold text-charcoalBlue">
          {t('statsDashboard.yearBanner', {
            year: yearBanner.year,
            days: yearBanner.totalDays,
            percentage: yearBanner.percentage,
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {/* ROW 1 — Left column: stacked Odometer + Farthest */}
        <div className="flex flex-col gap-4">
          {/* Odometer */}
          <div className="flex-1 flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RouteIcon size={16} className="text-atomicTangerine" aria-hidden="true" />
                <h3 className="m-0 text-[0.78rem] font-extrabold uppercase tracking-widest text-charcoalBlue font-heading">
                  {t('statsDashboard.odometerTitle', 'Odómetro Global')}
                </h3>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-mono text-3xl md:text-4xl font-extrabold text-slate-900 leading-none">
                  {formatKmValue(totalKm, language)}
                </span>
                <span className="text-sm font-bold text-slate-500 mb-0.5">km</span>
              </div>
              <p className="mt-2 mb-0 text-xs font-semibold text-slate-500">
                {t('statsDashboard.earthLaps', 'Equivale a {{laps}} vueltas a la Tierra', { laps: earthLaps })}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-atomicTangerine transition-all duration-500"
                  style={{ width: `${earthPercentage}%` }}
                />
              </div>
              <p className="mt-1 mb-0 text-[0.7rem] font-bold text-slate-400">
                {earthPercentage}% {t('statsDashboard.earthPercentageLabel', 'de una vuelta al planeta')}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{t('statsDashboard.avgKmPerTrip', 'Promedio por viaje')}:</span>
              <span className="font-mono font-bold text-slate-700">{formatKmValue(avgKmPerTrip, language)} km</span>
            </div>
          </div>

          {/* Farthest point from home base — clickable card */}
          {farthestFromHome && (
            <FarthestWrapper
              {...(farthestTripId ? { to: `/trips/${farthestTripId}` } : {})}
              className="flex-1 flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#FF6B35]/40 transition-colors cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp size={16} className="text-[#FF6B35] shrink-0" aria-hidden="true" />
                    <h3 className="m-0 text-[0.78rem] font-extrabold uppercase tracking-widest text-charcoalBlue font-heading truncate">
                      {t('statsDashboard.farthestTitle', 'Punto más lejano de tu base')}
                    </h3>
                  </div>
                  <ArrowUpRight size={16} className="text-slate-400 group-hover:text-[#FF6B35] transition-colors shrink-0" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="font-mono text-2xl md:text-3xl font-extrabold text-slate-900 leading-none">
                    {formatKmValue(farthestFromHome.distanceKm, language)}
                  </span>
                  <span className="text-sm font-bold text-slate-500 mb-0.5">km</span>
                </div>
                <div className="mt-2 flex items-center flex-wrap gap-1">
                  {farthestFromHome.countryCode && <CountryFlag code={farthestFromHome.countryCode} size="sm" />}
                  <span className="font-bold text-slate-800 text-sm ml-1.5">
                    {farthestFromHome.cityName || countryName(farthestFromHome.countryCode)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 ml-2">
                    ({formatCardinalCoord(
                      farthestFromHome.latitude,
                      farthestFromHome.longitude,
                      isEnglishLanguage(language) ? 'W' : 'O'
                    )})
                  </span>
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                <span className="truncate">
                  {t('statsDashboard.straightLineFrom', 'En línea recta desde')}{' '}
                  <strong className="text-slate-700">{farthestFromHome.homeCityName}</strong>
                </span>
                <span className="text-[11px] text-[#FF6B35] font-semibold flex items-center gap-0.5 group-hover:underline truncate max-w-[45%]">
                  {farthestFromHome.tripTitle}
                </span>
              </div>
            </FarthestWrapper>
          )}
        </div>

        {/* Continents */}
        <Card>
          <SectionTitle icon={Globe2}>{t('statsDashboard.continentsTitle', 'Los 5 Continentes Clásicos')}</SectionTitle>
          <div className="flex flex-col gap-3">
            {continents.map((continent) => (
              <div key={continent.code}>
                <div className="flex items-center justify-between text-[0.72rem] font-bold text-slate-600 mb-1">
                  <span>
                    {t('statsDashboard.continents.' + continent.code, CONTINENT_LABELS[continent.code] || continent.code)}
                  </span>
                  <span className="font-mono">{continent.visitedCount}/{continent.totalCountries}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${continent.percentage}%`, backgroundColor: '#FF6B35' }}
                  />
                </div>
                {continent.visitedCountryCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {continent.visitedCountryCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200/70 px-1.5 py-0.5"
                      >
                        <CountryFlag code={code} size="xs" />
                        <span className="text-[0.62rem] font-bold text-slate-600">{code}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Cardinal extreme points */}
        {hasPoles && (
          <Card>
            <SectionTitle icon={Compass}>{t('statsDashboard.polesTitle', 'Brújula de Puntos Extremos')}</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {POLE_KEYS.map((key) => {
                const point = poles[key];
                if (!point) return null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => openTrip(point.tripId)}
                    disabled={!point.tripId}
                    className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 text-left min-h-[44px] cursor-pointer hover:border-atomicTangerine/40 hover:bg-atomicTangerine/5 transition-colors disabled:cursor-default"
                  >
                    <span className="text-[0.62rem] font-black uppercase tracking-widest text-atomicTangerine">
                      {t('statsDashboard.poles.' + key, POLE_LABELS[key])}
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0 w-full">
                      {point.countryCode && <CountryFlag code={point.countryCode} size="xs" />}
                      <span className="truncate text-xs font-bold text-charcoalBlue">
                        {point.cityName || countryName(point.countryCode)}
                      </span>
                    </span>
                    <span className="font-mono text-[0.62rem] text-slate-400">
                      {formatCardinalCoord(point.latitude, point.longitude, isEnglishLanguage(language) ? 'W' : 'O')}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Time & pace */}
        <Card className={!hasPoles ? 'md:col-span-2' : undefined}>
          <SectionTitle icon={Clock}>{t('statsDashboard.timeTitle', 'Tiempo y Ritmo de Viaje')}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-xl font-extrabold text-slate-900">{formatLocalizedNumber(totalDays, language)}</div>
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                {t('statsDashboard.totalDays', 'Días de viaje')}
              </div>
            </div>
            <div>
              <div className="font-mono text-xl font-extrabold text-slate-900">
                {formatLocalizedNumber(averageDaysPerTrip, language, { decimals: Number.isInteger(averageDaysPerTrip) ? 0 : 1 })}
              </div>
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                {t('statsDashboard.avgDays', 'Días prom./viaje')}
              </div>
            </div>
          </div>

          {longestTrip && (
            <button
              type="button"
              onClick={() => openTrip(longestTrip.id)}
              disabled={!longestTrip.id}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 border border-slate-200/70 px-3 py-2 min-h-[44px] cursor-pointer hover:border-atomicTangerine/40 transition-colors disabled:cursor-default"
            >
              <span className="flex flex-col items-start min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-widest text-atomicTangerine">
                  {t('statsDashboard.longestTrip', 'Mayor viaje')}
                </span>
                <span className="truncate text-xs font-bold text-charcoalBlue w-full text-left">
                  {longestTrip.title || t('statsDashboard.untitledTrip', 'Viaje sin título')}
                </span>
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900 shrink-0">{longestTrip.days}d</span>
            </button>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ['short', 'statsDashboard.paceShort', '<4d'],
              ['medium', 'statsDashboard.paceMedium', '5–14d'],
              ['long', 'statsDashboard.paceLong', '15+d'],
            ].map(([key, labelKey, hint]) => (
              <div key={key} className="rounded-xl bg-slate-50 border border-slate-200/60 py-2">
                <div className="font-mono text-lg font-extrabold text-slate-900">{pace[key]}</div>
                <div className="text-[0.62rem] font-bold text-slate-400">{t(labelKey, hint)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequent destinations & scope — full width */}
        <Card className="md:col-span-2">
          <SectionTitle icon={MapPin}>{t('statsDashboard.topDestinationsTitle', 'Destinos Frecuentes')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t('statsDashboard.topCountries', 'Países más visitados')}
              </div>
              <div className="flex flex-col gap-1.5">
                {topCountries.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : topCountries.map((country) => (
                  <div key={country.code} className="flex items-center gap-2">
                    <CountryFlag code={country.code} size="sm" />
                    <span className="text-xs font-bold text-charcoalBlue truncate flex-1">
                      {countryName(country.code)}
                    </span>
                    <span className="font-mono text-[0.7rem] text-slate-500">{country.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t('statsDashboard.topCities', 'Ciudades más visitadas')}
              </div>
              <div className="flex flex-col gap-1.5">
                {topCities.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : topCities.map((city) => (
                  <div key={city.name} className="flex items-center gap-2">
                    <MapPin size={12} className="text-atomicTangerine shrink-0" />
                    <span className="text-xs font-bold text-charcoalBlue truncate flex-1">{city.name}</span>
                    <span className="font-mono text-[0.7rem] text-slate-500">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t('statsDashboard.scopeTitle', 'Alcance de tus viajes')}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-atomicTangerine/10 text-atomicTangerine px-2.5 py-1 text-xs font-bold">
                  {t('statsDashboard.localTrips', '{{count}} locales', { count: localTripsCount })}
                </span>
                <span className="rounded-full bg-mutedTeal/10 text-mutedTeal px-2.5 py-1 text-xs font-bold">
                  {t('statsDashboard.internationalTrips', '{{count}} internacionales', { count: internationalTripsCount })}
                </span>
              </div>
              {topCompanions.length > 0 && (
                <div className="mt-3">
                  <div className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {t('statsDashboard.topCompanions', 'Compañeros de viaje')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topCompanions.map((companion) => (
                      <span
                        key={companion.name}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-bold text-slate-600"
                      >
                        {companion.name} · {companion.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Seasonality — full width, final row */}
        {seasonality.hasData && (
          <Card className="md:col-span-2">
            <SectionTitle icon={Calendar}>{t('statsDashboard.seasonalityTitle', 'Estacionalidad Anual')}</SectionTitle>
            <div className="flex items-end gap-1.5 h-40 mt-4">
              {seasonality.months.map((month) => {
                const isPeak = peakMonth === month.month;
                const barHeight = Math.max(6, Math.round((month.days / maxMonthDays) * 100));
                const tooltipLabel = t('statsDashboard.monthTooltip', '{{month}}: {{days}} días · {{trips}} viajes', {
                  month: monthLabels[month.month],
                  days: month.days,
                  trips: month.trips,
                });
                return (
                  <div key={month.month} className="flex-1 h-full min-w-0 flex flex-col items-center justify-end gap-1">
                    <div className="group relative w-full flex-1 min-h-0 rounded-lg bg-slate-100">
                      <div
                        className="absolute inset-x-0.5 bottom-0 rounded-t-md transition-[height] duration-500"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: isPeak ? '#FF6B35' : '#CBD5E1',
                          boxShadow: isPeak ? '0 0 12px rgba(255,107,53,0.45)' : undefined,
                        }}
                        title={tooltipLabel}
                      />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2C3E50] px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm">
                        {tooltipLabel}
                      </span>
                    </div>
                    <span className={cn('text-[0.58rem] font-bold', isPeak ? 'text-atomicTangerine' : 'text-slate-400')}>
                      {monthLabels[month.month]}
                    </span>
                  </div>
                );
              })}
            </div>
            {peakMonth !== null && (
              <p className="mt-2 mb-0 text-xs font-semibold text-slate-500">
                {t('statsDashboard.peakMonth', 'Tu mes más viajero: {{month}}', { month: monthLabels[peakMonth] })}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default TravelStatsDashboard;



