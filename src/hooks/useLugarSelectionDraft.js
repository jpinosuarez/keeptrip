import { useCallback } from 'react';
import { COUNTRIES_DATA, getFlagUrl } from '../utils/countryUtils';

export function useLugarSelectionDraft({
  closeBuscador,
  setFiltro,
  setViajeBorrador,
  setCiudadInicialBorrador,
}) {
  return useCallback((lugar) => {
    let datosPais = null;
    let ciudad = null;

    if (lugar.esPais) {
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === lugar.code);
      datosPais = {
        code: lugar.code,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.nombre,
        flag: getFlagUrl(lugar.code),
        continente: 'Mundo',
        latlng: lugar.coordenadas
      };
    } else {
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === lugar.paisCodigo);
      datosPais = {
        code: lugar.paisCodigo,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.paisNombre,
        flag: getFlagUrl(lugar.paisCodigo)
      };
      ciudad = {
        nombre: lugar.nombre,
        coordenadas: lugar.coordenadas,
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: lugar.paisCodigo,
        flag: getFlagUrl(lugar.paisCodigo)
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
      foto: null
    };

    setViajeBorrador(nuevoBorrador);
    setCiudadInicialBorrador(ciudad);
  }, [closeBuscador, setFiltro, setViajeBorrador, setCiudadInicialBorrador]);
}
