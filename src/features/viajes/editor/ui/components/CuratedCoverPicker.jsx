import React, { useEffect, useMemo, useState } from 'react';
import { Image, LoaderCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@shared/firebase';
import { cn } from '@shared/lib/utils/cn';

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
      } catch {
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
      <div className="flex items-center gap-2 text-[0.85rem] text-textSecondary">
        <LoaderCircle size={16} className="animate-spin" />
        <span>Cargando curado...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-[0.85rem] text-textSecondary">{error}</div>;
  }

  if (!options.length) {
    return <div className="text-[0.85rem] text-textSecondary">Sin fotos curadas para este destino.</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-hide">
        {options.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            onClick={() => onSelect?.(item)}
            disabled={disabled}
            title={item.credito?.nombre ? `Credito: ${item.credito.nombre}` : 'Foto curada'}
            className={cn(
              "min-w-[140px] min-h-[44px] rounded-[14px] border border-border bg-surface p-2 flex flex-col gap-2 cursor-pointer transition-all hover:border-atomicTangerine",
              disabled && "opacity-60 cursor-not-allowed hover:border-border"
            )}
          >
            <div
              className="w-full h-[84px] rounded-sm bg-cover bg-center bg-background"
              style={{ backgroundImage: `url(${item.url})` }}
            />
            <div className="flex items-center gap-1.5 text-charcoalBlue">
              <Image size={12} />
              <span className="text-[0.78rem] font-bold">{item.label || (item.scope === 'city' ? 'Ciudad' : 'Pais')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CuratedCoverPicker;
