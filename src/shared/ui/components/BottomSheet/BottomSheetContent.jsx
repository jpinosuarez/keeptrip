import React from 'react';

/**
 * BottomSheetContent
 * Scrollable content area inside the BottomSheet.
 * Applies safe-area padding and touch-friendly scroll.
 */
const BottomSheetContent = ({ children, style }) => (
  <div
    style={{
      padding: '0 0 max(24px, env(safe-area-inset-bottom, 0px))',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      flex: 1,
      minHeight: 0,
      height: '100%',
      ...style,
    }}
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
