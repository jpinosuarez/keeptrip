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
  Camera,
  Landmark,
  Utensils,
  Eye,
  Palette,
  Bed,
  Mountain,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { normalizeToIsoDate } from '@shared/lib/utils/viajeUtils';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';
import CountryFlag from '@shared/ui/components/CountryFlag';

const TRANSPORT_OPTIONS = [
  { value: 'plane', Icon: Plane, fallback: 'Avión' },
  { value: 'train', Icon: Train, fallback: 'Tren' },
  { value: 'car', Icon: Car, fallback: 'Auto' },
  { value: 'ship', Icon: Ship, fallback: 'Barco' },
  { value: 'bus', Icon: Bus, fallback: 'Bus' },
];

const VIBE_OPTIONS = [
  { value: 'caminable', fallback: 'Caminable' },
  { value: 'gastronomia', fallback: 'Gran comida' },
  { value: 'historia', fallback: 'Historia' },
  { value: 'naturaleza', fallback: 'Naturaleza' },
  { value: 'joya', fallback: 'Joya oculta' },
  { value: 'fotogenica', fallback: 'Fotogénica' },
  { value: 'ambiente', fallback: 'Ambiente' },
];

const PLACE_CATEGORIES = [
  { value: 'monumento', Icon: Landmark, fallback: 'Monumento' },
  { value: 'gastronomia', Icon: Utensils, fallback: 'Gastronomía' },
  { value: 'mirador', Icon: Mountain, fallback: 'Mirador' },
  { value: 'cultura', Icon: Palette, fallback: 'Cultura' },
  { value: 'hotel', Icon: Bed, fallback: 'Hotel' },
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
        <div className="flex-1 flex items-center gap-2 min-h-[44px] bg-background border border-border rounded-xl px-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchQuery}
            onFocus={handleFieldFocus}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              if (value.length < 3) setSearchResults([]);
            }}
            placeholder={t('citymanager.searchPlaceholder', 'Añade una nueva parada a tu ruta')}
            className="border-none bg-transparent py-3 w-full outline-none text-base"
            disabled={isSearchPaused || isReadOnlyActive}
          />
        </div>
      </div>

      {isSearchPaused && (
        <div className="border border-border rounded-xl px-3.5 py-3 bg-atomicTangerine/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT('search:pausedMessage', 'Búsqueda en pausa temporalmente mientras estabilizamos el mapa. Tus viajes guardados siguen disponibles.')}
        </div>
      )}

      {isReadOnlyActive && (
        <div className="border border-border rounded-xl px-3.5 py-3 bg-[#2C3E50]/10 text-charcoalBlue font-semibold text-[0.88rem] text-center">
          {searchT('common:operational.readOnlyBanner', 'Keeptrip está en modo Solo lectura. Tus datos están a salvo, pero las ediciones están pausadas.')}
        </div>
      )}

      {visibleSearchResults.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden max-h-[180px] overflow-y-auto shadow-md">
          {visibleSearchResults.map((res, resIdx) => {
            const contextCountry = res.context?.find((c) => c.id.startsWith('country'));
            const code = contextCountry?.short_code?.toUpperCase();
            const countryLabel = getLocalizedCountryName(code, i18n.language, t) || contextCountry?.text || '';
            return (
              <div key={res.id || `result-${resIdx}`} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0">
                {code ? <CountryFlag code={code} size="sm" /> : <MapPin size={16} className="text-slate-400" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[0.9rem] font-semibold text-charcoalBlue truncate">{res.text}</div>
                  <div className="text-[0.72rem] text-textSecondary truncate">{countryLabel}</div>
                </div>
                <button
                  type="button"
                  onClick={() => agregarCiudad(res)}
                  disabled={isReadOnlyActive}
                  className="min-h-[44px] inline-flex items-center gap-1 rounded-full border border-atomicTangerine px-3 py-2 text-atomicTangerine text-[0.75rem] font-bold hover:bg-atomicTangerine/5"
                >
                  <Plus size={14} /> {t('button.add', 'Agregar')}
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
          const stopPhotos = (Array.isArray(fotos) ? fotos : []).filter((f) => f?.paradaId && f.paradaId === p.id);
          const lugarDraft = lugarDrafts[index] || { categoria: 'monumento', nombre: '' };

          return (
            <div key={p.id ?? `parada-${index}-${p.nombre}`} className="flex flex-col">
              {index > 0 && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  {TRANSPORT_OPTIONS.map(({ value, Icon, fallback }) => {
                    const active = p.transporte === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => actualizarDato(index, 'transporte', active ? null : value)}
                        disabled={isReadOnlyActive}
                        aria-pressed={active}
                        title={t(`citymanager.transport.${value}`, fallback)}
                        className={cn(
                          'w-9 h-9 rounded-full border flex items-center justify-center transition-all',
                          active ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]' : 'border-slate-200 bg-white text-slate-500 hover:border-[#FF6B35]/50'
                        )}
                      >
                        <Icon size={15} />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm" data-testid="editor-stop-item">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-300 shrink-0" aria-hidden="true" />
                  <span className="w-6 h-6 rounded-full bg-charcoalBlue/10 text-charcoalBlue text-[0.72rem] font-extrabold flex items-center justify-center shrink-0">{index + 1}</span>
                  {p.paisCodigo ? <CountryFlag code={p.paisCodigo} size="sm" /> : null}
                  <span className="font-bold text-base text-slate-900 truncate flex-1 min-w-0">{p.nombre}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => toggleFavorite(index)} disabled={isReadOnlyActive} aria-label={t('stopDrawer.favorite', 'Parada favorita')} aria-pressed={isFav} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors', isFav ? 'text-[#FF6B35] bg-[#FF6B35]/10' : 'text-slate-400 hover:bg-slate-100')}>
                      <Heart size={16} className={isFav ? 'fill-[#FF6B35]' : ''} />
                    </button>
                    <button type="button" data-testid="editor-stop-move-up" aria-label={t('citymanager.moveStopUp', 'Mover arriba')} disabled={index === 0 || isReadOnlyActive} onClick={() => moverParada(index, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp size={15} /></button>
                    <button type="button" data-testid="editor-stop-move-down" aria-label={t('citymanager.moveStopDown', 'Mover abajo')} disabled={index === paradas.length - 1 || isReadOnlyActive} onClick={() => moverParada(index, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown size={15} /></button>
                    <button type="button" data-testid="editor-stop-delete" aria-label={t('citymanager.deleteStop', 'Eliminar destino')} disabled={isReadOnlyActive} onClick={() => eliminarParada(index)} className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={15} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.65rem] uppercase text-slate-400 font-bold">{t('citymanager.arrival', 'Llegada')}</label>
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
                        setTempDates((prev) => { const next = { ...prev }; delete next[`${index}-arrival`]; return next; });
                      }}
                      className="w-full min-h-[46px] border border-slate-200 rounded-xl px-3 py-2.5 text-base text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]"
                      disabled={isReadOnlyActive}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.65rem] uppercase text-slate-400 font-bold">{t('citymanager.departure', 'Salida')}</label>
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
                        setTempDates((prev) => { const next = { ...prev }; delete next[`${index}-departure`]; return next; });
                      }}
                      className={cn('w-full min-h-[46px] border rounded-xl px-3 py-2.5 text-base text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]', hasDateInverted ? 'border-danger text-danger ring-1 ring-danger/30' : 'border-slate-200')}
                      disabled={isReadOnlyActive}
                    />
                  </div>
                </div>

                {hasDateInverted && (
                  <div role="alert" className="w-full text-[0.78rem] text-danger font-semibold flex items-center gap-1.5 mt-2">
                    {t('editor.errors.dateInverted', 'La fecha de salida no puede ser anterior a la de llegada')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setOpenStopId(isOpen ? null : p.id)}
                  aria-expanded={isOpen}
                  className="w-full mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-[#FF6B35] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-left">
                    <Sparkles size={14} className="text-[#FF6B35] shrink-0" />
                    {isOpen ? t('stopDrawer.hideDetails', 'Ocultar detalles de la parada') : t('stopDrawer.customizeStop', 'Personalizar parada (relato, lugares y fotos)')}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {!isOpen && stopLugares.length > 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">{stopLugares.length} {t('stopDrawer.placesCount', 'lugares')}</span>}
                    {!isOpen && stopPhotos.length > 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">{stopPhotos.length} {t('stopDrawer.photosCount', 'fotos')}</span>}
                    <ChevronDown size={16} className={cn('transition-transform duration-200', isOpen ? 'rotate-180 text-[#FF6B35]' : '')} />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 flex flex-col gap-3" data-testid="editor-stop-drawer">
                    <input
                      type="text"
                      value={p.titular || ''}
                      onChange={(e) => actualizarDato(index, 'titular', e.target.value)}
                      disabled={isReadOnlyActive}
                      maxLength={160}
                      placeholder={t('stopDrawer.headline', 'Titular o recuerdo clave...')}
                      className="w-full min-h-[46px] border border-slate-200 rounded-xl px-3 py-2.5 text-[0.9rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]"
                    />

                    <button type="button" onClick={() => setOpenNotaIds((prev) => ({ ...prev, [index]: !prev[index] }))} className="self-start text-[0.78rem] font-bold text-mutedTeal bg-transparent border-none cursor-pointer inline-flex items-center gap-1">
                      <Plus size={13} /> {t('stopDrawer.addLongNote', 'Añadir nota extendida')}
                    </button>
                    {(openNotaIds[index] || (p.nota && p.nota.length > 0)) && (
                      <textarea
                        value={p.nota || ''}
                        onChange={(e) => actualizarDato(index, 'nota', e.target.value)}
                        disabled={isReadOnlyActive}
                        rows={3}
                        maxLength={5000}
                        placeholder={t('stopDrawer.notePlaceholder', 'Cuenta lo que viviste en esta ciudad...')}
                        className="w-full border border-slate-200 rounded-xl p-3 text-[0.9rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35] resize-y"
                      />
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {VIBE_OPTIONS.map(({ value, fallback }) => {
                        const activeVibe = stopVibes.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleVibe(index, value)} disabled={isReadOnlyActive} aria-pressed={activeVibe} className={cn('min-h-[44px] rounded-full border px-2.5 py-1.5 text-[0.72rem] font-bold transition-all', activeVibe ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]' : 'border-slate-200 bg-white text-slate-600')}>
                            {t(`stopDrawer.vibes.${value}`, fallback)}
                          </button>
                        );
                      })}
                      {stopVibes.filter((v) => !VIBE_OPTIONS.some((o) => o.value === v)).map((custom) => (
                        <span key={custom} className="min-h-[44px] inline-flex items-center gap-1 rounded-full border border-[#FF6B35] bg-[#FF6B35]/10 px-2.5 py-1.5 text-[0.72rem] font-bold text-[#FF6B35]">
                          {custom}
                          <button type="button" onClick={() => toggleVibe(index, custom)} aria-label={t('stopDrawer.removeVibe', 'Quitar vibe')} className="bg-transparent border-none p-0 cursor-pointer text-[#FF6B35] flex"><X size={12} /></button>
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
                        placeholder={t('stopDrawer.customVibe', 'Crear vibe')}
                        className="flex-1 min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 text-[0.82rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]"
                      />
                      <button type="button" onClick={() => addCustomVibe(index)} disabled={isReadOnlyActive} className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white text-[0.78rem] font-bold text-slate-700 cursor-pointer">{t('button.add', 'Agregar')}</button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {PLACE_CATEGORIES.map(({ value, Icon, fallback }) => {
                        const activeCat = lugarDraft.categoria === value;
                        return (
                          <button key={value} type="button" onClick={() => setLugarDraft(index, { categoria: value })} disabled={isReadOnlyActive} aria-pressed={activeCat} className={cn('min-h-[44px] inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[0.72rem] font-bold transition-all', activeCat ? 'border-mutedTeal bg-mutedTeal/10 text-mutedTeal' : 'border-slate-200 bg-white text-slate-600')}>
                            <Icon size={13} /> {t(`stopDrawer.places.${value}`, fallback)}
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
                        placeholder={t(`stopDrawer.placePlaceholder.${lugarDraft.categoria}`, 'Añade un lugar...')}
                        className="flex-1 min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 text-[0.82rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]"
                      />
                      <button type="button" onClick={() => addLugar(index)} disabled={isReadOnlyActive} className="min-h-[44px] px-3 rounded-xl bg-[#FF6B35] text-white font-bold cursor-pointer"><Plus size={14} /></button>
                    </div>
                    {stopLugares.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stopLugares.map((lugar) => {
                          const cat = PLACE_CATEGORIES.find((c) => c.value === lugar.categoria);
                          const Icon = cat?.Icon || MapPin;
                          return (
                            <span key={lugar.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1.5 text-[0.72rem] font-semibold text-slate-700">
                              <Icon size={12} className="text-mutedTeal" />
                              {lugar.nombre}
                              <button type="button" onClick={() => removeLugar(index, lugar.id)} aria-label={t('stopDrawer.removePlace', 'Quitar lugar')} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 flex"><X size={12} /></button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {stopPhotos.map((foto) => (
                        <img key={foto.id} src={foto.url} alt={foto.caption || p.nombre} loading="lazy" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                      ))}
                      <button type="button" onClick={() => onRequestPhotos?.(p)} className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white text-slate-700 text-[0.78rem] font-semibold px-3 py-2 hover:border-[#FF6B35] hover:text-[#FF6B35] cursor-pointer">
                        <Camera size={15} className="text-[#FF6B35]" />
                        {t('stopDrawer.uploadStopPhotos', { city: p.nombre, defaultValue: `Subir fotos de ${p.nombre}` })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-400 font-semibold">
        <MapPin size={13} /> {t('labels.emptyStopsHint', 'Necesitas al menos 1 parada para guardar')}
      </div>
    </div>
  );
};

export default CityManager;
