import React, { useState, useEffect } from 'react';
import { MapPin, ArrowUp, ArrowDown, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';
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



const CityManager = ({ t, paradas, setParadas, isReadOnlyMode = false, tripStartDate = null }) => {
  const { i18n, t: searchT } = useTranslation(['search', 'common']);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyActive = isReadOnlyMode || Boolean(appReadonlyMode) || operationalLevel >= 3;
  const isSearchPaused = operationalLevel >= 1;
  const shouldBlockSearchResults = isSearchPaused || isReadOnlyActive;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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

    const nuevas = [...paradas];
    nuevas[index][campo] = valor;
    // Sincronizar fecha canónica: parsear texto flexible → ISO, actualizar .fecha
    if (campo === 'fechaLlegada') {
      const iso = parseFlexibleDate(valor);
      if (iso) nuevas[index].fecha = iso;
    }
    setParadas(nuevas);
  };

  const eliminarParada = (index) => {
    if (isReadOnlyActive) return;

    const nuevas = [...paradas];
    nuevas.splice(index, 1);
    setParadas(nuevas);
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchRow}>
        <div style={styles.inputWrapper}>
          <Search size={16} color={COLORS.textSecondary} />
          <input
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              if (value.length < 3) setSearchResults([]);
            }}
            placeholder={t('citymanager.searchPlaceholder', { defaultValue: 'Añadir nueva parada a tu ruta' })}
            style={styles.searchInput}
            disabled={isSearchPaused || isReadOnlyActive}
          />
        </div>
      </div>

      {isSearchPaused && (
        <div style={styles.pausedState}>
          {searchT(
            'search:pausedMessage',
            'Search temporarily paused while we stabilize map services. Your saved trips remain available.'
          )}
        </div>
      )}

      {isReadOnlyActive && (
        <div style={styles.readOnlyState}>
          {searchT(
            'common:operational.readOnlyBanner',
            'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
          )}
        </div>
      )}

      {visibleSearchResults.length > 0 && (
        <div style={styles.resultsList}>
          {visibleSearchResults.map((res, resIdx) => {
            // Extraer país para el icono en resultados
            const contextCountry = res.context?.find(c => c.id.startsWith('country'));
            const code = contextCountry?.short_code?.toUpperCase();
            const flag = getFlagUrl(code);
            const countryLabel = getLocalizedCountryName(code, i18n.language, t) || contextCountry?.text || '';

            return (
                <div key={res.id || `result-${resIdx}`} style={styles.resultItem}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    {flag ? (
                      <img
                        src={flag}
                        alt="flag"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: RADIUS.full,
                          objectFit: 'cover',
                          boxShadow: SHADOWS.sm,
                        }}
                      />
                    ) : (
                      <MapPin size={16} color={COLORS.textSecondary} />
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {res.text},{' '}
                      <span style={{ color: COLORS.textSecondary, fontSize: '0.8rem' }}>
                        {countryLabel}
                      </span>
                    </span>
                </div>
                <button
                  type="button"
                  onClick={() => agregarCiudad(res)}
                  style={{
                    ...styles.addButton,
                    opacity: isReadOnlyActive ? 0.55 : 1,
                    cursor: isReadOnlyActive ? 'not-allowed' : 'pointer',
                  }}
                  aria-label={t('button.add') || '+ Agregar destino'}
                  disabled={isReadOnlyActive}
                >
                  <Plus size={14} /> {t('button.add', '+ Agregar destino')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.list}>
        {paradas.map((p, index) => (
          <div key={p.id ?? `parada-${index}-${p.nombre}`} style={styles.item} data-testid="editor-stop-item">
            <div style={styles.itemHeader}>
               <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                   {p.flag && <img src={p.flag} alt="flag" style={{width:'24px', borderRadius:RADIUS.xs, border:'1px solid #eee'}} />}
                   <span style={styles.cityName}>{p.nombre}</span>
               </div>
               <div style={styles.actions}>
                  <button
                    type="button"
                    data-testid="editor-stop-move-up"
                    aria-label={t('citymanager.moveStopUp', 'Move stop up')}
                    disabled={index === 0 || isReadOnlyActive}
                    onClick={() => moverParada(index, -1)}
                    style={styles.actionBtn}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    data-testid="editor-stop-move-down"
                    aria-label={t('citymanager.moveStopDown', 'Move stop down')}
                    disabled={index === paradas.length - 1 || isReadOnlyActive}
                    onClick={() => moverParada(index, 1)}
                    style={styles.actionBtn}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    data-testid="editor-stop-delete"
                    aria-label={t('citymanager.deleteStop', 'Delete stop')}
                    onClick={() => eliminarParada(index)}
                    style={{...styles.actionBtn, color:COLORS.danger, background:'#FEF2F2'}}
                    disabled={isReadOnlyActive}
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
            
            <div style={styles.datesRow}>
                <div style={styles.dateGroup}>
                    <label style={styles.label}>{t('citymanager.arrival') || 'Arrival'}</label>
                    <input
                      type="date"
                      min={tripStartDate ? (tripStartDate.includes('/') ? tripStartDate.split('/').reverse().join('-') : tripStartDate) : undefined}
                      value={p.fechaLlegada ? p.fechaLlegada.split('/').reverse().join('-') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          actualizarDato(index, 'fechaLlegada', '');
                        } else {
                          const [year, month, day] = val.split('-');
                          const formatted = `${day}/${month}/${year}`;
                          actualizarDato(index, 'fechaLlegada', formatted);
                        }
                      }}
                      style={styles.nativeDateInput}
                      disabled={isReadOnlyActive}
                    />
                </div>
                <div style={styles.dateGroup}>
                    <label style={styles.label}>{t('citymanager.departure') || 'Departure'}</label>
                    <input
                      type="date"
                      min={p.fechaLlegada ? p.fechaLlegada.split('/').reverse().join('-') : (tripStartDate ? (tripStartDate.includes('/') ? tripStartDate.split('/').reverse().join('-') : tripStartDate) : undefined)}
                      value={p.fechaSalida ? p.fechaSalida.split('/').reverse().join('-') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          actualizarDato(index, 'fechaSalida', '');
                        } else {
                          const [year, month, day] = val.split('-');
                          const formatted = `${day}/${month}/${year}`;
                          actualizarDato(index, 'fechaSalida', formatted);
                        }
                      }}
                      style={styles.nativeDateInput}
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

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '15px' },
  searchRow: { display: 'flex', gap: '10px' },
  inputWrapper: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', background: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, padding: '0 12px' },
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none', fontSize: '1rem' },
  resultsList: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, overflow: 'hidden', maxHeight: '180px', overflowY: 'auto', boxShadow: SHADOWS.md },
  pausedState: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.md,
    padding: '12px 14px',
    background: 'rgba(255, 107, 53, 0.08)',
    color: COLORS.charcoalBlue,
    fontWeight: 600,
    fontSize: '0.88rem',
    textAlign: 'center',
  },
  readOnlyState: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.md,
    padding: '12px 14px',
    background: 'rgba(44, 62, 80, 0.08)',
    color: COLORS.charcoalBlue,
    fontWeight: 600,
    fontSize: '0.88rem',
    textAlign: 'center',
  },
  resultItem: { padding: '12px 15px', borderBottom: `1px solid ${COLORS.background}`, cursor: 'pointer', fontSize: '0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center', ':hover': { background: COLORS.background } },
  addButton: { background: 'transparent', border: `1.5px solid ${COLORS.atomicTangerine}`, borderRadius: RADIUS.full, minHeight: '44px', minWidth: '44px', padding: '10px 14px', color: COLORS.atomicTangerine, fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: TRANSITIONS.fast, outline: 'none', display: 'flex', alignItems: 'center', gap: '6px', '&:hover': { background: 'rgba(255, 107, 53, 0.05)', }, '&:active': { transform: 'translateY(1px)' } },
  
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  item: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '15px', borderRadius: RADIUS.md, boxShadow: SHADOWS.sm },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cityName: { fontWeight: '700', fontSize: '0.95rem', color: COLORS.charcoalBlue },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { background: COLORS.background, border: 'none', minHeight: '44px', minWidth: '44px', padding: '12px', borderRadius: RADIUS.xs, cursor: 'pointer', color: COLORS.textSecondary, display:'flex', alignItems:'center', justifyContent:'center' },
  datesRow: { display: 'flex', gap: '15px' },
  dateGroup: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  transportRow: { display: 'flex', gap: '12px', alignItems: 'center', marginTop: 10 },
  transportBtn: (active) => ({ padding: '10px 14px', borderRadius: RADIUS.sm, border: active ? '1px solid #3b82f6' : `1px solid ${COLORS.border}`, background: active ? '#eff6ff' : COLORS.surface, cursor: 'pointer' }),
  label: { fontSize: '0.7rem', textTransform:'uppercase', color:COLORS.textSecondary, fontWeight:'700' },
  dateInput: { width: '100%', boxSizing: 'border-box', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, padding: '10px', fontSize: '1rem', color: COLORS.charcoalBlue, outline: 'none', background: COLORS.background },
  nativeDateInput: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '48px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.md,
    padding: '12px 8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    color: COLORS.charcoalBlue,
    backgroundColor: COLORS.background,
    outline: 'none',
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    boxShadow: SHADOWS.sm,
  },
  relatoTextarea: { width: '100%', minHeight: '60px', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, resize: 'vertical', fontFamily: 'inherit', fontSize: '1rem', color: COLORS.charcoalBlue, outline: 'none', background: COLORS.background, boxShadow: SHADOWS.inner }
};

export default CityManager;