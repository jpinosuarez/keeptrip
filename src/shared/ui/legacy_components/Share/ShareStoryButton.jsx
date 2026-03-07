import React, { useCallback, useRef, useState } from 'react';
import { Share2, Download, Instagram, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StoryExportTemplate from './StoryExportTemplate';
import { captureNodeAsPng, shareImage, downloadBlob } from '@shared/lib/utils/shareUtils';
import { COLORS, SHADOWS, RADIUS, FONTS, Z_INDEX, TRANSITIONS } from '@shared/config';

const VARIANTS = [
  { id: 'classic', label: 'Clásica', icon: '📸' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'stamp', label: 'Sello', icon: '📮' },
];

/**
 * Botón + panel de compartir como IG Story.
 * Renderiza 3 variantes de StoryExportTemplate fuera de pantalla,
 * captura la elegida y usa Web Share o descarga.
 *
 * @param {{ data: object, style?: object }} props
 *   data: { titulo, fechas, foto, banderas, paisesCount, paradasCount, diasCount, presupuesto, vibes }
 */
const ShareStoryButton = ({ data, style = {} }) => {
  const [open, setOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('classic');
  const [isExporting, setIsExporting] = useState(false);
  const templateRefs = useRef({});

  const setRef = useCallback((variant) => (el) => {
    if (el) templateRefs.current[variant] = el;
  }, []);

  const handleExport = useCallback(async (mode = 'share') => {
    setIsExporting(true);
    try {
      const node = templateRefs.current[selectedVariant];
      if (!node) throw new Error('Template ref not found');

      const blob = await captureNodeAsPng(node);

      if (mode === 'download') {
        downloadBlob(blob, `keeptrip-${data.titulo?.replace(/\s+/g, '-') || 'story'}.png`);
      } else {
        await shareImage(blob, { title: data.titulo });
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedVariant, data]);

  const cycleVariant = (dir) => {
    const idx = VARIANTS.findIndex((v) => v.id === selectedVariant);
    const next = (idx + dir + VARIANTS.length) % VARIANTS.length;
    setSelectedVariant(VARIANTS[next].id);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Compartir como IG Story"
        style={{
          ...btnBase,
          ...style,
        }}
      >
        <Share2 size={16} />
      </button>

      {/* Hidden export templates */}
      {VARIANTS.map((v) => (
        <StoryExportTemplate key={v.id} ref={setRef(v.id)} variant={v.id} data={data} />
      ))}

      {/* Share panel / overlay */}
      {open && (
        <div style={overlayStyle} onClick={() => !isExporting && setOpen(false)}>
          <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button type="button" onClick={() => setOpen(false)} style={closeBtnStyle} disabled={isExporting}>
              <X size={18} />
            </button>

            <h3 style={{ fontFamily: FONTS.heading, fontWeight: '900', fontSize: '1.15rem', color: COLORS.charcoalBlue, margin: '0 0 4px 0' }}>
              Compartir viaje
            </h3>
            <p style={{ fontFamily: FONTS.body, fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0 0 20px 0' }}>
              Elegí un estilo para tu Historia
            </p>

            {/* Variant selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              <button type="button" onClick={() => cycleVariant(-1)} style={arrowBtnStyle} disabled={isExporting}>
                <ChevronLeft size={18} />
              </button>
              <div style={{
                display: 'flex', gap: '8px',
              }}>
                {VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    disabled={isExporting}
                    style={{
                      ...variantChipStyle,
                      background: selectedVariant === v.id ? COLORS.charcoalBlue : COLORS.background,
                      color: selectedVariant === v.id ? 'white' : COLORS.textSecondary,
                      border: `1.5px solid ${selectedVariant === v.id ? COLORS.charcoalBlue : COLORS.border}`,
                    }}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => cycleVariant(1)} style={arrowBtnStyle} disabled={isExporting}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleExport('share')}
                disabled={isExporting}
                style={{
                  ...actionBtnStyle,
                  background: COLORS.atomicTangerine,
                  color: 'white',
                  flex: 1,
                }}
              >
                {isExporting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <>
                    <Instagram size={16} /> Compartir
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleExport('download')}
                disabled={isExporting}
                style={{
                  ...actionBtnStyle,
                  background: COLORS.background,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Styles ──

const btnBase = {
  width: '36px',
  height: '36px',
  borderRadius: RADIUS.md,
  border: 'none',
  background: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: TRANSITIONS.fast,
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: Z_INDEX.modal + 10,
  padding: '0 0 env(safe-area-inset-bottom, 0) 0',
};

const panelStyle = {
  background: COLORS.surface,
  borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
  padding: '28px 24px 32px',
  width: '100%',
  maxWidth: '420px',
  position: 'relative',
  boxShadow: SHADOWS.float,
};

const closeBtnStyle = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'none',
  border: 'none',
  color: COLORS.textSecondary,
  cursor: 'pointer',
  padding: '4px',
};

const arrowBtnStyle = {
  background: 'none',
  border: 'none',
  color: COLORS.textSecondary,
  cursor: 'pointer',
  padding: '4px',
};

const variantChipStyle = {
  padding: '8px 14px',
  borderRadius: RADIUS.full,
  fontFamily: FONTS.heading,
  fontWeight: '700',
  fontSize: '0.82rem',
  cursor: 'pointer',
  transition: TRANSITIONS.fast,
};

const actionBtnStyle = {
  padding: '12px 20px',
  borderRadius: RADIUS.md,
  border: 'none',
  fontFamily: FONTS.heading,
  fontWeight: '800',
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: TRANSITIONS.fast,
  boxShadow: SHADOWS.sm,
};

export default ShareStoryButton;
