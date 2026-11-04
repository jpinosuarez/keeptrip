import { cn } from '@shared/lib/utils/cn';
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Trash2,
  Plane,
  Train,
  Car,
  Ship,
  Bus,
  Heart,
  Sparkles,
  ChevronDown,
  X,
  GripVertical,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { normalizeToIsoDate } from '@shared/lib/utils/viajeUtils';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';

const TRANSPORT_OPTIONS = [
  { value: 'plane', Icon: Plane },
  { value: 'train', Icon: Train },
  { value: 'car', Icon: Car },
  { value: 'ship', Icon: Ship },
  { value: 'bus', Icon: Bus },
];

const VIBE_OPTIONS = [
  { value: 'caminable', emoji: '\ud83d\udeb6\u200d\u2642\ufe0f' },
  { value: 'gastronomia', emoji: '\ud83c\udf5c' },
  { value: 'historia', emoji: '\ud83c\udfdb\ufe0f' },
  { value: 'naturaleza', emoji: '\ud83c\udf3f' },
  { value: 'joya', emoji: '\ud83d\udc8e' },
  { value: 'fotogenica', emoji: '\ud83d\udcf8' },
  { value: 'ambiente', emoji: '\ud83c\udf89' },
];

const PLACE_CATEGORIES = [
  { value: 'monumento', emoji: '\ud83c\udfdb\ufe0f' },
  { value: 'gastronomia', emoji: '\ud83c\udf7d\ufe0f' },
  { value: 'mirador', emoji: '\ud83c\udf05' },
  { value: 'cultura', emoji: '\ud83c\udfad' },
  { value: 'hotel', emoji: '\ud83c\udfe8' },
];

const makeId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createStopInstanceId = (feature) => {
  const baseId = feature.id || `${feature.text}-${feature.center?.[0]}-${feature.center?.[1]}`;
  return `temp-${baseId}-${makeId()}`;
};

const CityManager = ({
  t,
  paradas,
  setParadas,
  tripStartDate = '',
  tripEndDate = '',
  isReadOnlyMode = false,
  fotos = [],
  onRequestPhotos,
}) => {
  const { i18n, t: searchT } = useTranslation(['search', 'common']);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyActive = isReadOnlyMode || Boolean(appReadonlyMode) || operationalLevel >= 3;
  const isSearchPaused = operationalLevel >= 1;
  const shouldBlockSearchResults = isSearchPaused || isReadOnlyActive;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tempDates, setTempDates] = useState({});
  const [openStopId, setOpenStopId] = useState(null);
  const [openNotaIds, setOpenNotaIds] = useState({});
  const [lugarDrafts, setLugarDrafts] = useState({});
  const [customVibeDrafts, setCustomVibeDrafts] = useState({});

  const visibleSearchResults = shouldBlockSearchResults ? [] : searchResults;

  const handleFieldFocus = (e) => {
    const target = e.currentTarget;
    setTimeout(() => {
      if (target && document.activeElement === target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 280);
  };

  useEffect(() => {
    if (isSearchPaused) return;
    if (searchQuery.length < 3) return;
    const timer = setTimeout(async () => {
      try {
        const lang = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
        const data = await fetchGeocoding({ query: searchQuery, language: lang, types: 'place' });
        setSearchResults(data.features || []);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, i18n.language, i18n.resolvedLanguage, isSearchPaused]);

  const agregarCiudad = (feature) => {
    if (isReadOnlyActive) return;
    const contextCountry = feature.context?.find((c) => c.id.startsWith('country'));
    const countryCode = contextCountry?.short_code?.toUpperCase();

    setParadas((prevParadas) => {
      const nuevaParada = {
        id: createStopInstanceId(feature),
        nombre: feature.text,
        coordenadas: feature.center,
        fechaLlegada: '',
        fechaSalida: '',
        fecha: '',
        paisCodigo: countryCode,
        flag: getFlagUrl(countryCode),
        transporte: null,
        esFavorita: false,
        titular: '',
        nota: '',
        vibes: [],
        lugares: [],
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

  const actualizarDato = useCallback((index, campo, valor) => {
    if (isReadOnlyActive) return;
    setParadas((prevParadas) => {
      const nuevas = [...prevParadas];
      const target = { ...nuevas[index] };
      if (campo === 'fechaLlegada' || campo === 'fechaSalida') {
        const isoValue = normalizeToIsoDate(valor) || valor || '';
        target[campo] = isoValue;
        if (campo === 'fechaLlegada') target.fecha = isoValue;
      } else {
        target[campo] = valor;
      }
      nuevas[index] = target;
      return nuevas;
    });
  }, [isReadOnlyActive, setParadas]);

  const eliminarParada = (index) => {
    if (isReadOnlyActive) return;
    const nuevas = [...paradas];
    nuevas.splice(index, 1);
    setParadas(nuevas);
  };

  const toggleFavorite = (index) => {
    if (isReadOnlyActive) return;
    const current = Boolean(paradas[index]?.esFavorita);
    actualizarDato(index, 'esFavorita', !current);
  };

  const toggleVibe = (index, vibe) => {
    if (isReadOnlyActive) return;
    const current = Array.isArray(paradas[index]?.vibes) ? paradas[index].vibes : [];
    const next = current.includes(vibe) ? current.filter((v) => v !== vibe) : [...current, vibe];
    actualizarDato(index, 'vibes', next);
  };

  const addCustomVibe = (index) => {
    const draft = (customVibeDrafts[index] || '').trim();
    if (!draft) return;
    const current = Array.isArray(paradas[index]?.vibes) ? paradas[index].vibes : [];
    if (!current.includes(draft)) actualizarDato(index, 'vibes', [...current, draft]);
    setCustomVibeDrafts((prev) => ({ ...prev, [index]: '' }));
  };

  const setLugarDraft = (index, partial) => {
    setLugarDrafts((prev) => ({
      ...prev,
      [index]: { categoria: prev[index]?.categoria || 'monumento', nombre: prev[index]?.nombre || '', ...partial },
    }));
  };

  const addLugar = (index) => {
    const draft = lugarDrafts[index];
    const nombre = (draft?.nombre || '').trim();
    if (!nombre) return;
    const categoria = draft?.categoria || 'monumento';
    const current = Array.isArray(paradas[index]?.lugares) ? paradas[index].lugares : [];
    actualizarDato(index, 'lugares', [...current, { id: makeId(), nombre, categoria }]);
    setLugarDraft(index, { nombre: '' });
  };

  const removeLugar = (index, lugarId) => {
    const current = Array.isArray(paradas[index]?.lugares) ? paradas[index].lugares : [];
    actualizarDato(index, 'lugares', current.filter((l) => l.id !== lugarId));
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <div className="flex-1 flex items-center gap-2 min-h-[44px] bg-background border border-border rounded-md px-3">
          <Search size={16} className="text-textSecondary" />
          <input
            value={searchQuery}
            onFocus={handleFieldFocus}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              if (value.length < 3) setSearchResults([]);
            }}
            placeholder={t('citymanager.searchPlaceholder', '\ud83d\udd0d Add new stop to your route')}
            className="border-none bg-transparent py-3 w-full outline-none text-base"
            disabled={isSearchPaused || isReadOnlyActive}
          />
        </div>
      </div>

      {isSearchPaused && (
        <div className="border border-border rounded-md px-3.5 py-3 bg-atomicTangerine/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT('search:pausedMessage', 'Search temporarily paused while we stabilize map services. Your saved trips remain available.')}
        </div>
      )}

      {isReadOnlyActive && (
        <div className="border border-border rounded-md px-3.5 py-3 bg-[#2C3E50]/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT('common:operational.readOnlyBanner', 'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.')}
        </div>
      )}

      {visibleSearchResults.length > 0 && (
        <div className="bg-surface border border-border rounded-md overflow-hidden max-h-[180px] overflow-y-auto shadow-md">
          {visibleSearchResults.map((res, resIdx) => {
            const contextCountry = res.context?.find((c) => c.id.startsWith('country'));
            const code = contextCountry?.short_code?.toUpperCase();
            const flag = getFlagUrl(code);
            const countryLabel = getLocalizedCountryName(code, i18n.language, t) || contextCountry?.text || '';
            return (
              <div key={res.id || `result-${resIdx}`} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0">
                {flag && <img src={flag} alt="flag" className="w-5 rounded-sm" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[0.9rem] font-semibold text-charcoalBlue truncate">{res.text}</div>
                  <div className="text-[0.72rem] text-textSecondary truncate">{countryLabel}</div>
                </div>
                <button
                  type="button"
                  onClick={() => agregarCiudad(res)}
                  className="bg-transparent border-[1.5px] border-atomicTangerine rounded-full min-h-[44px] min-w-[44px] px-3.5 py-2.5 text-atomicTangerine text-[0.75rem] font-bold cursor-pointer transition-all flex items-center gap-1.5 hover:bg-atomicTangerine/5"
                  aria-label={t('button.add') || '+ Add destination'}
                  disabled={isReadOnlyActive}
                >
                  <Plus size={14} /> {t('button.add', '+ Add')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {paradas.map((p, index) => {
          const llegadaVal = tempDates[`${index}-arrival`] ?? (normalizeToIsoDate(p.fechaLlegada || p.fecha) || '');
          const salidaVal = tempDates[`${index}-departure`] ?? (normalizeToIsoDate(p.fechaSalida) || '');
          const hasDateInverted = Boolean(llegadaVal && salidaVal && salidaVal < llegadaVal);
          const isOpen = openStopId === p.id;
          const isFav = Boolean(p.esFavorita);
          const stopVibes = Array.isArray(p.vibes) ? p.vibes : [];
          const stopLugares = Array.isArray(p.lugares) ? p.lugares : [];
          const stopPhotos = (Array.isArray(fotos) ? fotos : []).filter(
            (f) => f?.paradaId && f.paradaId === p.id
          );
          const lugarDraft = lugarDrafts[index] || { categoria: 'monumento', nombre: '' };

          return (
            <div key={p.id ?? `parada-${index}-${p.nombre}`} className="flex flex-col gap-2">
              {index > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap px-1">
                  {TRANSPORT_OPTIONS.map(({ value, Icon }) => {
                    const active = p.transporte === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => actualizarDato(index, 'transporte', value)}
                        disabled={isReadOnlyActive}
                        aria-pressed={active}
                        title={t(`citymanager.transport.${value}`, value)}
                        className={cn(
                          'min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-[0.72rem] font-bold transition-all',
                          active
                            ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine'
                            : 'border-border bg-surface text-textSecondary'
                        )}
                      >
                        <Icon size={15} />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="bg-surface border border-border p-3.5 rounded-md shadow-sm" data-testid="editor-stop-item">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical size={16} className="text-textSecondary shrink-0" aria-hidden="true" />
                    <span className="w-5 h-5 rounded-full bg-charcoalBlue/10 text-charcoalBlue text-[0.7rem] font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    {p.flag && <img src={p.flag} alt="flag" className="w-6 rounded-sm border border-border-light drop-shadow-sm" />}
                    <span className="font-bold text-[0.95rem] text-charcoalBlue truncate">{p.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(index)}
                      disabled={isReadOnlyActive}
                      aria-label={t('stopDrawer.favorite', 'Favorite stop')}
                      aria-pressed={isFav}
                      className={cn(
                        'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm',
                        isFav ? 'text-atomicTangerine' : 'text-textSecondary'
                      )}
                    >
                      <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenStopId(isOpen ? null : p.id)}
                      aria-expanded={isOpen}
                      className={cn(
                        'min-h-[44px] inline-flex items-center gap-1 rounded-full px-3 text-[0.72rem] font-bold transition-all',
                        isOpen ? 'bg-atomicTangerine/10 text-atomicTangerine' : 'bg-background text-textSecondary'
                      )}
                    >
                      <Sparkles size={14} />
                      {t('stopDrawer.toggle', 'Detalles y Fotos')}
                      <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3.5 flex-wrap mt-3">
                  <div className="flex-[1_1_120px] min-w-0 flex flex-col gap-1">
                    <label className="text-[0.7rem] uppercase text-textSecondary font-bold">{t('citymanager.arrival') || 'Arrival'}</label>
                    <input
                      type="date"
                      value={llegadaVal}
                      onFocus={handleFieldFocus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempDates((prev) => ({ ...prev, [`${index}-arrival`]: val }));
                        if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) actualizarDato(index, 'fechaLlegada', val);
                      }}
                      onBlur={(e) => {
                        actualizarDato(index, 'fechaLlegada', e.target.value);
                        setTempDates((prev) => {
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
                      value={salidaVal}
                      onFocus={handleFieldFocus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempDates((prev) => ({ ...prev, [`${index}-departure`]: val }));
                        if (!val || /^\d{4}-\d{2}-\d{2}$/.test(val)) actualizarDato(index, 'fechaSalida', val);
                      }}
                      onBlur={(e) => {
                        actualizarDato(index, 'fechaSalida', e.target.value);
                        setTempDates((prev) => {
                          const next = { ...prev };
                          delete next[`${index}-departure`];
                          return next;
                        });
                      }}
                      className={cn(
                        'w-full box-sizing-border-box min-h-[48px] border rounded-md px-3.5 py-3 text-base font-inherit text-charcoalBlue bg-background outline-none cursor-pointer transition-all shadow-sm',
                        hasDateInverted ? 'border-danger text-danger focus:border-danger ring-1 ring-danger/30' : 'border-border'
                      )}
                      disabled={isReadOnlyActive}
                    />
                  </div>
                </div>

                {hasDateInverted && (
                  <div className="w-full text-[0.78rem] text-danger font-semibold flex items-center gap-1.5 mt-2" role="alert">
                    <span>\u26a0\ufe0f</span>
                    <span>{t('editor.errors.dateInverted', 'La fecha de salida no puede ser anterior a la de llegada')}</span>
                  </div>
                )}

                <div className="flex gap-1.5 mt-3 justify-end">
                  <button type="button" data-testid="editor-stop-move-up" aria-label={t('citymanager.moveStopUp', 'Move stop up')} disabled={index === 0 || isReadOnlyActive} onClick={() => moverParada(index, -1)} className="bg-background border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-textSecondary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" data-testid="editor-stop-move-down" aria-label={t('citymanager.moveStopDown', 'Move stop down')} disabled={index === paradas.length - 1 || isReadOnlyActive} onClick={() => moverParada(index, 1)} className="bg-background border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-textSecondary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" data-testid="editor-stop-delete" aria-label={t('citymanager.deleteStop', 'Delete stop')} onClick={() => eliminarParada(index)} className="bg-danger/10 border-none min-h-[44px] min-w-[44px] p-3 rounded-sm cursor-pointer text-danger flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed" disabled={isReadOnlyActive}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3" data-testid="editor-stop-drawer">
                    <input
                      type="text"
                      value={p.titular || ''}
                      onChange={(e) => actualizarDato(index, 'titular', e.target.value)}
                      disabled={isReadOnlyActive}
                      maxLength={160}
                      placeholder={t('stopDrawer.headline', '\ud83d\udcac Titular o recuerdo clave...')}
                      className="w-full min-h-[44px] border border-border rounded-md px-3 py-2.5 text-[0.9rem] text-charcoalBlue bg-background outline-none focus:border-atomicTangerine"
                    />

                    <button type="button" onClick={() => setOpenNotaIds((prev) => ({ ...prev, [index]: !prev[index] }))} className="self-start text-[0.78rem] font-bold text-mutedTeal bg-transparent border-none cursor-pointer inline-flex items-center gap-1">
                      <Plus size={13} /> {t('stopDrawer.addLongNote', 'A\u00f1adir nota extendida')}
                    </button>
                    {(openNotaIds[index] || (p.nota && p.nota.length > 0)) && (
                      <textarea
                        value={p.nota || ''}
                        onChange={(e) => actualizarDato(index, 'nota', e.target.value)}
                        disabled={isReadOnlyActive}
                        rows={3}
                        maxLength={5000}
                        placeholder={t('stopDrawer.notePlaceholder', 'Cuenta lo que viviste en esta ciudad...')}
                        className="w-full border border-border rounded-md p-3 text-[0.9rem] text-charcoalBlue bg-background outline-none focus:border-atomicTangerine resize-y"
                      />
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {VIBE_OPTIONS.map(({ value, emoji }) => {
                        const active = stopVibes.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleVibe(index, value)} disabled={isReadOnlyActive} aria-pressed={active} className={cn('min-h-[44px] rounded-full border px-2.5 py-1.5 text-[0.72rem] font-bold transition-all', active ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine' : 'border-border bg-surface text-textSecondary')}>
                            {emoji} {t(`stopDrawer.vibes.${value}`, value)}
                          </button>
                        );
                      })}
                      {stopVibes.filter((v) => !VIBE_OPTIONS.some((o) => o.value === v)).map((custom) => (
                        <span key={custom} className="min-h-[44px] inline-flex items-center gap-1 rounded-full border border-atomicTangerine bg-atomicTangerine/10 px-2.5 py-1.5 text-[0.72rem] font-bold text-atomicTangerine">
                          {custom}
                          <button type="button" onClick={() => toggleVibe(index, custom)} aria-label={t('stopDrawer.removeVibe', 'Remove vibe')} className="bg-transparent border-none p-0 cursor-pointer text-atomicTangerine flex"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customVibeDrafts[index] || ''}
                        onChange={(e) => setCustomVibeDrafts((prev) => ({ ...prev, [index]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomVibe(index); } }}
                        disabled={isReadOnlyActive}
                        maxLength={40}
                        placeholder={t('stopDrawer.customVibe', '+ Crear')}
                        className="flex-1 min-h-[44px] border border-border rounded-md px-3 py-2 text-[0.82rem] text-charcoalBlue bg-background outline-none focus:border-atomicTangerine"
                      />
                      <button type="button" onClick={() => addCustomVibe(index)} disabled={isReadOnlyActive} className="min-h-[44px] px-3 rounded-md border border-border bg-surface text-[0.78rem] font-bold text-textPrimary cursor-pointer">{t('button.add', 'Add')}</button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {PLACE_CATEGORIES.map(({ value, emoji }) => {
                        const active = lugarDraft.categoria === value;
                        return (
                          <button key={value} type="button" onClick={() => setLugarDraft(index, { categoria: value })} disabled={isReadOnlyActive} aria-pressed={active} className={cn('min-h-[44px] rounded-full border px-2.5 py-1.5 text-[0.72rem] font-bold transition-all', active ? 'border-mutedTeal bg-mutedTeal/10 text-mutedTeal' : 'border-border bg-surface text-textSecondary')}>
                            {emoji} {t(`stopDrawer.places.${value}`, value)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={lugarDraft.nombre}
                        onChange={(e) => setLugarDraft(index, { nombre: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLugar(index); } }}
                        disabled={isReadOnlyActive}
                        maxLength={120}
                        placeholder={t(`stopDrawer.placePlaceholder.${lugarDraft.categoria}`, 'A\u00f1ade un lugar...')}
                        className="flex-1 min-h-[44px] border border-border rounded-md px-3 py-2 text-[0.82rem] text-charcoalBlue bg-background outline-none focus:border-atomicTangerine"
                      />
                      <button type="button" onClick={() => addLugar(index)} disabled={isReadOnlyActive} className="min-h-[44px] px-3 rounded-md border border-atomicTangerine bg-atomicTangerine text-white text-[0.78rem] font-bold cursor-pointer"><Plus size={14} /></button>
                    </div>
                    {stopLugares.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stopLugares.map((lugar) => (
                          <span key={lugar.id} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1.5 text-[0.72rem] font-semibold text-textPrimary">
                            {lugar.nombre}
                            <button type="button" onClick={() => removeLugar(index, lugar.id)} aria-label={t('stopDrawer.removePlace', 'Remove place')} className="bg-transparent border-none p-0 cursor-pointer text-textSecondary flex"><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {stopPhotos.map((foto) => (
                        <img key={foto.id} src={foto.url} alt={foto.caption || p.nombre} loading="lazy" className="w-14 h-14 rounded-lg object-cover border border-border" />
                      ))}
                      <button
                        type="button"
                        onClick={() => onRequestPhotos?.(p)}
                        className="min-h-[44px] rounded-xl border border-dashed border-border bg-white text-textPrimary text-[0.78rem] font-semibold px-3 py-2 hover:border-atomicTangerine hover:text-atomicTangerine cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-1">\ud83d\udcf8 {t('stopDrawer.uploadStopPhotos', 'Subir fotos de {{city}}', { city: p.nombre })}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[0.72rem] text-textSecondary font-semibold">
        <MapPin size={13} /> {t('labels.emptyStopsHint', 'Necesitas al menos 1 parada para guardar')}
      </div>
    </div>
  );
};

export default CityManager;
