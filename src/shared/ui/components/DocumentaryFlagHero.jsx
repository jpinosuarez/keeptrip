import React from 'react';
import { COLORS } from '@shared/config';

// Reusable DocumentaryFlagHero for both cards and top viewer
const DocumentaryFlagHero = ({ banderas = [], className, style = {} }) => {
  const flags = banderas.filter(Boolean); // Clean any nulls
  
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.charcoalBlue,
    overflow: 'hidden',
    ...style,
  };

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
    if (flags.length === 0) {
      return null;
    }
    
    if (flags.length === 1) {
      return (
        <img 
          src={flags[0]} 
          alt="Flag" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
        />
      );
    }
    
    if (flags.length === 2) {
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <img src={flags[0]} style={{ width: '50%', height: '100%', objectFit: 'cover', opacity: 0.8, clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }} />
          <img src={flags[1]} style={{ width: '50%', height: '100%', objectFit: 'cover', opacity: 0.8, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', marginLeft: '-20%' }} />
        </div>
      );
    }
    
    if (flags.length === 3) {
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <img src={flags[0]} style={{ width: '33.33%', height: '100%', objectFit: 'cover', opacity: 0.8, clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }} />
          <img src={flags[1]} style={{ width: '33.33%', height: '100%', objectFit: 'cover', opacity: 0.8, clipPath: 'polygon(20% 0, 100% 0, 80% 100%, 0% 100%)', marginLeft: '-6.66%' }} />
          <img src={flags[2]} style={{ width: '33.33%', height: '100%', objectFit: 'cover', opacity: 0.8, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', marginLeft: '-6.66%' }} />
        </div>
      );
    }
    
    // 4+ countries (Bento Grid)
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
        {flags.slice(0, 4).map((f, i) => (
          <img key={i} src={f} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
        ))}
      </div>
    );
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {renderFlags()}
      </div>
      <div style={overlayStyle} />
      <div style={noiseStyle} />
    </div>
  );
};

export default DocumentaryFlagHero;
