import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { styles } from './ConfirmModal.styles';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import BottomSheet from '@shared/ui/components/BottomSheet';

const ConfirmModal = ({
  isOpen,
  title = 'Confirmar accion',
  message = 'Esta accion no se puede deshacer.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  isLoading = false
}) => {
  const { isMobile } = useWindowSize(768);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isLoading, onClose]);

  const content = (
    <>
      <div style={styles.body}>
        <div style={styles.iconWrap}>
          <AlertTriangle size={22} />
        </div>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
      </div>

      <div style={isMobile ? styles.footerMobile : styles.footer}>
        <button type="button" onClick={() => onConfirm?.()} style={styles.confirmBtn(isLoading)} disabled={isLoading}>
          {isLoading ? <LoaderCircle size={16} className="spin" /> : <AlertTriangle size={16} />}
          {isLoading ? 'Eliminando...' : confirmText}
        </button>
        <button type="button" onClick={() => onClose?.()} style={styles.cancelBtn(isLoading)} disabled={isLoading}>
          {cancelText}
        </button>
      </div>
    </>
  );

  // Mobile: BottomSheet deslizable
  if (isMobile) {
    return createPortal(
      <BottomSheet isOpen={isOpen} onClose={() => !isLoading && onClose?.()} disableClose={isLoading}>
        {content}
      </BottomSheet>,
      document.body
    );
  }

  // Desktop: modal centrado clásico
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
