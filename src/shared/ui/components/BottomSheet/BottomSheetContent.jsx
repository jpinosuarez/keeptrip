import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * BottomSheetContent
 * Scrollable content area inside the BottomSheet.
 * Applies safe-area padding and touch-friendly scroll.
 */
const BottomSheetContent = ({ children, className }) => (
  <div
    className={cn(
      "pb-[max(24px,env(safe-area-inset-bottom,0px))] overflow-y-auto overflow-touch flex-1 min-h-0 h-full",
      className
    )}
    onTouchMove={(e) => {
      // Prevent sheet drag when scrolling inside content.
      // Allow drag-to-close only when the content is at the top.
      if (e.currentTarget.scrollTop > 0) {
        e.stopPropagation();
      }
    }}
  >
    {children}
  </div>
);

export default BottomSheetContent;
