import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@shared/ui/components/BottomSheet';
import { cn } from '@shared/lib/utils/cn';

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
    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="flex flex-col">
      <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger shrink-0" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 id="confirm-modal-title" className="m-0 text-xl font-bold text-charcoalBlue leading-tight font-heading">
            {title || t('confirm.defaultTitle')}
          </h3>
          <p className="m-0 text-[0.95rem] leading-relaxed text-text-secondary font-medium font-body max-w-[280px]">
            {message || t('confirm.defaultMessage')}
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row-reverse gap-3 p-6 pt-2">
        <button
          type="button"
          onClick={() => onConfirm?.()}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[0.95rem] font-bold cursor-pointer transition-all duration-200 shadow-md min-h-[48px] w-full md:w-auto md:flex-1",
            "bg-danger text-white border-none hover:bg-red-600 active:scale-95 shadow-danger/25",
            isLoading && "opacity-60 cursor-not-allowed pointer-events-none"
          )}
        >
          {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
          {isLoading ? t('confirm.deleting') : confirmText || t('confirm.delete')}
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          disabled={isLoading}
          autoFocus={true}
          className={cn(
            "inline-flex items-center justify-center px-6 py-3 rounded-full text-[0.95rem] font-bold cursor-pointer transition-all duration-200 border border-slate-200 bg-white text-charcoalBlue min-h-[48px] w-full md:w-auto md:flex-1 hover:bg-slate-50 active:scale-95",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {cancelText || t('cancel')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: BottomSheet */}
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={() => !isLoading && onClose?.()} disableClose={isLoading}>
          {content}
        </BottomSheet>
      </div>

      {/* Desktop: Centered Modal */}
      <div className="hidden md:block">
        {createPortal(
          <AnimatePresence>
            {isOpen && (
              <Motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-charcoalBlue/40 backdrop-blur-sm p-4"
                onClick={() => !isLoading && onClose?.()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Motion.div
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden"
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
          </AnimatePresence>,
          document.body
        )}
      </div>
    </>
  );
};

export default ConfirmModal;

