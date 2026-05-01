import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * BottomSheetHeader
 * Renders the drag handle bar at the top of the sheet.
 * Touch target row is >=44px for ergonomic drag interaction.
 */
const BottomSheetHeader = ({ isDragging = false }) => (
  <div
    aria-hidden="true"
    className={cn(
      "flex justify-center items-center min-h-[44px] pt-4 pb-2 select-none touch-none",
      isDragging ? "cursor-grabbing" : "cursor-grab"
    )}
  >
    <div
      className={cn(
        "w-10 h-1.25 rounded-full transition-colors duration-200",
        isDragging ? "bg-atomicTangerine" : "bg-border"
      )}
    />
  </div>
);

export default BottomSheetHeader;
