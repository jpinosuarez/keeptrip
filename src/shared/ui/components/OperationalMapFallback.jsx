import React from 'react';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@shared/config';
import { WorldMapSVG } from './WorldMapSVG';

const OperationalMapFallback = ({
  message,
  borderRadius = RADIUS.xl,
  containerStyle = undefined,
  overlayStyle = undefined,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#EFF6FF',
        ...containerStyle,
      }}
      data-testid="operational-map-fallback"
    >
      <WorldMapSVG color={COLORS.atomicTangerine} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 'min(92%, 640px)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            background: 'rgba(255, 255, 255, 0.88)',
            boxShadow: SHADOWS.md,
            color: COLORS.charcoalBlue,
            fontFamily: FONTS.text,
            fontSize: '0.95rem',
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: 'center',
            padding: '12px 16px',
            ...overlayStyle,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default OperationalMapFallback;
