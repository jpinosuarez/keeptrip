import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Plus, TrendingUp, Globe } from "lucide-react";
import { COLORS } from '@shared/config';
import { styles } from "./BuscadorModal.styles";
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DESTINOS_POPULARES = [
  { nombre: "Japón", code: "JP", icon: "🇯🇵" },
  { nombre: "Italia", code: "IT", icon: "🇮🇹" },
  { nombre: "Francia", code: "FR", icon: "🇫🇷" },
  { nombre: "México", code: "MX", icon: "🇲🇽" },
  { nombre: "Argentina", code: "AR", icon: "🇦🇷" },
  { nombre: "Nueva York", code: "US", icon: "🗽", esCiudad: true, coords: [-74.006, 40.712] }
];

const BuscadorModal = ({
  isOpen,
  onClose,
  filtro,
  setFiltro,
  seleccionarLugar,
  onSearchError,
  onNoResults
}) => {
  const { i18n } = useTranslation();
  const { isMobile } = useWindowSize(768);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef(null);
  const ultimaBusquedaSinResultado = useRef("");

  useEffect(() => {
    if (!isOpen) {
      setResultados([]);
      ultimaBusquedaSinResultado.current = "";
    }
  }, [isOpen]);

  useEffect(() => {
    if (!filtro) {
      setResultados([]);
      ultimaBusquedaSinResultado.current = "";
      return;
    }

    if (filtro.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(filtro)}.json?types=country,place,locality&language=${i18n.language}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(endpoint);
        const data = await res.json();

        const procesados = (data.features || []).map((feat) => {
          const contextoPais =
            feat.context?.find((c) => c.id.startsWith("country")) ||
            (feat.place_type.includes("country") ? feat : null);

          const codigoPais = (
            contextoPais?.short_code ||
            contextoPais?.properties?.short_code ||
            feat.properties?.short_code ||
            feat.short_code
          )?.toUpperCase();

          return {
            id: feat.id,
            nombre: feat.text,
            nombreCompleto: feat.place_name,
            tipo: feat.place_type[0],
            coordenadas: feat.center,
            paisCodigo: codigoPais,
            paisNombre: contextoPais?.text || (feat.place_type.includes("country") ? feat.text : "")
          };
        });

        setResultados(procesados);

        if (
          procesados.length === 0 &&
          filtro.trim().length >= 3 &&
          ultimaBusquedaSinResultado.current !== filtro.trim().toLowerCase()
        ) {
          ultimaBusquedaSinResultado.current = filtro.trim().toLowerCase();
          onNoResults?.(filtro.trim());
        }
      } catch (error) {
        console.error("Error buscando en Mapbox:", error);
        onSearchError?.();
      } finally {
        setCargando(false);
      }
    }, 300);
  }, [filtro, onSearchError, onNoResults, i18n.language]);

  const seleccionarPopular = (destino) => {
    if (destino.esCiudad) {
      seleccionarLugar({
        esPais: false,
        nombre: destino.nombre,
        coordenadas: destino.coords,
        paisCodigo: destino.code,
        paisNombre: "Estados Unidos"
      });
      return;
    }

    seleccionarLugar({
      esPais: true,
      nombre: destino.nombre,
      code: destino.code,
      coordenadas: [0, 0]
    });
  };

  const manejarSeleccion = (item) => {
    seleccionarLugar({
      esPais: item.tipo === "country",
      nombre: item.nombre,
      coordenadas: item.coordenadas,
      paisNombre: item.paisNombre,
      paisCodigo: item.paisCodigo,
      code: item.paisCodigo
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.modalOverlay(isMobile)}
        onClick={onClose}
      >
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          style={styles.modalContent(isMobile)}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h3 style={styles.titulo}>Nuevo Destino</h3>
            <div onClick={onClose} style={{ cursor: "pointer", padding: "5px" }}>
              <X size={20} color={COLORS.charcoalBlue} />
            </div>
          </div>

          <div style={styles.searchBox}>
            <Search size={18} color={COLORS.atomicTangerine} />
            <input
              autoFocus
              placeholder="Escribe un país o ciudad..."
              style={styles.inputStyle}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div style={styles.listaContainer(isMobile)} className="custom-scroll">
            {!filtro && (
              <div style={{ padding: "20px" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: COLORS.mutedTeal,
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    letterSpacing: "0.5px"
                  }}
                >
                  <TrendingUp size={14} /> DESTINOS POPULARES
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {DESTINOS_POPULARES.map((dest) => (
                    <button key={dest.nombre} onClick={() => seleccionarPopular(dest)} style={styles.tagBtn}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{dest.icon}</span> {dest.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cargando && (
              <div style={{ textAlign: "center", padding: "30px", color: COLORS.textSecondary, fontStyle: "italic" }}>
                Buscando en el mapa... 🌍
              </div>
            )}

            {resultados.map((item) => {
              const flagUrl = getFlagUrl(item.paisCodigo);
              return (
                <div
                  key={item.id}
                  style={styles.resultItem}
                  onClick={() => manejarSeleccion(item)}
                  className="result-item-hover"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background;
                    const label = e.currentTarget.querySelector(".add-label");
                    if (label) label.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    const label = e.currentTarget.querySelector(".add-label");
                    if (label) label.style.opacity = "0";
                  }}
                >
                  <div style={styles.iconBox(item.tipo === "country")}>
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt="flag"
                        style={{ width: "24px", height: "18px", objectFit: "cover", borderRadius: "2px" }}
                      />
                    ) : item.tipo === "country" ? (
                      <Globe size={18} />
                    ) : (
                      <MapPin size={18} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={styles.nombrePais}>{item.nombre}</span>
                    <span style={styles.subtext}>{item.tipo === "country" ? "País" : item.paisNombre}</span>
                  </div>

                  <div className="add-label" style={styles.addLabel}>
                    <Plus size={14} /> Añadir
                  </div>
                </div>
              );
            })}
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default BuscadorModal;
