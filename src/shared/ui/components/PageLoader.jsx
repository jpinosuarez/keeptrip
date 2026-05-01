import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * PageLoader — Minimal in-app navigation loader.
 *
 * 2026 UX Practice: No full-screen dark overlays for secondary route loads.
 * A small centered spinner on a transparent background keeps the user
 * contextually aware they're inside the app — not facing a crash or block.
 */
export default function PageLoader() {
  return (
    <div
      aria-label="Cargando..."
      role="status"
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-transparent z-dropdown"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full border-2 border-border border-t-atomicTangerine animate-spin shrink-0"
      )} />
    </div>
  );
}
