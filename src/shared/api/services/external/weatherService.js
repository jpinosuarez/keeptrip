import { EXTERNAL_API_TIMEOUT_MS } from '@shared/lib/utils/viajeUtils';

const conTimeout = async (fn, fallbackValue, timeoutMs = EXTERNAL_API_TIMEOUT_MS) => {
  try {
    return await Promise.race([
      fn(),
      new Promise((resolve) => {
        setTimeout(() => resolve(fallbackValue), timeoutMs);
      })
    ]);
  } catch {
    return fallbackValue;
  }
};

const mapearCodigoClima = (code) => {
  let desc = 'Despejado';
  if (code > 3) desc = 'Nublado';
  if (code > 45) desc = 'Niebla';
  if (code > 50) desc = 'Lluvioso';
  if (code > 70) desc = 'Nieve';
  if (code > 95) desc = 'Tormenta';
  return desc;
};

export const obtenerClimaHistorico = async (lat, lng, fecha) => {
  if (lat == null || lng == null || !fecha) return null;

  try {
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${fecha}&end_date=${fecha}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    const data = await response.json();

    if (!data.daily?.weathercode || data.daily.weathercode.length === 0) return null;

    const code = data.daily.weathercode[0];
    const max = data.daily.temperature_2m_max?.[0] ?? null;
    return { desc: mapearCodigoClima(code), max, code };
  } catch {
    return null;
  }
};

export const obtenerClimaHistoricoSeguro = async (lat, lng, fecha) => {
  if (lat == null || lng == null || !fecha) return null;
  return conTimeout(() => obtenerClimaHistorico(lat, lng, fecha), null);
};
