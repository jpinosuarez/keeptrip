import React, { useId } from 'react';
import { motion as Motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock, Bookmark, Compass } from 'lucide-react';
import { getCountryEmblemSpec } from '../../model/countryEmblemsCatalog';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { getCountryContinent } from '@shared/lib/utils/countryUtils';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

export const TIER_METAL_STYLES = {
  locked: {
    rimMain: '#334155',
    rimLight: '#475569',
    rimDark: '#1E293B',
    glow: 'rgba(51, 65, 85, 0.15)',
    pedestalRing: 'border-slate-700/80',
    gradStart: '#334155',
    gradEnd: '#1E293B',
    specular: 'rgba(255, 255, 255, 0.08)',
  },
  wishlist: {
    rimMain: '#45B0A8',
    rimLight: '#5EEAD4',
    rimDark: '#0F766E',
    glow: 'rgba(69, 176, 168, 0.35)',
    pedestalRing: 'border-[#45B0A8]/70 border-dashed',
    gradStart: 'rgba(69, 176, 168, 0.25)',
    gradEnd: 'rgba(15, 118, 110, 0.35)',
    specular: 'rgba(255, 255, 255, 0.20)',
  },
  raices_base: {
    rimMain: '#2C3E50',
    rimLight: '#64748B',
    rimDark: '#0F172A',
    glow: 'rgba(44, 62, 80, 0.3)',
    pedestalRing: 'border-[#2C3E50]/80',
    gradStart: '#334155',
    gradEnd: '#0F172A',
    specular: 'rgba(255, 255, 255, 0.25)',
  },
  explorador: {
    rimMain: '#FF6B35',
    rimLight: '#FDBA74',
    rimDark: '#9A3412',
    glow: 'rgba(255, 107, 53, 0.38)',
    pedestalRing: 'border-[#FF6B35]/80',
    gradStart: '#FF6B35',
    gradEnd: '#C2410C',
    specular: 'rgba(255, 255, 255, 0.32)',
  },
  conocedor: {
    rimMain: '#94A3B8',
    rimLight: '#F1F5F9',
    rimDark: '#475569',
    glow: 'rgba(148, 163, 184, 0.38)',
    pedestalRing: 'border-slate-300/90',
    gradStart: '#E2E8F0',
    gradEnd: '#64748B',
    specular: 'rgba(255, 255, 255, 0.45)',
  },
  experto: {
    rimMain: '#F59E0B',
    rimLight: '#FDE68A',
    rimDark: '#92400E',
    glow: 'rgba(245, 158, 11, 0.42)',
    pedestalRing: 'border-amber-400/90',
    gradStart: '#FCD34D',
    gradEnd: '#B45309',
    specular: 'rgba(255, 255, 255, 0.40)',
  },
  segundo_hogar: {
    rimMain: '#45B0A8',
    rimLight: '#99F6E4',
    rimDark: '#115E59',
    glow: 'rgba(45, 212, 191, 0.45)',
    pedestalRing: 'border-[#45B0A8]',
    gradStart: '#5EEAD4',
    gradEnd: '#0F766E',
    specular: 'rgba(255, 255, 255, 0.35)',
  },
  leyenda: {
    rimMain: '#F59E0B',
    rimLight: '#FF6B35',
    rimDark: '#78350F',
    glow: 'rgba(255, 107, 53, 0.55)',
    pedestalRing: 'border-amber-400 ring-2 ring-[#FF6B35]/40',
    gradStart: '#334155',
    gradEnd: '#090D16',
    specular: 'rgba(251, 191, 36, 0.45)',
  },
};

// Maps the classical continent code from `getCountryContinent` to the
// lowercase i18n keys used by `statsDashboard.continents.*`.
const CONTINENT_I18N_KEY = {
  EU: 'europe',
  AM: 'americas',
  AS: 'asia',
  AF: 'africa',
  OC: 'oceania',
};

const VARIANT_DIMENSIONS = {
  thumbnail: { box: 'w-12 h-12 rounded-xl', svgSize: 38, extrusionLayers: [0, -2] },
  card: { box: 'w-28 h-28 md:w-32 md:h-32 rounded-full', svgSize: 104, extrusionLayers: [0, -2, -4, -6, -8] },
  detail: { box: 'w-48 h-48 sm:w-60 sm:h-60 rounded-full', svgSize: 200, extrusionLayers: [0, -2, -4, -6, -8] },
};

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

  const { t } = useTranslation('hub');
  const isLocked = status === 'locked' || tier === 'locked';
  const isWishlist = status === 'wishlist' || tier === 'wishlist';
  const effectiveCode = countryCode || spec?.iso2 || 'XX';
  const continentCode = getCountryContinent(effectiveCode);
  const continentI18nKey = CONTINENT_I18N_KEY[continentCode];

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

  const clipId = `emblem-clip-${effectiveCode}-${uniqueId}`;
  const metalGradId = `metal-grad-${tier}-${uniqueId}`;
  const sheenId = `emblem-sheen-${uniqueId}`;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: '1000px' }}
      className={cn(
        'relative flex items-center justify-center bg-[#0F172A] border-2 shadow-inner select-none overflow-visible shrink-0',
        dims.box,
        metal.pedestalRing,
        interactive && variant !== 'thumbnail' && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      data-testid={`country-emblem-3d-${effectiveCode}`}
      data-tier={tier}
      data-variant={variant}
    >
      {/* Ambient pedestal glow */}
      <div
        aria-hidden="true"
        style={{ background: `radial-gradient(circle, ${metal.glow} 0%, transparent 72%)` }}
        className="absolute inset-1 rounded-full pointer-events-none"
      />

      {/* Microstate cartographic loupe reticle */}
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

      {/* 3D extruded stage */}
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
        {/* Floating drop shadow */}
        {variant !== 'thumbnail' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 256 256"
            style={{ transform: 'translateZ(-16px) translateY(8px)' }}
            className={cn(
              'absolute inset-0 w-full h-full pointer-events-none opacity-65 blur-[3px] transition-opacity duration-200',
              isFlipped && 'opacity-0',
            )}
          >
            <path d={svgPath} fillRule="evenodd" fill="#020617" stroke="#020617" strokeWidth="10" strokeLinejoin="round" />
          </svg>
        )}

        {/* Back extrusion layers */}
        {dims.extrusionLayers.slice(1).map((zOffset, idx) => (
          <svg
            key={zOffset}
            aria-hidden="true"
            viewBox="0 0 256 256"
            style={{
              transform: `translateZ(${zOffset}px)`,
              filter: `brightness(${Math.max(0.45, 0.88 - idx * 0.14)})`,
            }}
            className={cn(
              'absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200',
              isFlipped && 'opacity-0',
            )}
          >
            <path
              d={svgPath}
              fillRule="evenodd"
              fill={metal.rimDark}
              stroke={idx === 0 ? metal.rimLight : metal.rimMain}
              strokeWidth="9"
              strokeLinejoin="round"
            />
          </svg>
        ))}

        {/* Front sculpted metallic layer */}
        <svg
          viewBox="0 0 256 256"
          style={{ transform: 'translateZ(0px)', backfaceVisibility: 'hidden' }}
          className={cn(
            'absolute inset-0 w-full h-full overflow-visible transition-opacity duration-200',
            isFlipped && 'opacity-0 pointer-events-none',
          )}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={svgPath} fillRule="evenodd" />
            </clipPath>
            <linearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={metal.gradStart} />
              <stop offset="100%" stopColor={metal.gradEnd} />
            </linearGradient>
            <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {isLocked ? (
            <path
              d={svgPath}
              fillRule="evenodd"
              fill="#334155"
              stroke="#475569"
              strokeWidth="5"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
          ) : isWishlist ? (
            <path
              d={svgPath}
              fillRule="evenodd"
              fill="rgba(69, 176, 168, 0.22)"
              stroke="#45B0A8"
              strokeWidth="6"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
          ) : (
            <g>
              {/* Sculpted metallic infill with specular highlight */}
              <g clipPath={`url(#${clipId})`}>
                <rect x="0" y="0" width="256" height="256" fill={`url(#${metalGradId})`} />
                <rect x="0" y="0" width="256" height="256" fill={`url(#${sheenId})`} />
                <ellipse cx="110" cy="80" rx="70" ry="32" fill={metal.specular} transform="rotate(-15 110 80)" />
                {tier === 'leyenda' && (
                  <path d={svgPath} fillRule="evenodd" fill="none" stroke="#F59E0B" strokeWidth="2.5" opacity="0.65" />
                )}
              </g>
              <path d={svgPath} fillRule="evenodd" fill="none" stroke={metal.rimLight} strokeWidth="6.5" strokeLinejoin="round" />
              <path d={svgPath} fillRule="evenodd" fill="none" stroke={metal.rimMain} strokeWidth="3" strokeLinejoin="round" />
            </g>
          )}
        </svg>

        {/* Engraved metallic backplate (detail variant, flips 180°) */}
        {variant === 'detail' && (
          <div
            style={{ transform: 'translateZ(-9px) rotateY(180deg)', backfaceVisibility: 'hidden' }}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-400/50 flex flex-col items-center justify-center p-4 text-center shadow-inner"
            data-testid="emblem-backplate"
          >
            <Compass className="text-amber-400 mb-1.5 opacity-80" size={22} />
            <span className="font-mono text-xs font-bold tracking-widest text-amber-300 uppercase">
              {spec?.iso3 || spec?.iso2 || effectiveCode} · {discoveryCode || '#01'}
            </span>
            <span className="font-mono text-[11px] text-slate-300 mt-1">
              {continentI18nKey
                ? t(`statsDashboard.continents.${continentI18nKey}`, spec?.continent || 'World')
                : spec?.continent || 'World'}
            </span>
            {firstVisitedAt && (
              <span className="font-mono text-[10px] text-slate-400 mt-1 border-t border-slate-700 pt-1">
                {String(firstVisitedAt).slice(0, 10)}
              </span>
            )}
          </div>
        )}
      </Motion.div>
      {/* Official national flag circular medallion (bottom-right) */}
      {!isLocked && variant !== 'thumbnail' && (
        <div
          data-testid="emblem-flag-medallion"
          className={cn(
            'absolute -bottom-1 -right-1 w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-900 p-0.5 border-2 border-slate-700 shadow-md flex items-center justify-center overflow-hidden z-20 shrink-0 transition-opacity duration-200',
            isFlipped && 'opacity-0 pointer-events-none',
          )}
        >
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <CountryFlag code={effectiveCode} size="md" className="w-full h-full object-cover scale-125" />
          </div>
        </div>
      )}

      {/* Status overlays (bottom-left, avoids the flag medallion) */}
      {isLocked && variant !== 'thumbnail' && (
        <div className="pointer-events-none absolute bottom-2 left-2 w-7 h-7 rounded-full bg-slate-800/90 border border-slate-600 flex items-center justify-center text-slate-400 z-20">
          <Lock size={13} />
        </div>
      )}
      {isWishlist && variant !== 'thumbnail' && (
        <div className="pointer-events-none absolute bottom-2 left-2 w-7 h-7 rounded-full bg-[#45B0A8] text-white flex items-center justify-center shadow-sm z-20">
          <Bookmark size={13} />
        </div>
      )}
    </div>
  );
}
