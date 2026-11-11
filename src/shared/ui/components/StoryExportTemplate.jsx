import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS } from '@shared/config';

/**
 * Hidden template for exporting as IG Story image (1080 × 1920).
 *
 * Variants:
 *  - "classic"  → Hero photo + title + dates + flags
 *  - "stats"    → Mind map with trip statistics
 *  - "stamp"    → Vintage travel stamp style
 *
 * Rendered off-screen and captured with dom-to-image-more.
 *
 * @param {{ variant: 'classic'|'stats'|'stamp', data: object }} props
 */
const STORY_W = 1080;
const STORY_H = 1920;

const base = {
  width: `${STORY_W}px`,
  height: `${STORY_H}px`,
  position: 'absolute',
  left: '-9999px',
  top: '-9999px',
  overflow: 'hidden',
  fontFamily: FONTS.heading,
};

// ── Classic Variant ──
// Uses an <img> tag instead of CSS backgroundImage so dom-to-image-more
// can negotiate CORS headers via the crossOrigin attribute.
const ClassicStory = ({ data }) => (
  <div style={{
    ...base,
    backgroundColor: COLORS.charcoalBlue,
    position: 'relative',
  }}>
    {/* Hero photo — <img> for CORS-safe canvas capture */}
    {data.foto && (
      <img
        src={data.foto}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />
    )}
    {/* Gradient overlay */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0) 100%)',
    }} />
    {/* Content */}
    <div style={{
      position: 'absolute', bottom: '120px', left: '72px', right: '72px',
      color: 'white', zIndex: 2,
    }}>
      {/* Flags */}
      {data.banderas?.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {data.banderas.slice(0, 4).map((b, i) => (
            <img key={i} src={b} alt="" style={{ width: '54px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} crossOrigin="anonymous" />
          ))}
        </div>
      )}
      <h1 style={{
        fontSize: '72px', fontWeight: '900', margin: '0 0 16px 0',
        lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        {data.titulo || 'Mi viaje'}
      </h1>
      {data.fechas && (
        <p style={{ fontSize: '32px', opacity: 0.85, margin: '0 0 40px 0', fontWeight: '600' }}>
          📅 {data.fechas}
        </p>
      )}
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
        <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '2px' }}>KEEPTRIP</span>
      </div>
    </div>
  </div>
);

// ── Stats Variant ──
const StatsStory = ({ data, t }) => (
  <div style={{
    ...base,
    background: `linear-gradient(160deg, ${COLORS.charcoalBlue} 0%, #1a365d 50%, #0f766e 100%)`,
    padding: '80px 72px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: 'white',
    boxSizing: 'border-box',
  }}>
    <p style={{ fontSize: '28px', fontWeight: '600', opacity: 0.6, margin: '0 0 12px 0', letterSpacing: '4px', textTransform: 'uppercase' }}>
      {t('template.logTitle')}
    </p>
    <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0 0 60px 0', lineHeight: 1.1 }}>
      {data.titulo || 'Destino'}
    </h1>

    {/* Stats grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
      {[
        { icon: '🌍', label: t('stats.countries'), value: data.paisesCount || '—' },
        { icon: '📍', label: t('stats.stops'), value: data.paradasCount || '—' },
        { icon: '📅', label: t('stats.days'), value: data.diasCount || '—' },
        { icon: '💰', label: t('stats.budget'), value: data.presupuesto || '—' },
      ].map((stat, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '36px 32px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: '40px' }}>{stat.icon}</span>
          <div style={{ fontSize: '48px', fontWeight: '900', marginTop: '12px' }}>{stat.value}</div>
          <div style={{ fontSize: '22px', opacity: 0.6, fontWeight: '600', marginTop: '4px' }}>{stat.label}</div>
        </div>
      ))}
    </div>

    {/* Vibes */}
    {data.vibes?.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '60px' }}>
        {data.vibes.map((v, i) => (
          <span key={i} style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: RADIUS.full,
            padding: '12px 24px',
            fontSize: '24px',
            fontWeight: '700',
          }}>{v}</span>
        ))}
      </div>
    )}

    {/* Branding */}
    <div style={{ marginTop: 'auto', opacity: 0.5, fontSize: '24px', fontWeight: '800', letterSpacing: '3px' }}>
      {t('branding')}
    </div>
  </div>
);

// ── Travel Stamp Variant ──
const StampStory = ({ data, t }) => (
  <div style={{
    ...base,
    backgroundColor: '#F4EDE4',
    // Inline SVG dot-grid pattern (~124 bytes) — replaces the 52KB external texture
    // to eliminate CORS canvas-taint risk in dom-to-image-more export.
    backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCc+PGNpcmNsZSBjeD0nMScgY3k9JzEnIHI9JzAuNicgZmlsbD0ncmdiYSgwLDAsMCwwLjA2KScvPjwvc3ZnPg==")`,
    backgroundSize: '20px',
    padding: '80px 72px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  }}>
    {/* Stamp circle */}
    <div style={{
      width: '680px', height: '680px',
      borderRadius: '50%',
      border: `8px solid ${COLORS.charcoalBlue}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      transform: 'rotate(-8deg)',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Inner ring */}
      <div style={{
        position: 'absolute', inset: '12px',
        borderRadius: '50%',
        border: `3px solid ${COLORS.charcoalBlue}`,
        opacity: 0.4,
      }} />

      {/* Content */}
      <p style={{
        fontSize: '28px', fontWeight: '800',
        letterSpacing: '8px', textTransform: 'uppercase',
        color: COLORS.charcoalBlue,
        margin: '0 0 16px 0',
        textAlign: 'center',
        opacity: 0.7,
      }}>
        {t('template.immigration')}
      </p>

      {/* Flags */}
      {data.banderas?.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {data.banderas.slice(0, 3).map((b, i) => (
            <img key={i} src={b} alt="" style={{ width: '48px', borderRadius: '4px' }} crossOrigin="anonymous" />
          ))}
        </div>
      )}

      <h1 style={{
        fontSize: '56px', fontWeight: '900',
        color: COLORS.charcoalBlue,
        textAlign: 'center',
        margin: '0 0 16px 0',
        lineHeight: 1.15,
      }}>
        {data.titulo || 'Destino'}
      </h1>

      {data.fechas && (
        <p style={{
          fontSize: '26px', fontWeight: '700',
          color: COLORS.charcoalBlue,
          margin: '0 0 8px 0',
          opacity: 0.7,
        }}>
          {data.fechas}
        </p>
      )}

      <p style={{
        fontSize: '22px', fontWeight: '800',
        letterSpacing: '6px',
        color: COLORS.atomicTangerine,
        margin: '12px 0 0 0',
      }}>
        {t('template.approved')}
      </p>
    </div>

    {/* Branding */}
    <div style={{
      marginTop: '80px',
      opacity: 0.4,
      fontSize: '26px',
      fontWeight: '800',
      color: COLORS.charcoalBlue,
      letterSpacing: '4px',
    }}>
      {t('branding')}
    </div>
  </div>
);

// ── Emblem Share Variant (FSD-safe: inline SVG from data.catalogSpec) ──
const EmblemStory = ({ data, t }) => {
  const paletteColors =
    (Array.isArray(data?.catalogSpec?.palette?.colors) && data.catalogSpec.palette.colors.length > 0
      ? data.catalogSpec.palette.colors
      : ['#FF6B35', '#FFFFFF', '#FF6B35']);
  const svgPath =
    data?.catalogSpec?.svgPath ||
    data?.svgPath ||
    'M128,32 L216,80 L216,176 L128,224 L40,176 L40,80 Z';
  const accent = data?.catalogSpec?.palette?.accent || COLORS.atomicTangerine;
  const discoveryCode = data?.discoveryCode || '#01';
  const isoLabel = data?.iso3 || data?.countryCode || '';
  const stars = Math.min(5, Math.max(0, Number(data?.stars) || 0));

  return (
    <div style={{
      ...base,
      backgroundColor: '#0F172A',
      padding: '90px 72px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'white',
      boxSizing: 'border-box',
    }}>
      {/* Brand + discovery badge */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '4px' }}>KEEPTRIP</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: '26px', fontWeight: '700', color: '#FCD34D' }}>
          {discoveryCode} · {isoLabel}
        </span>
      </div>

      {/* Emblem pedestal (inline SVG, no feature imports) */}
      <div style={{
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: '#020617',
        border: `4px solid ${accent}99`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg viewBox="0 0 256 256" width="400" height="400">
          <defs>
            <clipPath id="emblem-story-clip">
              <path d={svgPath} />
            </clipPath>
          </defs>
          <g clipPath="url(#emblem-story-clip)">
            {paletteColors.map((col, idx) => {
              const band = 256 / paletteColors.length;
              return (
                <rect key={idx} x="0" y={band * idx} width="256" height={band + 1} fill={col} />
              );
            })}
          </g>
          <path d={svgPath} fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Title + telemetry */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0 0 12px 0', lineHeight: 1.1 }}>
          {data.titulo || data.countryName || isoLabel || 'Destino'}
        </h1>
        <p style={{ fontSize: '28px', fontWeight: '700', color: '#FCD34D', margin: '0 0 20px 0' }}>
          {data.tierName || ''}{stars > 0 ? ` · ${'★'.repeat(stars)}` : ''}
        </p>
        <div style={{
          display: 'flex',
          gap: '40px',
          justifyContent: 'center',
          fontFamily: FONTS.mono,
          fontSize: '26px',
          opacity: 0.85,
        }}>
          <span>{data.visitsCount ?? 0} {t('emblemShare.visits', 'Viajes')}</span>
          <span>{data.citiesCount ?? 0} {t('emblemShare.cities', 'Ciudades')}</span>
        </div>
        <p style={{ marginTop: '24px', fontSize: '22px', opacity: 0.5, letterSpacing: '3px' }}>
          {t('branding')}
        </p>
      </div>
    </div>
  );
};

const VARIANTS = {
  classic: ClassicStory,
  stats: StatsStory,
  stamp: StampStory,
  emblem: EmblemStory,
};

const StoryExportTemplate = forwardRef(({ variant = 'classic', data = {} }, ref) => {
  const { t } = useTranslation('share');
  const Component =
    data?.templateType === 'emblem' ? EmblemStory : VARIANTS[variant] || ClassicStory;
  return (
    <div ref={ref} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
      <Component data={data} t={t} />
    </div>
  );
});

StoryExportTemplate.displayName = 'StoryExportTemplate';

export default StoryExportTemplate;
export { STORY_W, STORY_H };