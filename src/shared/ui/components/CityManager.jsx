import React, { useState, useEffect } from 'react';
import { MapPin, ArrowUp, ArrowDown, Plus, Search, Trash2 } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { parseFlexibleDate, formatDateSlash } from '@shared/lib/utils/viajeUtils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;



const CityManager = ({ t, paradas, setParadas }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  
  // Búsqueda reactiva (3 chars)
  useEffect(() => {
    if (busqueda.length < 3) {
        return;
    }
    const timer = setTimeout(async () => {
        try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(busqueda)}.json?types=place&language=es&access_token=${MAPBOX_TOKEN}`);
            const data = await res.json();
            setResultados(data.features || []);
        } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const agregarCiudad = (feature) => {
    const contextCountry = feature.context?.find(c => c.id.startsWith('country'));
    const countryCode = contextCountry?.short_code?.toUpperCase();
    const tempId = feature.id || `${feature.text}-${feature.center?.[0]}-${feature.center?.[1]}`;

    const nuevaParada = {
      id: `temp-${tempId}`,
      nombre: feature.text,
      coordenadas: feature.center,
      fechaLlegada: '', 
      fechaSalida: '', 
      fecha: new Date().toISOString().split('T')[0], 
      paisCodigo: countryCode, 
      flag: getFlagUrl(countryCode), // Guardar URL SVG
      transporte: null,
      notaCorta: ''
    };
    setParadas([...paradas, nuevaParada]);
    setBusqueda('');
    setResultados([]);
  };

  const moverParada = (index, direccion) => {
    const nuevas = [...paradas];
    const item = nuevas.splice(index, 1)[0];
    nuevas.splice(index + direccion, 0, item);
    setParadas(nuevas);
  };

  const actualizarDato = (index, campo, valor) => {
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
            value={busqueda}
            onChange={(e) => {
              const value = e.target.value;
              setBusqueda(value);
              if (value.length < 3) setResultados([]);
            }}
            placeholder={t('citymanager.searchPlaceholder') || 'Type the city name...'}
            style={styles.searchInput}
          />
        </div>
      </div>

      {resultados.length > 0 && (
        <div style={styles.resultsList}>
          {resultados.map(res => {
            // Extraer país para el icono en resultados
            const contextCountry = res.context?.find(c => c.id.startsWith('country'));
            const code = contextCountry?.short_code?.toUpperCase();
            const flag = getFlagUrl(code);

            return (
                <div key={res.id} style={styles.resultItem}>
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
                        {contextCountry?.text}
                      </span>
                    </span>
                </div>
                <button
                  type="button"
                  onClick={() => agregarCiudad(res)}
                  style={styles.addButton}
                >
                  {t('button.add') || 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.list}>
        {paradas.map((p, index) => (
          <div key={p.id || index} style={styles.item}>
            <div style={styles.itemHeader}>
               <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                   {p.flag && <img src={p.flag} alt="flag" style={{width:'24px', borderRadius:RADIUS.xs, border:'1px solid #eee'}} />}
                   <span style={styles.cityName}>{p.nombre}</span>
               </div>
               <div style={styles.actions}>
                  <button disabled={index === 0} onClick={() => moverParada(index, -1)} style={styles.actionBtn}><ArrowUp size={14} /></button>
                  <button disabled={index === paradas.length - 1} onClick={() => moverParada(index, 1)} style={styles.actionBtn}><ArrowDown size={14} /></button>
                  <button onClick={() => eliminarParada(index)} style={{...styles.actionBtn, color:COLORS.danger, background:'#FEF2F2'}}><Trash2 size={14} /></button>
               </div>
            </div>
            
            <div style={styles.datesRow}>
                <div style={styles.dateGroup}>
                    <label style={styles.label}>{t('citymanager.arrival') || 'Arrival'}</label>
                    <input
                      type="date"
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
                      disabled={false}
                    />
                </div>
                <div style={styles.dateGroup}>
                    <label style={styles.label}>{t('citymanager.departure') || 'Departure'}</label>
                    <input
                      type="date"
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
                      disabled={false}
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
  inputWrapper: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, padding: '0 12px' },
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none', fontSize: '1rem' },
  resultsList: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, overflow: 'hidden', maxHeight: '180px', overflowY: 'auto', boxShadow: SHADOWS.md },
  resultItem: { padding: '12px 15px', borderBottom: `1px solid ${COLORS.background}`, cursor: 'pointer', fontSize: '0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center', ':hover': { background: COLORS.background } },
  addButton: { background: 'transparent', border: `1.5px solid ${COLORS.atomicTangerine}`, borderRadius: RADIUS.full, padding: '6px 12px', color: COLORS.atomicTangerine, fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: TRANSITIONS.fast, outline: 'none', display: 'flex', alignItems: 'center', gap: '6px', '&:hover': { background: 'rgba(255, 107, 53, 0.05)', }, '&:active': { transform: 'translateY(1px)' } },
  
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  item: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '15px', borderRadius: RADIUS.md, boxShadow: SHADOWS.sm },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cityName: { fontWeight: '700', fontSize: '0.95rem', color: COLORS.charcoalBlue },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { background: COLORS.background, border: 'none', padding: '10px', borderRadius: RADIUS.xs, cursor: 'pointer', color: COLORS.textSecondary, display:'flex', alignItems:'center', justifyContent:'center' },
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
    padding: '12px 14px',
    fontSize: '1rem',
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