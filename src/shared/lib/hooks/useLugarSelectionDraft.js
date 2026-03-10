import { useCallback } from 'react';
import { COUNTRIES_DATA, getFlagUrl } from '@shared/lib/utils/countryUtils';

export function useLugarSelectionDraft({
  closeBuscador,
  setFiltro,
  setViajeBorrador,
  setCiudadInicialBorrador,
}) {
  return useCallback((lugar) => {
    let datosPais = null;
    let ciudad = null;
    const coordenadasLugar = Array.isArray(lugar.coordinates) ? lugar.coordinates : null;

    if (lugar.isCountry) {
      const codigoPais = (lugar.code || lugar.countryCode || '').toUpperCase();
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === codigoPais);
      datosPais = {
        code: codigoPais,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.name,
        flag: getFlagUrl(codigoPais),
        continente: 'Mundo',
        latlng: coordenadasLugar,
        coordenadas: coordenadasLugar,
      };

      ciudad = {
        nombre: datosPais.nombreEspanol,
        coordenadas: coordenadasLugar || [0, 0],
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: codigoPais,
        flag: getFlagUrl(codigoPais),
      };
    } else {
      const codigoPais = (lugar.countryCode || lugar.code || '').toUpperCase();
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === codigoPais);
      datosPais = {
        code: codigoPais,
        nombreEspanol: paisInfo ? paisInfo.name : (lugar.countryName || lugar.name),
        flag: getFlagUrl(codigoPais),
        latlng: coordenadasLugar,
        coordenadas: coordenadasLugar,
      };
      ciudad = {
        nombre: lugar.name,
        coordenadas: coordenadasLugar,
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: codigoPais,
        flag: getFlagUrl(codigoPais)
      };
    }

    closeBuscador();
    setFiltro('');

    const nuevoBorrador = {
      id: 'new',
      code: datosPais.code,
      nombreEspanol: datosPais.nombreEspanol,
      flag: datosPais.flag,
      continente: 'Mundo',
      titulo: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      foto: null,
      latlng: datosPais.latlng || null,
      coordenadas: datosPais.coordenadas || null,
      vibe: [],
      highlights: { topFood: '', topView: '', topTip: '' },
      companions: [],
      texto: '',
      presupuesto: null,
    };

    setViajeBorrador(nuevoBorrador);
    setCiudadInicialBorrador(ciudad);
  }, [
    closeBuscador,
    setFiltro,
    setViajeBorrador,
    setCiudadInicialBorrador,
  ]);
}
