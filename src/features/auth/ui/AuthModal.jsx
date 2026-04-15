import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@shared/ui/components';
import { COLORS, RADIUS, SPACING, FONTS, BUTTONS } from '@shared/config';
import LegalDocumentViewer from '@shared/ui/legal/LegalDocumentViewer';
import legalES from '../../../i18n/locales/es/legal.json';

const DOC_TYPES = {
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookies',
};

const AuthModal = ({ isOpen, onClose, onContinue }) => {
  const { t } = useTranslation('common');
  const [activeDoc, setActiveDoc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onContinue?.();
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveDoc(null);
    onClose?.();
  };

  const renderClickwrapText = () => (
    <p
      style={{
        margin: 0,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        fontSize: '0.95rem',
        lineHeight: 1.6,
      }}
    >
      {legalES.ui.clickwrap.prefix}{' '}
      <button
        type="button"
        onClick={() => setActiveDoc(DOC_TYPES.terms)}
        style={linkButtonStyle}
      >
        {legalES.ui.clickwrap.termsLink}
      </button>{' '}
      {legalES.ui.clickwrap.and}{' '}
      <button
        type="button"
        onClick={() => setActiveDoc(DOC_TYPES.privacy)}
        style={linkButtonStyle}
      >
        {legalES.ui.clickwrap.privacyLink}
      </button>
      {' '}
      <button
        type="button"
        onClick={() => setActiveDoc(DOC_TYPES.cookies)}
        style={linkButtonStyle}
      >
        ({legalES.ui.clickwrap.cookiesLink})
      </button>
      {legalES.ui.clickwrap.suffix}
    </p>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={activeDoc ? legalES.ui.title : 'Inicio de sesion'}
    >
      {activeDoc ? (
        <div>
          <div style={{ padding: `0 ${SPACING.lg} ${SPACING.md}` }}>
            <button
              type="button"
              onClick={() => setActiveDoc(null)}
              style={{
                ...BUTTONS.secondary,
                minHeight: '44px',
                padding: `0 ${SPACING.md}`,
                color: COLORS.textPrimary,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
              }}
            >
              {legalES.ui.actions.back}
            </button>
          </div>
          <LegalDocumentViewer docType={activeDoc} />
        </div>
      ) : (
        <div
          style={{
            padding: `0 ${SPACING.lg} max(${SPACING.xl}, env(safe-area-inset-bottom, 0px))`,
            display: 'grid',
            gap: SPACING.lg,
          }}
        >
          <div style={{ display: 'grid', gap: SPACING.sm }}>
            <h2
              style={{
                margin: 0,
                color: COLORS.textPrimary,
                fontFamily: FONTS.heading,
                fontSize: '1.5rem',
                lineHeight: 1.25,
              }}
            >
              Continúa tu ruta
            </h2>
            <p
              style={{
                margin: 0,
                color: COLORS.textTertiary,
                fontFamily: FONTS.body,
                fontSize: '1rem',
                lineHeight: 1.65,
              }}
            >
              Accede con Google para guardar tu bitácora y sincronizar tus viajes en todos tus dispositivos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            style={{
              ...BUTTONS.primary,
              width: '100%',
              minHeight: '56px',
              opacity: isSubmitting ? 0.75 : 1,
              cursor: isSubmitting ? 'progress' : 'pointer',
              borderRadius: RADIUS.lg,
            }}
          >
            {isSubmitting ? t('common:loading') : 'Continuar con Google'}
          </button>

          {renderClickwrapText()}
        </div>
      )}
    </BottomSheet>
  );
};

const linkButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: COLORS.atomicTangerine,
  cursor: 'pointer',
  padding: 0,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  minHeight: '44px',
  lineHeight: 1.2,
};

export default AuthModal;
