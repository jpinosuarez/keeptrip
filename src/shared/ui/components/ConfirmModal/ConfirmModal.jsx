import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './ConfirmModal.styles.js';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import BottomSheet from '@shared/ui/components/BottomSheet';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const { t } = useTranslation('common');
  const { isMobile } = useWindowSize(768);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const node = modalRef.current;
    const focusable = node.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const content = (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div style={styles.body}>
        <div style={styles.iconWrap}>
          <AlertTriangle size={22} />
        </div>
        <h3 id="confirm-modal-title" style={styles.title}>{title || t('confirm.defaultTitle')}</h3>
        <p style={styles.message}>{message || t('confirm.defaultMessage')}</p>
      </div>
      <div style={isMobile ? styles.footerMobile : styles.footer}>
        <button
          type="button"
          onClick={() => onConfirm?.()}
          style={styles.confirmBtn(isLoading)}
          disabled={isLoading}
          autoFocus={false}
        >
          {isLoading ? <LoaderCircle size={16} className="spin" /> : <AlertTriangle size={16} />}
          {isLoading ? t('confirm.deleting') : confirmText || t('confirm.delete')}
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          style={styles.cancelBtn(isLoading)}
          disabled={isLoading}
          autoFocus={true}
        >
          {cancelText || t('cancel')}
        </button>
      </div>
    </div>
  );

  // Mobile: BottomSheet
  if (isMobile) {
    return createPortal(
      <BottomSheet isOpen={isOpen} onClose={() => !isLoading && onClose?.()} disableClose={isLoading}>
        {content}
      </BottomSheet>,
      document.body
    );
  }

  // Desktop: modal centrado
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          style={styles.overlay}
          onClick={() => !isLoading && onClose?.()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {content}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;
