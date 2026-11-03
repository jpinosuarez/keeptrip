import React from 'react';
import { COLORS } from '@shared/config';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

const resolveFlags = ({ banderas = [], paises = [] }) => {
  const direct = (Array.isArray(banderas) ? banderas : []).filter(Boolean);
  if (direct.length > 0) return direct;
  return (Array.isArray(paises) ? paises : [])
    .map((code) => getFlagUrl(code))
    .filter(Boolean);
};

const FLAG_STYLE = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
  opacity: 0.85,
};

/**
 * Reusable full-bleed flag collage. The root and every flag layer fill 100%
 * of the container (no negative margins, no letterboxing, no side gaps).
 * Accepts `banderas` (flag URLs) or `paises` (ISO country codes).
 */
const DocumentaryFlagHero = ({ banderas = [], paises = [], className, style = {} }) => {
  const flags = resolveFlags({ banderas, paises });

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 2,
    pointerEvents: 'none',
  };

  const noiseStyle = {
    position: 'absolute',
    inset: 0,
    opacity: 0.15,
    pointerEvents: 'none',
    zIndex: 3,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  };

  const renderFlags = () => {
    if (flags.length === 0) return null;

    if (flags.length === 1) {
      return <img src={flags[0]} alt="" style={FLAG_STYLE} />;
    }

    if (flags.length <= 3) {
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          {flags.map((flag, index) => (
            <img
              key={`${flag}-${index}`}
              src={flag}
              alt=""
              style={{ ...FLAG_STYLE, flex: '1 1 0', minWidth: 0 }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          width: '100%',
          height: '100%',
        }}
      >
        {flags.slice(0, 4).map((flag, index) => (
          <img key={`${flag}-${index}`} src={flag} alt="" style={FLAG_STYLE} />
        ))}
      </div>
    );
  };

  return (
    <div
      className={['relative w-full h-full overflow-hidden block', className].filter(Boolean).join(' ')}
      style={{ backgroundColor: COLORS.charcoalBlue, ...style }}
      aria-hidden="true"
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>{renderFlags()}</div>
      <div style={overlayStyle} />
      <div style={noiseStyle} />
    </div>
  );
};

export default DocumentaryFlagHero;
