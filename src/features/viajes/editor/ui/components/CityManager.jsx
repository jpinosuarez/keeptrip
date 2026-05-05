import { cn } from '@shared/lib/utils/cn';
import React, { useState, useEffect } from 'react';
import { MapPin, ArrowUp, ArrowDown, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { parseFlexibleDate } from '@shared/lib/utils/viajeUtils';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';

const createStopInstanceId = (feature) => {
  const baseId = feature.id || `${feature.text}-${feature.center?.[0]}-${feature.center?.[1]}`;
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `temp-${baseId}-${uuid}`;
};

const CityManager = ({ t, paradas, setParadas, tripStartDate, isReadOnlyMode = false }) => {
  const { i18n, t: searchT } = useTranslation(['search', 'common']);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyActive = isReadOnlyMode || Boolean(appReadonlyMode) || operationalLevel >= 3;
  const isSearchPaused = operationalLevel >= 1;
  const shouldBlockSearchResults = isSearchPaused || isReadOnlyActive;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Local state for dates to prevent focus loss/cursor jumping during manual entry
  const [tempDates, setTempDates] = useState({});
  const visibleSearchResults = shouldBlockSearchResults ? [] : searchResults;
  
  // Búsqueda reactiva (3 chars)
  useEffect(() => {
    if (isSearchPaused) return;

    if (searchQuery.length < 3) {
        return;
    }
    const timer = setTimeout(async () => {
        try {
            const lang = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
            const data = await fetchGeocoding({
              query: searchQuery,
              language: lang,
              types: 'place',
            });
            setSearchResults(data.features || []);
        } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, i18n.language, i18n.resolvedLanguage, isSearchPaused]);

  const agregarCiudad = (feature) => {
    if (isReadOnlyActive) return;

    const contextCountry = feature.context?.find(c => c.id.startsWith('country'));
    const countryCode = contextCountry?.short_code?.toUpperCase();

    setParadas((prevParadas) => {
      const generatedId = createStopInstanceId(feature);

      const nuevaParada = {
        id: generatedId,
        nombre: feature.text,
        coordenadas: feature.center,
        fechaLlegada: '',
        fechaSalida: '',
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: countryCode,
        flag: getFlagUrl(countryCode), // Guardar URL SVG
        transporte: null,
        notaCorta: '',
      };

      return [...prevParadas, nuevaParada];
    });

    setSearchQuery('');
    setSearchResults([]);
  };

  const moverParada = (index, direccion) => {
    if (isReadOnlyActive) return;

    const nuevas = [...paradas];
    const item = nuevas.splice(index, 1)[0];
    nuevas.splice(index + direccion, 0, item);
    setParadas(nuevas);
  };

  const actualizarDato = (index, campo, valor) => {
    if (isReadOnlyActive) return;

    setParadas((prevParadas) => {
      const nuevas = [...prevParadas];
      const target = { ...nuevas[index] };

      // Si es una fecha de input type="date", el valor viene como YYYY-MM-DD
      if ((campo === 'fechaLlegada' || campo === 'fechaSalida') && valor && valor.includes('-')) {
        const parts = valor.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          target[campo] = `${d}/${m}/${y}`;
        } else {
          target[campo] = valor;
        }
        
        if (campo === 'fechaLlegada') {
          const iso = parseFlexibleDate(target[campo]);
          if (iso) target.fecha = iso;
        }
      } else {
        target[campo] = valor;
      }

      nuevas[index] = target;
      return nuevas;
    });
  };

  const eliminarParada = (index) => {
    if (isReadOnlyActive) return;

    const nuevas = [...paradas];
    nuevas.splice(index, 1);
    setParadas(nuevas);
  };

  const getMinArrivalDate = (index) => {
    if (index > 0) {
      const prev = paradas[index - 1];
      if (prev.fechaSalida) return prev.fechaSalida.split('/').reverse().join('-');
      if (prev.fechaLlegada) return prev.fechaLlegada.split('/').reverse().join('-');
    }
    return tripStartDate ? tripStartDate.split('/').reverse().join('-') : '';
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <div className="flex-1 flex items-center gap-2 min-h-[44px] bg-background border border-border rounded-md px-3">
          <Search size={16} className="text-textSecondary" />
          <input
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              if (value.length < 3) setSearchResults([]);
            }}
            placeholder={t('citymanager.searchPlaceholder', '🔍 Add new stop to your route')}
            className="border-none bg-transparent py-3 w-full outline-none text-base"
            disabled={isSearchPaused || isReadOnlyActive}
          />
        </div>
      </div>

      {isSearchPaused && (
        <div className="border border-border rounded-md px-3.5 py-3 bg-atomicTangerine/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT(
            'search:pausedMessage',
            'Search temporarily paused while we stabilize map services. Your saved trips remain available.'
          )}
        </div>
      )}

      {isReadOnlyActive && (
        <div className="border border-border rounded-md px-3.5 py-3 bg-[#2C3E50]/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT(
            'common:operational.readOnlyBanner',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          )}
        </div>
      )}

      {visibleSearchResults.length > 0 && (
        <div className="bg-surface border border-border rounded-md overflow-hidden max-h-[180px] overflow-y-auto shadow-md">
          {visibleSearchResults.map((res, resIdx) => {
            // Extraer país para el icono en resultados
            const contextCountry = res.context?.find(c => c.id.startsWith('country'));
            const code = contextCountry?.short_code?.toUpperCase();
            const flag = getFlagUrl(code);
            const countryLabel = getLocalizedCountryName(code, i18n.language, t) || contextCountry?.text || '';

            return (
                <div key={res.id || `result-${resIdx}`} className="p-3.5 border-b border-background cursor-pointer text-[0.9rem] flex justify-between items-center hover:bg-background">
                <div className="flex items-center gap-2.5">
                    {flag ? (
                      <img
                        src={flag}
                        alt="flag"
                        className="w-7 h-7 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <MapPin size={16} className="text-textSecondary" />
                    )}
                    <span className="flex-1 min-w-0">
                      {res.text},{' '}
                      <span className="text-textSecondary text-[0.8rem]">
                        {countryLabel}
                      </span>
                    </span>
                </div>
                <button
                  type="button"
                  onClick={() => agregarCiudad(res)}
                  className={cn(
                    "bg-transparent border-[1.5px] border-atomicTangerine rounded-full min-h-[44px] min-w-[44px] px-3.5 py-2.5 text-atomicTangerine text-[0.75rem] font-bold cursor-pointer transition-all outline-none flex items-center gap-1.5 hover:bg-atomicTangerine/5 active:translate-y-[1px]",
                    isReadOnlyActive && "opacity-55 cursor-not-allowed"
                  )}
                  aria-label={t('button.add') || '+ Add destination'}
                  disabled={isReadOnlyActive}
                >
                  <Plus size={14} /> {t('button.add', '+ Add destination')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {paradas.map((p, index) => (
          <div key={p.id ?? `parada-${index}-${p.nombre}`} className="bg-surface border border-border p-3.5 rounded-md shadow-sm" data-testid="editor-stop-item">
            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2">
                   {p.flag && <img src={p.flag} alt="flag" className="w-6 rounded-sm border border-slate-100" />}
                   <span className="font-bold text-[0.95rem] text-charcoalBlue">{p.nombre}</span>
               </div>
               <div className="flex gap-1.5">
                  <button
                    type="button"
                    data-testid="editor-stop-move-up"
                    aria-label={t('citymanager.moveStopUp', 'Move stop up')}
                    disabled={index === 0 || isReadOnlyActive}
                    onClick={() => moverParada(index, -1)}
                    className="bg-background border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-textSecondary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    data-testid="editor-stop-move-down"
                    aria-label={t('citymanager.moveStopDown', 'Move stop down')}
                    disabled={index === paradas.length - 1 || isReadOnlyActive}
                    onClick={() => moverParada(index, 1)}
                    className="bg-background border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-textSecondary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    data-testid="editor-stop-delete"
                    aria-label={t('citymanager.deleteStop', 'Delete stop')}
                    onClick={() => eliminarParada(index)}
                    className="bg-danger/10 border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-danger flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={isReadOnlyActive}
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
            
            <div className="flex gap-3.5 flex-wrap">
                <div className="flex-[1_1_120px] min-w-0 flex flex-col gap-1">
                    <label className="text-[0.7rem] uppercase text-textSecondary font-bold">{t('citymanager.arrival') || 'Arrival'}</label>
                    <input
                      type="date"
                      value={tempDates[`${index}-arrival`] ?? (p.fechaLlegada?.split('/').length === 3 
                        ? p.fechaLlegada.split('/').reverse().map((part, i) => i === 0 ? part.padStart(4, '0') : part.padStart(2, '0')).join('-')
                        : '')}
                      min={getMinArrivalDate(index)}
                      onChange={(e) => setTempDates(prev => ({ ...prev, [`${index}-arrival`]: e.target.value }))}
                      onBlur={(e) => {
                        actualizarDato(index, 'fechaLlegada', e.target.value);
                        setTempDates(prev => {
                          const next = { ...prev };
                          delete next[`${index}-arrival`];
                          return next;
                        });
                      }}
                      className="w-full box-sizing-border-box min-h-[48px] border border-border rounded-md px-3.5 py-3 text-base font-inherit text-charcoalBlue bg-background outline-none cursor-pointer transition-all shadow-sm"
                      disabled={isReadOnlyActive}
                    />
                </div>
                <div className="flex-[1_1_120px] min-w-0 flex flex-col gap-1">
                    <label className="text-[0.7rem] uppercase text-textSecondary font-bold">{t('citymanager.departure') || 'Departure'}</label>
                    <input
                      type="date"
                      value={tempDates[`${index}-departure`] ?? (p.fechaSalida?.split('/').length === 3 
                        ? p.fechaSalida.split('/').reverse().map((part, i) => i === 0 ? part.padStart(4, '0') : part.padStart(2, '0')).join('-')
                        : '')}
                      min={p.fechaLlegada ? p.fechaLlegada.split('/').reverse().join('-') : getMinArrivalDate(index)}
                      onChange={(e) => setTempDates(prev => ({ ...prev, [`${index}-departure`]: e.target.value }))}
                      onBlur={(e) => {
                        actualizarDato(index, 'fechaSalida', e.target.value);
                        setTempDates(prev => {
                          const next = { ...prev };
                          delete next[`${index}-departure`];
                          return next;
                        });
                      }}
                      className="w-full box-sizing-border-box min-h-[48px] border border-border rounded-md px-3.5 py-3 text-base font-inherit text-charcoalBlue bg-background outline-none cursor-pointer transition-all shadow-sm"
                      disabled={isReadOnlyActive}
                    />
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default CityManager;