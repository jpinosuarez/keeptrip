const buildFlagUrl = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') return [];
  return [`https://flagcdn.com/${countryCode.toLowerCase()}.svg`];
};

const resolveCities = (trip) => {
  if (typeof trip?.ciudades === 'string' && trip.ciudades.trim().length > 0) {
    return trip.ciudades;
  }

  if (Array.isArray(trip?.paradas) && trip.paradas.length > 0) {
    return trip.paradas
      .map((stop) => (typeof stop?.nombre === 'string' ? stop.nombre.trim() : ''))
      .filter(Boolean)
      .join(', ');
  }

  return '';
};

export const mapLandingMockTripToCard = (trip) => ({
  ...trip,
  foto: trip?.coverUrl || trip?.foto || '',
  fechaInicio: trip?.fechaInicio || trip?.startDate || '',
  fechaFin: trip?.fechaFin || trip?.endDate || '',
  ciudades: resolveCities(trip),
  banderas: buildFlagUrl(trip?.paisCodigo || trip?.countryCode),
});
