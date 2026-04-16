import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { BottomSheet } from '@shared/ui/components';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '@shared/config';
import LegalDocumentViewer from '@shared/ui/legal/LegalDocumentViewer';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

const DOC_TYPES = {
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookies',
};

// --- Google Official Button UI ---
const GoogleSignInButton = ({ onClick, disabled, isSubmitting, t }) => {
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || isSubmitting}
      whileHover={{ scale: (disabled || isSubmitting) ? 1 : 1.015, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: (disabled || isSubmitting) ? 1 : 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '56px',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '0 16px',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS.full,
        border: '1px solid #DADCE0',
        boxShadow: SHADOWS.sm,
        opacity: isSubmitting ? 0.75 : 1,
        cursor: isSubmitting ? 'progress' : 'pointer',
        fontFamily: "'Roboto', sans-serif, 'Inter'",
        fontWeight: 500,
        fontSize: '1rem',
        color: '#3C4043',
        letterSpacing: '0.2px',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {isSubmitting ? t('common:loading') : t('common:auth.continueWithGoogle')}
    </Motion.button>
  );
};

// --- Centered Modal for Desktop ---
const CenteredModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment key="centered-modal-frag">
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 12000,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 12001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              padding: SPACING.md,
            }}
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                pointerEvents: 'auto',
                backgroundColor: COLORS.surface,
                borderRadius: RADIUS['2xl'] || '24px',
                boxShadow: SHADOWS.xl,
                width: '100%',
                maxWidth: '440px',
                maxHeight: '90dvh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                padding: '0', 
              }}
            >
              {children}
            </Motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

// --- Modal Content (Switches between Login and Legal View) ---
const AuthModalContent = ({ activeDoc, setActiveDoc, isSubmitting, handleContinue, t }) => {
  const renderClickwrapText = () => (
    <p
      style={{
        margin: 0,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        fontSize: '0.85rem',
        lineHeight: 1.6,
        textAlign: 'center',
      }}
    >
      {t('legal:ui.clickwrap.prefix')}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.terms)} style={linkButtonStyle}>
        {t('legal:ui.clickwrap.termsLink')}
      </button>{' '}
      {t('legal:ui.clickwrap.and')}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.privacy)} style={linkButtonStyle}>
        {t('legal:ui.clickwrap.privacyLink')}
      </button>
      {' '}
      {t('legal:ui.clickwrap.and_two', { defaultValue: ' ' })}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.cookies)} style={linkButtonStyle}>
        ({t('legal:ui.clickwrap.cookiesLink')})
      </button>
      {t('legal:ui.clickwrap.suffix')}
    </p>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <AnimatePresence mode="wait">
        {activeDoc ? (
          <Motion.div
            key="legal-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: '80dvh', 
              overflowY: 'auto' 
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${COLORS.border}`,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm
            }}>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: SPACING.xs,
                  margin: `0 -${SPACING.xs}`,
                  color: COLORS.primary,
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                <ChevronLeft size={22} />
                {t('common:auth.back')}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <LegalDocumentViewer docType={activeDoc} />
            </div>
          </Motion.div>
        ) : (
          <Motion.div
            key="auth-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              padding: `${SPACING.xl} ${SPACING.lg} ${SPACING.lg}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: SPACING.xl,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md, textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: COLORS.textPrimary, fontFamily: FONTS.heading, fontSize: '1.6rem', lineHeight: 1.25 }}>
                {t('common:auth.title')}
              </h2>
              <p style={{ margin: 0, color: COLORS.textTertiary, fontFamily: FONTS.body, fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '320px' }}>
                {t('common:auth.description')}
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              <GoogleSignInButton onClick={handleContinue} isSubmitting={isSubmitting} t={t} />
              {renderClickwrapText()}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main AuthModal Wrapper ---
const AuthModal = ({ isOpen, onClose, onContinue }) => {
  const { t } = useTranslation(['common', 'legal']);
  const [activeDoc, setActiveDoc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { width } = useWindowSize();
  const isMobileLayout = width < 768;

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

  const ModalShell = isMobileLayout ? BottomSheet : CenteredModal;

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} ariaLabel={activeDoc ? t('legal:ui.title') : t('common:login')}>
      <AuthModalContent 
        activeDoc={activeDoc} 
        setActiveDoc={setActiveDoc} 
        isSubmitting={isSubmitting} 
        handleContinue={handleContinue} 
        t={t} 
      />
    </ModalShell>
  );
};

const linkButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: COLORS.atomicTangerine,
  cursor: 'pointer',
  padding: 0,
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  lineHeight: 1.2,
};

export default AuthModal;
