import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { COLORS, RADIUS, FONTS } from '@shared/config';

const PaginaSellos = ({ region, paises, sellosMap, manejarEliminar }) => {
  
  // Colores de tinta según la región (Efecto de diseño oficial)
  const obtenerColorTinta = (reg) => {
    const colores = {
      'Americas': '#1e40af', // Azul tinta
      'Europe': '#991b1b',   // Rojo oscuro
      'Asia': '#065f46',     // Verde bosque
      'Africa': '#854d0e',   // Ocre
      'Oceania': '#3730a3'   // Violeta
    };
    return colores[reg] || '#475569';
  };

  const colorTinta = obtenerColorTinta(region);

  return (
    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h3 className="titulo-region">
        {region.toUpperCase()}
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
        gap: '40px', 
        marginTop: '20px' 
      }}>
        {paises.map((p) => {
          const tieneSello = sellosMap[p.code];
          // Rotación aleatoria persistente basada en el código del país
          const randomRotate = (p.code.charCodeAt(0) % 12) - 6;

          return (
            <Motion.div 
              key={p.code}
              initial={{ scale: 0 }} 
              animate={{ scale: 1, rotate: randomRotate }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
              className="contenedor-sello"
              style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            >
              {tieneSello ? (
                /* SELLO PERSONALIZADO PNG */
                <div className="sello-postal" style={{ width: '100%' }}>
                  <img src={tieneSello} alt={p.nombreEspanol} />
                </div>
              ) : (
                /* SELLO GENÉRICO TIPO CAUCHO */
                <div style={{
                  width: '110px',
                  height: '110px',
                  border: `3px solid ${colorTinta}`,
                  borderRadius: RADIUS.md,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  color: colorTinta,
                  opacity: 0.8,
                  maskImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
                  fontFamily: FONTS.mono,
                  textTransform: 'uppercase',
                  borderStyle: 'double',
                  borderWidth: '4px'
                }}>
                  <span style={{ fontSize: '1.8rem', filter: 'grayscale(1) contrast(1.5)', marginBottom: '4px' }}>
                    {p.flag}
                  </span>
                  <div style={{ fontSize: '0.6rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>
                    {p.nombreEspanol}
                  </div>
                  <div style={{ 
                    fontSize: '0.5rem', 
                    borderTop: `1px solid ${colorTinta}`, 
                    marginTop: '5px', 
                    paddingTop: '3px',
                    width: '100%',
                    textAlign: 'center'
                  }}>
                    ADMITTED 2026
                  </div>
                </div>
              )}

              <Trash2 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  top: -5, 
                  right: -5, 
                  color: COLORS.danger, 
                  cursor: 'pointer', 
                  opacity: 0.3 
                }} 
                onClick={() => manejarEliminar(p.code)} 
              />
            </Motion.div>
          );
        })}
      </div>
    </Motion.div>
  );
};

export default PaginaSellos;