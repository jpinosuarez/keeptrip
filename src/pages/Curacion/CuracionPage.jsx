import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Globe, Image, LoaderCircle, MapPin, Save, Search, Trash2, X } from 'lucide-react';
import { db, storage } from '@shared/firebase';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { compressImage } from '@shared/lib/utils/imageUtils';
import { COLORS, SHADOWS, RADIUS, FONTS } from '@shared/config';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const normalizeKey = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-');
};

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const CuracionPage = () => {
  const [paisCode, setPaisCode] = useState('');
  const [paisLabel, setPaisLabel] = useState('');
  const [cityName, setCityName] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [countryResults, setCountryResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [creditName, setCreditName] = useState('');
  const [creditLink, setCreditLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [curated, setCurated] = useState(null);
  const countryDebounceRef = useRef(null);
  const cityDebounceRef = useRef(null);

  const selectedCountryLabel = useMemo(() => {
    if (paisLabel) return paisLabel;
    return paisCode ? paisCode : '';
  }, [paisLabel, paisCode]);

  const getCountryCodeFromFeature = (feature) => {
    const code =
      feature?.short_code ||
      feature?.properties?.short_code ||
      feature?.context?.find((c) => c.id.startsWith('country'))?.short_code;
    return code ? code.toUpperCase() : '';
  };

  const buildCountryResults = useCallback(
    (features = []) =>
      features
        .map((feature) => ({
          id: feature.id,
          nombre: feature.text,
          codigo: getCountryCodeFromFeature(feature)
        }))
        .filter((item) => item.codigo),
    []
  );

  const buildCityResults = (features = []) =>
    features.map((feature) => {
      const contextoPais = feature.context?.find((c) => c.id.startsWith('country'));
      return {
        id: feature.id,
        nombre: feature.text,
        paisNombre: contextoPais?.text || ''
      };
    });

  useEffect(() => {
    if (countryQuery.length < 3) {
      setCountryResults([]);
      return;
    }

    if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    countryDebounceRef.current = setTimeout(async () => {
      setIsCountryLoading(true);
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryQuery)}.json?types=country&language=es&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        setCountryResults(buildCountryResults(data.features || []));
      } catch {
        setCountryResults([]);
      } finally {
        setIsCountryLoading(false);
      }
    }, 300);

    return () => {
      if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    };
  }, [countryQuery, buildCountryResults]);

  useEffect(() => {
    if (!paisCode) {
      setCityResults([]);
      return;
    }

    if (cityQuery.length < 3) {
      setCityResults([]);
      return;
    }

    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityQuery)}.json?types=place,locality&language=es&country=${paisCode.toLowerCase()}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        setCityResults(buildCityResults(data.features || []));
      } catch {
        setCityResults([]);
      } finally {
        setIsCityLoading(false);
      }
    }, 300);

    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    };
  }, [cityQuery, paisCode]);

  useEffect(() => {
    let isActive = true;

    const cargar = async () => {
      if (!paisCode) {
        if (isActive) setCurated(null);
        return;
      }

      setIsLoading(true);
      try {
        const ref = doc(db, 'paises_info', paisCode);
        const snap = await getDoc(ref);
        if (!isActive) return;
        const data = snap.exists() ? snap.data() : null;
        setCurated(data?.curated || null);
      } catch {
        if (isActive) {
          setCurated(null);
          setMessage('No se pudo cargar el curado.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    cargar();
    return () => {
      isActive = false;
    };
  }, [paisCode]);

  useEffect(() => {
    if (!paisCode) return;
    setCityQuery('');
    setCityName('');
    setCityResults([]);
    setPreviewUrl('');
    setUrl('');
  }, [paisCode]);

  const getCityKey = () => (cityName ? normalizeKey(cityName) : 'country');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!paisCode) {
      setMessage('Selecciona un pais antes de subir.');
      event.target.value = '';
      return;
    }

    if (cityQuery && !cityName) {
      setMessage('Selecciona una ciudad de la lista antes de subir.');
      event.target.value = '';
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setMessage('Formato no soportado. Usa JPG o PNG.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const { blob, dataUrl } = await compressImage(file, 1920, 0.8);
      setPreviewUrl(dataUrl);

      const cityKey = getCityKey();
      const timestamp = Date.now();
      const storageRef = ref(storage, `curated/${paisCode}/${cityKey}/${timestamp}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      setUrl(downloadUrl);
      setMessage('Imagen subida y lista para guardar.');
    } catch (error) {
      console.error(error);
      setMessage('No se pudo subir la imagen.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const buildEntry = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;
    const trimmedName = creditName.trim();
    const trimmedLink = creditLink.trim();
    return {
      url: trimmedUrl,
      credito: trimmedName
        ? {
            nombre: trimmedName,
            link: trimmedLink || 'https://pexels.com'
          }
        : null
    };
  };

  const handleSave = async () => {
    if (!paisCode) {
      setMessage('Selecciona un pais.');
      return;
    }

    if (cityQuery && !cityName) {
      setMessage('Selecciona una ciudad de la lista.');
      return;
    }

    const entry = buildEntry();
    if (!entry) {
      setMessage('Ingresa una URL valida.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      const next = curated ? { ...curated } : { country: [], cities: {} };
      if (!next.country) next.country = [];
      if (!next.cities) next.cities = {};

      if (cityName.trim()) {
        const key = normalizeKey(cityName);
        if (!next.cities[key]) next.cities[key] = [];
        next.cities[key] = [...asArray(next.cities[key]), entry];
      } else {
        next.country = [...asArray(next.country), entry];
      }

      await setDoc(doc(db, 'paises_info', paisCode), { curated: next }, { merge: true });
      setCurated(next);
      setUrl('');
      setCityName('');
      setCreditName('');
      setCreditLink('');
      setMessage('Curado actualizado.');
    } catch {
      setMessage('No se pudo guardar el curado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async ({ scope, key, index }) => {
    if (!paisCode || !curated) return;

    const next = { ...curated };
    if (scope === 'country') {
      const list = asArray(next.country);
      list.splice(index, 1);
      next.country = list;
    } else if (scope === 'city' && key) {
      const list = asArray(next.cities?.[key]);
      list.splice(index, 1);
      next.cities = { ...next.cities, [key]: list };
    }

    setIsSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'paises_info', paisCode), { curated: next }, { merge: true });
      setCurated(next);
    } catch {
      setMessage('No se pudo eliminar la foto.');
    } finally {
      setIsSaving(false);
    }
  };

  const countryList = asArray(curated?.country);
  const cityEntries = curated?.cities || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Curacion de Portadas</h1>
          <p style={styles.subtitle}>Define fotos representativas por pais y ciudad.</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.row}>
          <label style={styles.label}>Pais</label>
          <div style={styles.searchBox}>
            <Search size={16} color={COLORS.textSecondary} />
            <input
              style={styles.searchInput}
              value={countryQuery}
              onChange={(event) => {
                setCountryQuery(event.target.value);
                if (paisCode) {
                  setPaisCode('');
                  setPaisLabel('');
                }
              }}
              placeholder="Buscar pais (min 3 letras)..."
            />
            {countryQuery && (
              <button type="button" style={styles.clearBtn} onClick={() => {
                setCountryQuery('');
                setCountryResults([]);
                setPaisCode('');
                setPaisLabel('');
              }}>
                <X size={14} />
              </button>
            )}
          </div>
          {isCountryLoading && (
            <div style={styles.loadingRow}><LoaderCircle size={14} className="spin" /> Buscando pais...</div>
          )}
          {countryResults.length > 0 && (
            <div style={styles.resultsList}>
              {countryResults.map((item) => (
                
                <button
                  key={item.id}
                  type="button"
                  style={styles.resultItem}
                  onClick={() => {
                    setPaisCode(item.codigo);
                    setPaisLabel(item.nombre);
                    setCountryQuery(item.nombre);
                    setCountryResults([]);
                  }}
                >
                  <div style={styles.resultIcon}>
                    {getFlagUrl(item.codigo) ? (
                      <img
                        src={getFlagUrl(item.codigo)}
                        alt="flag"
                        style={styles.flagIcon}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe size={14} />
                    )}
                  </div>
                  <span style={styles.resultText}>{item.nombre}</span>
                  <span style={styles.resultMeta}>{item.codigo}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCountryLabel && (
          <div style={styles.helper}>
            Curando: <strong>{selectedCountryLabel}</strong>
          </div>
        )}

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Ciudad (opcional)</label>
            <div style={styles.searchBox}>
              <MapPin size={16} color={COLORS.textSecondary} />
              <input
                style={styles.searchInput}
                value={cityQuery}
                onChange={(event) => {
                  setCityQuery(event.target.value);
                  if (cityName) setCityName('');
                }}
                placeholder={paisCode ? 'Buscar ciudad (min 3 letras)...' : 'Selecciona un pais primero'}
                disabled={!paisCode}
              />
              {cityQuery && (
                <button type="button" style={styles.clearBtn} onClick={() => {
                  setCityQuery('');
                  setCityResults([]);
                  setCityName('');
                }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {isCityLoading && (
              <div style={styles.loadingRow}><LoaderCircle size={14} className="spin" /> Buscando ciudad...</div>
            )}
            {cityQuery && !cityName && !isCityLoading && cityResults.length === 0 && (
              <div style={styles.helperText}>Selecciona una ciudad de la lista para vincularla.</div>
            )}
            {cityResults.length > 0 && (
              <div style={styles.resultsList}>
                {cityResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={styles.resultItem}
                    onClick={() => {
                      setCityName(item.nombre);
                      setCityQuery(item.nombre);
                      setCityResults([]);
                    }}
                  >
                    <div style={styles.resultIcon}>
                      {getFlagUrl(paisCode) ? (
                        <img
                          src={getFlagUrl(paisCode)}
                          alt="flag"
                          style={styles.flagIcon}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <MapPin size={14} />
                      )}
                    </div>
                    <span style={styles.resultText}>{item.nombre}</span>
                    <span style={styles.resultMeta}>{item.paisNombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={styles.label}>Imagen (archivo)</label>
            <div style={styles.uploadBox}>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading && (
                <span style={styles.uploadStatus}><LoaderCircle size={14} className="spin" /> Subiendo...</span>
              )}
            </div>
            {previewUrl && (
              <div style={styles.preview}>
                <img src={previewUrl} alt="preview" style={styles.previewImg} />
              </div>
            )}
          </div>
          <div>
            <label style={styles.label}>URL de foto</label>
            <input
              style={styles.input}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Se completa al subir o pega un enlace"
            />
          </div>
          <div>
            <label style={styles.label}>Credito (opcional)</label>
            <input
              style={styles.input}
              value={creditName}
              onChange={(event) => setCreditName(event.target.value)}
              placeholder="Autor"
            />
          </div>
          <div>
            <label style={styles.label}>Link credito (opcional)</label>
            <input
              style={styles.input}
              value={creditLink}
              onChange={(event) => setCreditLink(event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.saveBtn(isSaving)} onClick={handleSave} disabled={isSaving}>
            {isSaving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {isSaving ? 'Guardando...' : 'Agregar foto'}
          </button>
          {message && <span style={styles.message}>{message}</span>}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Fotos por pais</div>
        {isLoading ? (
          <div style={styles.loadingRow}><LoaderCircle size={16} className="spin" /> Cargando...</div>
        ) : countryList.length === 0 ? (
          <div style={styles.empty}>Sin fotos curadas para el pais.</div>
        ) : (
          <div style={styles.grid}>
            {countryList.map((item, index) => (
              <div key={`${item.url}-${index}`} style={styles.photoCard}>
                <div style={{ ...styles.thumb, backgroundImage: `url(${item.url})` }} />
                <div style={styles.photoMeta}>
                  <span style={styles.tag}><Image size={12} /> Pais</span>
                  <button
                    type="button"
                    style={styles.removeBtn}
                    onClick={() => handleRemove({ scope: 'country', index })}
                    disabled={isSaving}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Fotos por ciudad</div>
        {isLoading ? (
          <div style={styles.loadingRow}><LoaderCircle size={16} className="spin" /> Cargando...</div>
        ) : Object.keys(cityEntries).length === 0 ? (
          <div style={styles.empty}>Sin fotos curadas por ciudad.</div>
        ) : (
          Object.entries(cityEntries).map(([key, items]) => (
            <div key={key} style={{ marginBottom: '22px' }}>
              <div style={styles.cityTitle}>{key.replace(/-/g, ' ')}</div>
              <div style={styles.grid}>
                {asArray(items).map((item, index) => (
                  <div key={`${item.url}-${index}`} style={styles.photoCard}>
                    <div style={{ ...styles.thumb, backgroundImage: `url(${item.url})` }} />
                    <div style={styles.photoMeta}>
                      <span style={styles.tag}><Image size={12} /> Ciudad</span>
                      <button
                        type="button"
                        style={styles.removeBtn}
                        onClick={() => handleRemove({ scope: 'city', key, index })}
                        disabled={isSaving}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONTS.heading },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '2.3rem', fontWeight: 900, color: COLORS.charcoalBlue, marginBottom: '8px' },
  subtitle: { color: COLORS.textSecondary },
  card: { background: COLORS.surface, borderRadius: RADIUS.xl, padding: '26px', border: `1px solid ${COLORS.background}`, boxShadow: SHADOWS.md, marginBottom: '22px' },
  row: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: COLORS.textSecondary },
  helper: { marginTop: '12px', color: COLORS.charcoalBlue, fontWeight: 600 },
  helperText: { fontSize: '0.8rem', color: COLORS.textSecondary },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' },
  input: { padding: '12px', borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, fontSize: '1rem' },
  uploadBox: {
    padding: '12px',
    borderRadius: RADIUS.md,
    border: '1px dashed #cbd5f5',
    background: COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  uploadStatus: { display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textSecondary, fontSize: '0.8rem' },
  preview: { marginTop: '12px', borderRadius: RADIUS.md, overflow: 'hidden', border: `1px solid ${COLORS.border}` },
  previewImg: { width: '100%', height: '140px', objectFit: 'cover', display: 'block' },
  actions: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '18px' },
  saveBtn: (disabled) => ({
    background: disabled ? '#cbd5f5' : COLORS.atomicTangerine,
    color: COLORS.surface,
    padding: '12px 20px',
    borderRadius: RADIUS.md,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }),
  message: { color: COLORS.mutedTeal, fontWeight: 700 },
  sectionTitle: { fontWeight: 800, color: COLORS.charcoalBlue, marginBottom: '12px' },
  empty: { color: COLORS.textSecondary },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textSecondary },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.background
  },
  searchInput: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.95rem' },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center'
  },
  resultsList: {
    marginTop: '8px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    background: COLORS.surface,
    maxHeight: '220px',
    overflowY: 'auto'
  },
  resultItem: {
    width: '100%',
    border: 'none',
    background: COLORS.surface,
    textAlign: 'left',
    padding: '10px 12px',
    display: 'grid',
    gridTemplateColumns: '24px 1fr auto',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  resultIcon: {
    width: '24px',
    height: '24px',
    borderRadius: RADIUS.sm,
    background: COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.mutedTeal
  },
  flagIcon: { width: '16px', height: '12px', borderRadius: '2px', objectFit: 'cover' },
  resultText: { fontWeight: 700, color: COLORS.charcoalBlue },
  resultMeta: { fontSize: '0.75rem', color: COLORS.textSecondary },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  photoCard: { borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}`, overflow: 'hidden', background: COLORS.surface },
  thumb: { width: '100%', height: '130px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: COLORS.background },
  photoMeta: { padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tag: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary },
  removeBtn: { background: '#fff1f2', border: '1px solid #fee2e2', color: COLORS.danger, padding: '6px 8px', borderRadius: RADIUS.sm, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  cityTitle: { fontWeight: 700, color: COLORS.charcoalBlue, marginBottom: '10px', textTransform: 'capitalize' }
};

export default CuracionPage;
