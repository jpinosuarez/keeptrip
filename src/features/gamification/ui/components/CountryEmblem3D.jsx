import React, { useId } from 'react';
import { motion as Motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock, Bookmark, Compass } from 'lucide-react';
import { getCountryEmblemSpec } from '../../model/countryEmblemsCatalog';
import { cn } from '@shared/lib/utils/cn';

export const TIER_METAL_STYLES = {
  locked: {
    rimMain: '#334155',
    rimLight: '#475569',
    rimDark: '#1E293B',
    glow: 'rgba(51, 65, 85, 0.15)',
    pedestalRing: 'border-slate-700/80',
  },
  wishlist: {
    rimMain: '#45B0A8',
    rimLight: '#5EEAD4',
    rimDark: '#0F766E',
    glow: 'rgba(69, 176, 168, 0.35)',
    pedestalRing: 'border-[#45B0A8]/70 border-dashed',
  },
  raices_base: {
    rimMain: '#2C3E50',
    rimLight: '#64748B',
    rimDark: '#0F172A',
    glow: 'rgba(44, 62, 80, 0.3)',
    pedestalRing: 'border-[#2C3E50]/80',
  },
  explorador: {
    rimMain: '#FF6B35',
    rimLight: '#FDBA74',
    rimDark: '#9A3412',
    glow: 'rgba(255, 107, 53, 0.38)',
    pedestalRing: 'border-[#FF6B35]/80',
  },
  conocedor: {
    rimMain: '#94A3B8',
    rimLight: '#F1F5F9',
    rimDark: '#475569',
    glow: 'rgba(148, 163, 184, 0.38)',
    pedestalRing: 'border-slate-300/90',
  },
  experto: {
    rimMain: '#F59E0B',
    rimLight: '#FDE68A',
    rimDark: '#92400E',
    glow: 'rgba(245, 158, 11, 0.42)',
    pedestalRing: 'border-amber-400/90',
  },
  segundo_hogar: {
    rimMain: '#45B0A8',
    rimLight: '#99F6E4',
    rimDark: '#115E59',
    glow: 'rgba(45, 212, 191, 0.45)',
    pedestalRing: 'border-[#45B0A8]',
  },
  leyenda: {
    rimMain: '#F59E0B',
    rimLight: '#FF6B35',
    rimDark: '#78350F',
    glow: 'rgba(255, 107, 53, 0.55)',
    pedestalRing: 'border-amber-400 ring-2 ring-[#FF6B35]/40',
  },
};

const VARIANT_DIMENSIONS = {
  thumbnail: { box: 'w-12 h-12 rounded-xl', svgSize: 38, extrusionLayers: [0, -2] },
  card: { box: 'w-28 h-28 md:w-32 md:h-32 rounded-full', svgSize: 104, extrusionLayers: [0, -2, -4, -6, -8] },
  detail: { box: 'w-56 h-56 md:w-64 md:h-64 rounded-full', svgSize: 210, extrusionLayers: [0, -2, -4, -6, -8] },
};

function renderFlagFill(palette, clipOriginId) {
  const colors = Array.isArray(palette?.colors) && palette.colors.length > 0
    ? palette.colors
    : ['#FF6B35', '#FFFFFF', '#FF6B35'];
  const proportions = Array.isArray(palette?.proportions) && palette.proportions.length === colors.length
    ? palette.proportions
    : colors.map(() => 1 / colors.length);
  const direction = palette?.direction || 'horizontal';

  if (direction === 'radial') {
    const bg = colors[0] || '#FFFFFF';
    const circleColor = colors[1] || palette?.accent || '#BC002D';
    return (
      <g>
        <rect x="0" y="0" width="256" height="256" fill={bg} />
        <circle cx="128" cy="128" r="56" fill={circleColor} />
      </g>
    );
  }

  if (direction === 'diagonal') {
    const gradId = `${clipOriginId}-diag`;
    let acc = 0;
    return (
      <>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((col, idx) => {
              const start = Math.round(acc * 100);
              acc += proportions[idx] || 1 / colors.length;
              const end = Math.round(acc * 100);
              return (
                <React.Fragment key={`${col}-${idx}`}>
                  <stop offset={`${start}%`} stopColor={col} />
                  <stop offset={`${end}%`} stopColor={col} />
                </React.Fragment>
              );
            })}
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="256" height="256" fill={`url(#${gradId})`} />
      </>
    );
  }

  let cursor = 0;
  return (
    <g>
      {colors.map((col, idx) => {
        const span = (proportions[idx] || 1 / colors.length) * 256;
        const pos = cursor;
        cursor += span;
        return direction === 'vertical' ? (
          <rect key={`${col}-${idx}`} x={pos} y="0" width={span + 1.5} height="256" fill={col} />
        ) : (
          <rect key={`${col}-${idx}`} x="0" y={pos} width="256" height={span + 1.5} fill={col} />
        );
      })}
      {palette?.accent && (
        <circle cx="128" cy="128" r="16" fill={palette.accent} opacity="0.92" />
      )}
    </g>
  );
}

export default function CountryEmblem3D({
  countryCode,
  tier = 'explorador',
  status = 'visited',
  variant = 'card',
  catalogSpec: propSpec,
  discoveryCode = '#01',
  firstVisitedAt = null,
  isFlipped = false,
  interactive = true,
  className,
}) {
  const uniqueId = useId().replace(/:/g, '');
  const spec = propSpec || getCountryEmblemSpec(countryCode);
  const svgPath = spec?.svgPath || 'M128,32 L216,80 L216,176 L128,224 L40,176 L40,80 Z';
  const isMicrostate = Boolean(spec?.isMicrostate);
  const metal = TIER_METAL_STYLES[tier] || TIER_METAL_STYLES.explorador;
  const dims = VARIANT_DIMENSIONS[variant] || VARIANT_DIMENSIONS.card;

  const isLocked = status === 'locked' || tier === 'locked';
  const isWishlist = status === 'wishlist' || tier === 'wishlist';

  // Framer Motion values: pointer-driven tilt never triggers a React re-render.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 180, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 180, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [28, -4]);
  const baseRotateY = useTransform(springX, [-0.5, 0.5], [-34, 18]);

  const handlePointerMove = (e) => {
    if (!interactive || variant === 'thumbnail') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(Math.max(-0.5, Math.min(0.5, nx)));
    pointerY.set(Math.max(-0.5, Math.min(0.5, ny)));
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const clipId = `emblem-clip-${spec?.iso2 || 'XX'}-${uniqueId}`;
  const sheenId = `emblem-sheen-${uniqueId}`;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: '1000px' }}
      className={cn(
        'relative flex items-center justify-center bg-[#0F172A] border-2 shadow-inner select-none overflow-visible',
        dims.box,
        metal.pedestalRing,
        interactive && variant !== 'thumbnail' && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      data-testid={`country-emblem-3d-${spec?.iso2 || countryCode || 'unknown'}`}
      data-tier={tier}
      data-variant={variant}
    >
      <div
        aria-hidden="true"
        style={{ background: `radial-gradient(circle, ${metal.glow} 0%, transparent 72%)` }}
        className="absolute inset-1 rounded-full pointer-events-none"
      />

      {isMicrostate && variant !== 'thumbnail' && (
        <svg
          aria-hidden="true"
          viewBox="0 0 256 256"
          className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] pointer-events-none opacity-35"
        >
          <circle cx="128" cy="128" r="108" fill="none" stroke={metal.rimLight} strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="128" y1="12" x2="128" y2="36" stroke={metal.rimLight} strokeWidth="1.5" />
          <line x1="128" y1="220" x2="128" y2="244" stroke={metal.rimLight} strokeWidth="1.5" />
          <line x1="12" y1="128" x2="36" y2="128" stroke={metal.rimLight} strokeWidth="1.5" />
          <line x1="220" y1="128" x2="244" y2="128" stroke={metal.rimLight} strokeWidth="1.5" />
        </svg>
      )}

      <Motion.div
        style={{
          width: dims.svgSize,
          height: dims.svgSize,
          position: 'relative',
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY: isFlipped ? 180 : baseRotateY,
          rotateZ: 0,
        }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        className="flex items-center justify-center"
      >
        {variant !== 'thumbnail' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 256 256"
            style={{ transform: 'translateZ(-16px) translateY(8px)' }}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-65 blur-[3px]"
          >
            <path d={svgPath} fill="#020617" stroke="#020617" strokeWidth="10" strokeLinejoin="round" />
          </svg>
        )}

        {dims.extrusionLayers.slice(1).map((zOffset, idx) => (
          <svg
            key={zOffset}
            aria-hidden="true"
            viewBox="0 0 256 256"
            style={{
              transform: `translateZ(${zOffset}px)`,
              filter: `brightness(${Math.max(0.45, 0.88 - idx * 0.14)})`,
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d={svgPath}
              fill={metal.rimDark}
              stroke={idx === 0 ? metal.rimLight : metal.rimMain}
              strokeWidth="10"
              strokeLinejoin="round"
            />
          </svg>
        ))}
        <svg
          viewBox="0 0 256 256"
          style={{ transform: 'translateZ(0px)', backfaceVisibility: 'hidden' }}
          className="absolute inset-0 w-full h-full overflow-visible"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={svgPath} />
            </clipPath>
            <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {isLocked ? (
            <path
              d={svgPath}
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="5"
              strokeDasharray="6 4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : isWishlist ? (
            <path
              d={svgPath}
              fill="rgba(69, 176, 168, 0.22)"
              stroke="#45B0A8"
              strokeWidth="6"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
          ) : (
            <g>
              <g clipPath={`url(#${clipId})`}>
                {renderFlagFill(spec?.palette, clipId)}
                <rect x="0" y="0" width="256" height="256" fill={`url(#${sheenId})`} />
              </g>
              <path d={svgPath} fill="none" stroke={metal.rimLight} strokeWidth="6.5" strokeLinejoin="round" />
              <path d={svgPath} fill="none" stroke={metal.rimMain} strokeWidth="3" strokeLinejoin="round" />
            </g>
          )}
        </svg>

        {variant === 'detail' && (
          <div
            style={{ transform: 'translateZ(-9px) rotateY(180deg)', backfaceVisibility: 'hidden' }}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-400/50 flex flex-col items-center justify-center p-4 text-center shadow-inner"
            data-testid="emblem-backplate"
          >
            <Compass className="text-amber-400 mb-1.5 opacity-80" size={22} />
            <span className="font-mono text-xs font-bold tracking-widest text-amber-300 uppercase">
              {spec?.iso3 || spec?.iso2 || countryCode} · {discoveryCode || '#01'}
            </span>
            <span className="font-mono text-[11px] text-slate-300 mt-1">
              {spec?.continent || 'World'}
            </span>
            {firstVisitedAt && (
              <span className="font-mono text-[10px] text-slate-400 mt-1 border-t border-slate-700 pt-1">
                {String(firstVisitedAt).slice(0, 10)}
              </span>
            )}
          </div>
        )}
      </Motion.div>

      {isLocked && variant !== 'thumbnail' && (
        <div className="pointer-events-none absolute bottom-2 right-2 w-6 h-6 rounded-full bg-slate-800/90 border border-slate-600 flex items-center justify-center text-slate-400">
          <Lock size={12} />
        </div>
      )}
      {isWishlist && variant !== 'thumbnail' && (
        <div className="pointer-events-none absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#45B0A8] text-white flex items-center justify-center shadow-sm">
          <Bookmark size={12} />
        </div>
      )}
    </div>
  );
}
