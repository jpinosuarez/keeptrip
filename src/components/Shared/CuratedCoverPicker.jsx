import React, { useEffect, useMemo, useState } from 'react';
import { Image, LoaderCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLORS, RADIUS } from '../../theme';

const normalizeKey = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-');
};

const buildOptions = ({ curated, ciudades }) => {
  if (!curated) return [];
  const options = [];
  const seen = new Set();

  if (Array.isArray(ciudades) && ciudades.length > 0) {
    const citiesMap = curated.cities || {};
    ciudades.forEach((ciudad) => {
      const key = normalizeKey(ciudad);
      const items = Array.isArray(citiesMap[key]) ? citiesMap[key] : (citiesMap[key] ? [citiesMap[key]] : []);
      items.forEach((item) => {
        if (!item?.url || seen.has(item.url)) return;
        seen.add(item.url);
        options.push({ ...item, scope: 'city', label: ciudad });
      });
    });
  }

  const countryItems = Array.isArray(curated.country)
    ? curated.country
    : (curated.country ? [curated.country] : []);

  countryItems.forEach((item) => {
    if (!item?.url || seen.has(item.url)) return;
    seen.add(item.url);
    options.push({ ...item, scope: 'country', label: 'Pais' });
  });

  return options;
};

const CuratedCoverPicker = ({ paisCode, ciudades = [], onSelect, disabled = false }) => {
  const [curated, setCurated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const cargar = async () => {
      if (!paisCode) {
        if (isActive) {
          setCurated(null);
          setError('');
        }
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const ref = doc(db, 'paises_info', paisCode);
        const snap = await getDoc(ref);
        if (!isActive) return;
        const data = snap.exists() ? snap.data() : null;
        setCurated(data?.curated || null);
      } catch (err) {
        if (!isActive) return;
        setError('No se pudo cargar el curado.');
        setCurated(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    cargar();
    return () => {
      isActive = false;
    };
  }, [paisCode]);

  const options = useMemo(() => buildOptions({ curated, ciudades }), [curated, ciudades]);

  if (isLoading) {
    return (
      <div style={styles.loadingRow}>
        <LoaderCircle size={16} className="spin" />
        <span>Cargando curado...</span>
      </div>
    );
  }

  if (error) {
    return <div style={styles.helperText}>{error}</div>;
  }

  if (!options.length) {
    return <div style={styles.helperText}>Sin fotos curadas para este destino.</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        {options.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            style={styles.card(disabled)}
            onClick={() => onSelect?.(item)}
            disabled={disabled}
            title={item.credito?.nombre ? `Credito: ${item.credito.nombre}` : 'Foto curada'}
          >
            <div
              style={{
                ...styles.thumb,
                backgroundImage: `url(${item.url})`
              }}
            />
            <div style={styles.labelRow}>
              <Image size={12} />
              <span style={styles.labelText}>{item.label || (item.scope === 'city' ? 'Ciudad' : 'Pais')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' },
  card: (disabled) => ({
    minWidth: '140px',
    borderRadius: '14px',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1
  }),
  thumb: {
    width: '100%',
    height: '84px',
    borderRadius: RADIUS.sm,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: COLORS.background
  },
  labelRow: { display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.charcoalBlue },
  labelText: { fontSize: '0.78rem', fontWeight: 700 },
  helperText: { fontSize: '0.85rem', color: COLORS.textSecondary },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: COLORS.textSecondary }
};

export default CuratedCoverPicker;
