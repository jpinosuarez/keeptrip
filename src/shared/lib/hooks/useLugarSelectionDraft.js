import { useCallback } from 'react';
import { COUNTRIES_DATA, getFlagUrl } from '@shared/lib/utils/countryUtils';

export function useLugarSelectionDraft({
  closeBuscador,
  setFiltro,
  setViajeBorrador,
  setCiudadInicialBorrador,
  setViajeEnEdicionId,
  setViajeExpandidoId,
}) {
  return useCallback((lugar) => {
    let datosPais = null;
    let ciudad = null;
    const coordenadasLugar = Array.isArray(lugar.coordenadas) ? lugar.coordenadas : null;

    if (lugar.esPais) {
      const codigoPais = (lugar.code || lugar.paisCodigo || '').toUpperCase();
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === codigoPais);
      datosPais = {
        code: codigoPais,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.nombre,
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
      const codigoPais = (lugar.paisCodigo || lugar.code || '').toUpperCase();
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === codigoPais);
      datosPais = {
        code: codigoPais,
        nombreEspanol: paisInfo ? paisInfo.name : (lugar.paisNombre || lugar.nombre),
        flag: getFlagUrl(codigoPais),
        latlng: coordenadasLugar,
        coordenadas: coordenadasLugar,
      };
      ciudad = {
        nombre: lugar.nombre,
        coordenadas: coordenadasLugar,
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: codigoPais,
        flag: getFlagUrl(codigoPais)
      };
    }

    setViajeEnEdicionId?.(null);
    setViajeExpandidoId?.(null);
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
    };

    setViajeBorrador(nuevoBorrador);
    setCiudadInicialBorrador(ciudad);
  }, [
    closeBuscador,
    setFiltro,
    setViajeBorrador,
    setCiudadInicialBorrador,
    setViajeEnEdicionId,
    setViajeExpandidoId,
  ]);
}
