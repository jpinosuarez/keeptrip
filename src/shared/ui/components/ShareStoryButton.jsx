import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Share2, Download, Instagram, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@app/providers/ToastContext';
import StoryExportTemplate from './StoryExportTemplate';
import { captureNodeAsPng, shareImage, downloadBlob } from '@shared/lib/utils/shareUtils';
import { COLORS, SHADOWS, RADIUS, FONTS, Z_INDEX, TRANSITIONS } from '@shared/config';

const VARIANTS = [
  { id: 'classic', labelKey: 'share.variant.classic', icon: '📸' },
  { id: 'stats', labelKey: 'share.variant.stats', icon: '📊' },
  { id: 'stamp', labelKey: 'share.variant.stamp', icon: '📮' },
];

/**
 * Button + panel to share as IG Story.
 * Renders 3 variants of StoryExportTemplate off-screen,
 * captures the selected one and uses Web Share or downloads.
 *
 * @param {{ data: object, style?: object }} props
 *   data: { titulo, fechas, foto, banderas, paisesCount, paradasCount, diasCount, presupuesto, vibes }
 */
const ShareStoryButton = ({ data, style = {} }) => {
  const { t } = useTranslation('share');
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('classic');
  const [isExporting, setIsExporting] = useState(false);
  const templateRefs = useRef({});

  const showEmblemVariant = Boolean(
    data?.templateType === 'emblem' || data?.countryCode || data?.catalogSpec,
  );
  const variants = useMemo(
    () =>
      showEmblemVariant
        ? [...VARIANTS, { id: 'emblem', labelKey: 'emblemShare.variant', defaultLabel: 'Emblema', icon: '🛡️' }]
        : VARIANTS,
    [showEmblemVariant],
  );

  const setRef = useCallback((variant) => (el) => {
    if (el) templateRefs.current[variant] = el;
  }, []);

  const handleExport = useCallback(async (mode = 'share') => {
    setIsExporting(true);
    try {
      const node = templateRefs.current[selectedVariant];
      if (!node) throw new Error('Template ref not found');

      const fallbackMessage = t('fallbackMessage');
      const blob = await captureNodeAsPng(node, { fallbackMessage });
      const normalizedTitle = data.titulo || t('defaultTitle');
      const filename = `keeptrip-${normalizedTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      const shareText = t('shareText', { title: normalizedTitle });
      const shareUrl = data?.id ? `${window.location.origin}/trips/${data.id}` : '';

      if (mode === 'download') {
        downloadBlob(blob, filename);
        pushToast(t('shareDownloaded'), 'success');
        setOpen(false);
      } else {
        const result = await shareImage(blob, {
          title: normalizedTitle,
          text: shareText,
          url: shareUrl,
          filename,
          clipboardText: t('clipboardFallbackText', { title: normalizedTitle, url: shareUrl })
        });

        if (result.status === 'shared') {
          pushToast(t('shareSuccess'), 'success');
          setOpen(false);
        } else if (result.status === 'clipboard') {
          pushToast(t('clipboardCopied'), 'info');
          setOpen(false);
        } else if (result.status === 'downloaded') {
          pushToast(t('shareDownloaded'), 'info');
          setOpen(false);
        } else if (result.status === 'dismissed') {
          pushToast(t('shareDismissed'), 'info');
        }
      }
    } catch {
      pushToast(t('shareError'), 'error');
    } finally {
      setIsExporting(false);
    }
  }, [selectedVariant, data, pushToast, t]);

  const cycleVariant = (dir) => {
    const idx = variants.findIndex((v) => v.id === selectedVariant);
    const next = (idx + dir + variants.length) % variants.length;
    setSelectedVariant(variants[next].id);
  };

  return (
    <>
      {/* Trigger button */}
      <Motion.button
        type="button"
        onClick={() => setOpen(true)}
        title={t('shareTrip')}
        whileTap={{ scale: 0.98 }}
        style={{
          ...btnBase,
          ...style,
        }}
      >
        <Share2 size={16} />
      </Motion.button>

      {/* Hidden export templates */}
      {variants.map((v) => (
        <StoryExportTemplate key={v.id} ref={setRef(v.id)} variant={v.id} data={data} />
      ))}

      {/* Share panel / overlay */}
      {open && (
        <div style={overlayStyle} onClick={() => !isExporting && setOpen(false)}>
          <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <Motion.button type="button" onClick={() => setOpen(false)} style={closeBtnStyle} disabled={isExporting} whileTap={{ scale: 0.98 }}>
              <X size={18} />
            </Motion.button>

            <h3 style={{ fontFamily: FONTS.heading, fontWeight: '900', fontSize: '1.15rem', color: COLORS.charcoalBlue, margin: '0 0 4px 0' }}>
              {t('shareTrip')}
            </h3>
            <p style={{ fontFamily: FONTS.body, fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0 0 20px 0' }}>
              {t('chooseStyle')}
            </p>

            {/* Variant selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              <Motion.button type="button" onClick={() => cycleVariant(-1)} style={arrowBtnStyle} disabled={isExporting} whileTap={{ scale: 0.98 }}>
                <ChevronLeft size={18} />
              </Motion.button>
              <div style={{
                display: 'flex', gap: '8px',
              }}>
                {variants.map((v) => (
                  <Motion.button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    disabled={isExporting}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      ...variantChipStyle,
                      background: selectedVariant === v.id ? COLORS.charcoalBlue : COLORS.background,
                      color: selectedVariant === v.id ? 'white' : COLORS.textSecondary,
                      border: `1.5px solid ${selectedVariant === v.id ? COLORS.charcoalBlue : COLORS.border}`,
                    }}
                  >
                    {v.icon} {t(v.labelKey, v.defaultLabel)}
                  </Motion.button>
                ))}
              </div>
              <Motion.button type="button" onClick={() => cycleVariant(1)} style={arrowBtnStyle} disabled={isExporting} whileTap={{ scale: 0.98 }}>
                <ChevronRight size={18} />
              </Motion.button>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Motion.button
                type="button"
                onClick={() => handleExport('share')}
                disabled={isExporting}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...actionBtnStyle,
                  background: COLORS.atomicTangerine,
                  color: 'white',
                  flex: 1,
                }}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Instagram size={16} /> {t('button')}
                  </>
                )}
              </Motion.button>
              <Motion.button
                type="button"
                onClick={() => handleExport('download')}
                disabled={isExporting}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...actionBtnStyle,
                  background: COLORS.background,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Download size={16} />
              </Motion.button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Styles ──

const btnBase = {
  minWidth: '44px',
  minHeight: '44px',
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
  minWidth: '44px',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const arrowBtnStyle = {
  background: 'none',
  border: 'none',
  color: COLORS.textSecondary,
  cursor: 'pointer',
  minWidth: '44px',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const variantChipStyle = {
  minHeight: '44px',
  padding: '10px 14px',
  borderRadius: RADIUS.full,
  fontFamily: FONTS.heading,
  fontWeight: '700',
  fontSize: '0.82rem',
  cursor: 'pointer',
  transition: TRANSITIONS.fast,
};

const actionBtnStyle = {
  minHeight: '44px',
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