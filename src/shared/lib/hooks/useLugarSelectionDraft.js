import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COUNTRIES_DATA, getFlagUrl, normalizeCountryCode } from '@shared/lib/utils/countryUtils';

export function useLugarSelectionDraft({
  closeBuscador,
  setFiltro,
  setViajeBorrador,
  setCiudadInicialBorrador,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((lugar) => {
    let datosPais = null;
    let ciudad = null;
    const coordenadasLugar = Array.isArray(lugar.coordinates) ? lugar.coordinates : null;

    if (lugar.isCountry) {
      const codigoPais = normalizeCountryCode(lugar.code || lugar.countryCode || '') || '';
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
        // Selection token ensures editor resets even if the same city is picked again
        _selectionId: `${Date.now()}`,
      };
    } else {
      const codigoPais = normalizeCountryCode(lugar.countryCode || lugar.code || '') || '';
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
        flag: getFlagUrl(codigoPais),
        // Selection token ensures editor resets even if the same city is picked again
        _selectionId: `${Date.now()}`,
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

    // Deep-link the draft so a browser refresh (F5) preserves the open editor.
    navigate(`${location.pathname}?new=true`);
  }, [
    closeBuscador,
    setFiltro,
    setViajeBorrador,
    setCiudadInicialBorrador,
    navigate,
    location.pathname,
  ]);
}
