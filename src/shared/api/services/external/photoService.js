import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EXTERNAL_API_TIMEOUT_MS, FOTO_DEFAULT_URL } from '@shared/lib/utils/viajeUtils';

const conTimeout = async (fn, fallbackValue, timeoutMs = EXTERNAL_API_TIMEOUT_MS) => {
  try {
    return await Promise.race([
      fn(),
      new Promise((resolve) => {
        setTimeout(() => resolve(fallbackValue), timeoutMs);
      })
    ]);
  } catch {
    return fallbackValue;
  }
};

const normalizeKey = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-');
};

const pickFirstPhoto = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value === 'object' && value.url) return value;
  return null;
};

// curated schema (paises_info/{paisCode}):
// curated: { country: [{ url, credito? }] | { url, credito? }, cities: { [cityKey]: [{ url, credito? }] } }
const obtenerFotoCurada = ({ docData, ciudades = [] }) => {
  if (!docData) return null;
  const curated = docData.curated || null;
  if (!curated) return null;

  if (Array.isArray(ciudades) && ciudades.length > 0) {
    const ciudadesCuradas = curated.cities || {};
    for (const ciudad of ciudades) {
      const key = normalizeKey(ciudad);
      const fotoCiudad = pickFirstPhoto(ciudadesCuradas[key]);
      if (fotoCiudad) return fotoCiudad;
    }
  }

  return pickFirstPhoto(curated.country);
};

const obtenerFotoPexels = async ({ query, pexelsApiKey, logger }) => {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
    { headers: { Authorization: pexelsApiKey } }
  );

  if (!response.ok) {
    logger.error(`Error de Pexels: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  if (!data.photos || data.photos.length === 0) return null;

  const foto = data.photos[0];
  const fotoUrl = foto.src?.large || foto.src?.medium || foto.src?.small;
  if (!fotoUrl) return null;

  return {
    url: fotoUrl,
    credito: {
      nombre: foto.photographer || 'Fotografo',
      link: foto.photographer_url || 'https://pexels.com'
    }
  };
};

const buildQueryCandidates = ({ ciudades = [], paisNombre }) => {
  const candidates = [];
  if (Array.isArray(ciudades)) {
    ciudades.forEach((ciudad) => {
      if (ciudad) {
        candidates.push(`${ciudad} ${paisNombre} landmark`);
      }
    });
  }
  if (paisNombre) {
    candidates.push(`${paisNombre} travel landmark`);
  }
  return candidates;
};

export const obtenerFotoConCache = async ({
  db,
  paisNombre,
  paisCode,
  pexelsApiKey,
  logger = console,
  ciudades = []
}) => {
  try {
    if (!paisNombre || !pexelsApiKey) return null;

    if (paisCode) {
      const docRef = doc(db, 'paises_info', paisCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().url) {
        const fotoCurada = obtenerFotoCurada({ docData: docSnap.data(), ciudades });
        if (fotoCurada) return fotoCurada;
        return docSnap.data();
      }
      if (docSnap.exists()) {
        const fotoCurada = obtenerFotoCurada({ docData: docSnap.data(), ciudades });
        if (fotoCurada) return fotoCurada;
      }
    }

    const queries = buildQueryCandidates({ ciudades, paisNombre });
    let fotoInfo = null;
    for (const query of queries) {
      fotoInfo = await obtenerFotoPexels({ query, pexelsApiKey, logger });
      if (fotoInfo) break;
    }
    if (!fotoInfo) return null;

    if (paisCode) {
      await setDoc(doc(db, 'paises_info', paisCode), fotoInfo, { merge: true });
    }

    return fotoInfo;
  } catch (error) {
    logger.error('No se pudo cargar foto de Pexels:', error?.message || error);
    return null;
  }
};

export const obtenerFotoConCacheSeguro = async ({
  db,
  paisNombre,
  paisCode,
  pexelsApiKey,
  logger = console,
  ciudades = []
}) => {
  const fotoPorDefecto = { url: FOTO_DEFAULT_URL, credito: null };
  if (!paisNombre) return fotoPorDefecto;

  const fotoInfo = await conTimeout(
    () => obtenerFotoConCache({ db, paisNombre, paisCode, pexelsApiKey, logger, ciudades }),
    null
  );

  return fotoInfo || fotoPorDefecto;
};
