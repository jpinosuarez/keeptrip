import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { BottomSheet } from '@shared/ui/components';
import LegalDocumentViewer from '@shared/ui/legal/LegalDocumentViewer';
import { cn } from '@shared/lib/utils/cn';

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
      className={cn(
        "flex items-center justify-center w-full min-h-[56px] max-w-[400px] mx-auto px-4 gap-3 bg-white rounded-full border border-[#DADCE0] shadow-sm transition-opacity font-medium text-base text-[#3C4043] tracking-[0.2px]",
        isSubmitting ? "opacity-75 cursor-progress" : "cursor-pointer"
      )}
      style={{ fontFamily: "'Roboto', sans-serif, 'Inter'" }}
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
            className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-[4px]"
          />
          <div className="fixed inset-0 z-[12001] flex items-center justify-center pointer-events-none p-4">
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto bg-surface rounded-3xl shadow-xl w-full max-w-[440px] max-h-[90dvh] flex flex-col overflow-hidden relative p-0"
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
  const linkButtonClasses = "border-none bg-transparent text-atomicTangerine cursor-pointer p-0 font-semibold underline underline-offset-2 leading-tight";

  const renderClickwrapText = () => (
    <p className="m-0 text-text-secondary font-body text-[0.85rem] leading-relaxed text-center">
      {t('legal:ui.clickwrap.prefix')}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.terms)} className={linkButtonClasses}>
        {t('legal:ui.clickwrap.termsLink')}
      </button>{' '}
      {t('legal:ui.clickwrap.and')}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.privacy)} className={linkButtonClasses}>
        {t('legal:ui.clickwrap.privacyLink')}
      </button>
      {' '}
      {t('legal:ui.clickwrap.and_two', { defaultValue: ' ' })}{' '}
      <button type="button" onClick={() => setActiveDoc(DOC_TYPES.cookies)} className={linkButtonClasses}>
        ({t('legal:ui.clickwrap.cookiesLink')})
      </button>
      {t('legal:ui.clickwrap.suffix')}
    </p>
  );

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {activeDoc ? (
          <Motion.div
            key="legal-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="flex flex-col max-h-[80dvh] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border px-6 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="flex items-center bg-transparent border-none cursor-pointer p-1 -ml-1 text-primary font-semibold text-[0.95rem]"
              >
                <ChevronLeft size={22} />
                {t('common:auth.back')}
              </button>
            </div>
            <div className="relative">
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
            className="px-6 pt-10 pb-6 flex flex-col items-center gap-10"
          >
            <div className="flex flex-col gap-4 text-center">
              <h2 className="m-0 text-text-primary font-heading text-[1.6rem] leading-tight">
                {t('common:auth.title')}
              </h2>
              <p className="m-0 text-text-tertiary font-body text-[0.95rem] leading-relaxed max-w-[320px]">
                {t('common:auth.description')}
              </p>
            </div>

            <div className="w-full flex flex-col gap-4">
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

  return (
    <>
      {/* Mobile: BottomSheet */}
      <div className="block md:hidden">
        <BottomSheet isOpen={isOpen} onClose={handleClose} ariaLabel={activeDoc ? t('legal:ui.title') : t('common:login')}>
          <AuthModalContent 
            activeDoc={activeDoc} 
            setActiveDoc={setActiveDoc} 
            isSubmitting={isSubmitting} 
            handleContinue={handleContinue} 
            t={t} 
          />
        </BottomSheet>
      </div>

      {/* Desktop: CenteredModal */}
      <div className="hidden md:block">
        <CenteredModal isOpen={isOpen} onClose={handleClose}>
          <AuthModalContent 
            activeDoc={activeDoc} 
            setActiveDoc={setActiveDoc} 
            isSubmitting={isSubmitting} 
            handleContinue={handleContinue} 
            t={t} 
          />
        </CenteredModal>
      </div>
    </>
  );
};

export default AuthModal;

