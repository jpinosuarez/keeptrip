import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';
import BottomSheet from '@shared/ui/components/BottomSheet';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm action',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  isLoading = false
}) => {
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
      <div className={cn("p-6 flex flex-col gap-3.5")}>
        <div className={cn("w-11 h-11 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0")}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-modal-title" className={cn("m-0 text-charcoalBlue text-lg font-bold leading-tight")}>
          {title}
        </h2>
        <p className={cn("m-0 text-text-secondary leading-relaxed")}>
          {message}
        </p>
      </div>

      <div className={cn(
        "p-4 px-6 flex flex-col md:flex-row md:justify-end gap-2.5",
        "pb-[max(16px,env(safe-area-inset-bottom,0px))] md:border-t md:border-border"
      )}>
        <button
          type="button"
          onClick={() => onConfirm?.()}
          disabled={isLoading}
          className={cn(
            "order-1 md:order-2",
            "w-full md:w-auto h-11 px-5 rounded-full font-bold",
            "flex items-center justify-center gap-2 transition-all duration-150 shadow-sm",
            "bg-danger text-white",
            isLoading ? "opacity-80 cursor-not-allowed" : "hover:opacity-90 active:scale-95"
          )}
        >
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
          {isLoading ? 'Deleting...' : confirmText}
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          disabled={isLoading}
          className={cn(
            "order-2 md:order-1",
            "w-full md:w-auto h-11 px-5 rounded-full font-bold",
            "flex items-center justify-center transition-all duration-150 border border-border bg-surface text-text-secondary",
            isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-background active:scale-95"
          )}
        >
          {cancelText}
        </button>
      </div>
    </>
  );

  return createPortal(
    <>
      {/* Mobile view: BottomSheet (CSS-only toggle) */}
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={() => !isLoading && onClose?.()} disableClose={isLoading}>
          {content}
        </BottomSheet>
      </div>

      {/* Desktop view: Classic Centered Modal */}
      <div className="hidden md:block">
        <AnimatePresence>
          {isOpen && (
            <Motion.div
              className={cn(
                "fixed inset-0 bg-overlay backdrop-blur-sm z-modal flex items-center justify-center p-5"
              )}
              onClick={() => !isLoading && onClose?.()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Motion.div
                className={cn(
                  "w-full max-w-[520px] bg-surface rounded-xl shadow-md border border-border overflow-hidden"
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
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
      </div>
    </>,
    document.body
  );
};

export default ConfirmModal;
