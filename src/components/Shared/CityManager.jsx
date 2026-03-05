import React, { useState, useEffect } from 'react';
import { MapPin, ArrowUp, ArrowDown, Plus, Search, Trash2 } from 'lucide-react';
import { COLORS, RADIUS, SHADOWS } from '../../theme';
import { getFlagUrl } from '../../utils/countryUtils';
import { parseFlexibleDate, formatDateSlash } from '../../utils/viajeUtils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const CityManager = ({ paradas, setParadas }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  
  // Búsqueda reactiva (3 chars)
  useEffect(() => {
    if (busqueda.length < 3) {
        setResultados([]);
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

    const nuevaParada = {
      id: `temp-${Date.now()}`,
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
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar ciudad (min 3 letras)..."
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
                <div key={res.id} style={styles.resultItem} onClick={() => agregarCiudad(res)}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    {flag ? <img src={flag} alt="flag" style={{width:'20px', borderRadius:RADIUS.xs}}/> : <MapPin size={14} />}
                    <span>{res.text}, <span style={{color:COLORS.textSecondary, fontSize:'0.8rem'}}>{contextCountry?.text}</span></span>
                </div>
                <Plus size={14} color={COLORS.atomicTangerine}/>
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
                    <label style={styles.label}>Llegada</label>
                    <input type="text" value={p.fechaLlegada} onChange={e => actualizarDato(index, 'fechaLlegada', e.target.value)} onBlur={e => { const iso = parseFlexibleDate(e.target.value); if (iso) actualizarDato(index, 'fechaLlegada', formatDateSlash(iso)); }} placeholder="dd/mm/aaaa" style={styles.dateInput} />
                </div>
                <div style={styles.dateGroup}>
                    <label style={styles.label}>Salida</label>
                    <input type="text" value={p.fechaSalida} onChange={e => actualizarDato(index, 'fechaSalida', e.target.value)} onBlur={e => { const iso = parseFlexibleDate(e.target.value); if (iso) actualizarDato(index, 'fechaSalida', formatDateSlash(iso)); }} placeholder="dd/mm/aaaa" style={styles.dateInput} />
                </div>
            </div>

            <div style={styles.transportRow}>
                <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                    <button type="button" onClick={() => actualizarDato(index, 'transporte', 'avion')} style={styles.transportBtn(p.transporte === 'avion')}>✈️ Avión</button>
                    <button type="button" onClick={() => actualizarDato(index, 'transporte', 'tren')} style={styles.transportBtn(p.transporte === 'tren')}>🚆 Tren</button>
                    <button type="button" onClick={() => actualizarDato(index, 'transporte', 'auto')} style={styles.transportBtn(p.transporte === 'auto')}>🚗 Auto</button>
                    <button type="button" onClick={() => actualizarDato(index, 'transporte', 'bus')} style={styles.transportBtn(p.transporte === 'bus')}>🚌 Bus</button>
                    <button type="button" onClick={() => actualizarDato(index, 'transporte', 'otro')} style={styles.transportBtn(p.transporte === 'otro')}>🔁 Otro</button>
                </div>
                <div style={{flex:1, marginLeft:12}}>
                    <label style={styles.label}>Nota</label>
                    <input type="text" value={p.notaCorta || ''} onChange={e => actualizarDato(index, 'notaCorta', e.target.value)} placeholder="Nota corta (ej: 'Perdí el tren')" style={styles.dateInput} />
                </div>
            </div>
            {/* Relato per-stop (bitácora fragmentada) */}
            <div style={{marginTop: 10}}>
                <label style={styles.label}>Relato de esta parada</label>
                <textarea
                    value={p.relato || ''}
                    onChange={e => actualizarDato(index, 'relato', e.target.value)}
                    placeholder="Cuenta lo que viviste en esta ciudad..."
                    style={styles.relatoTextarea}
                    rows={3}
                />
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
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none', fontSize: '0.9rem' },
  resultsList: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, overflow: 'hidden', maxHeight: '180px', overflowY: 'auto', boxShadow: SHADOWS.md },
  resultItem: { padding: '12px 15px', borderBottom: `1px solid ${COLORS.background}`, cursor: 'pointer', fontSize: '0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center', ':hover': { background: COLORS.background } },
  
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  item: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '15px', borderRadius: RADIUS.md, boxShadow: SHADOWS.sm },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cityName: { fontWeight: '700', fontSize: '0.95rem', color: COLORS.charcoalBlue },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { background: COLORS.background, border: 'none', padding: '6px', borderRadius: RADIUS.xs, cursor: 'pointer', color: COLORS.textSecondary, display:'flex', alignItems:'center', justifyContent:'center' },
  datesRow: { display: 'flex', gap: '15px' },
  dateGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  transportRow: { display: 'flex', gap: '12px', alignItems: 'center', marginTop: 10 },
  transportBtn: (active) => ({ padding: '6px 10px', borderRadius: RADIUS.sm, border: active ? '1px solid #3b82f6' : `1px solid ${COLORS.border}`, background: active ? '#eff6ff' : COLORS.surface, cursor: 'pointer' }),
  label: { fontSize: '0.7rem', textTransform:'uppercase', color:COLORS.textSecondary, fontWeight:'700' },
  dateInput: { border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, padding: '8px', fontSize: '0.85rem', color: COLORS.charcoalBlue, outline:'none', background:COLORS.background },
  relatoTextarea: { width: '100%', minHeight: '60px', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem', color: COLORS.charcoalBlue, outline: 'none', background: COLORS.background, boxShadow: SHADOWS.inner }
};

export default CityManager;