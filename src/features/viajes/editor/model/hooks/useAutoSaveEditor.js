import { useState, useCallback, useRef, useEffect } from 'react';

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i += 1) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i += 1) {
      const key = keysA[i];
      if (key !== keysB[i]) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

function isDraftEmpty(data) {
  if (!data) return true;
  const title = String(data.titulo || '').trim();
  const hasTitle = title.length > 0;
  const hasLocation = Array.isArray(data.coordenadas) && data.coordenadas.some(Boolean);
  const hasLatLng = Array.isArray(data.latlng) && data.latlng.some(Boolean);
  const hasText = String(data.texto || '').trim().length > 0;
  const hasVibe = Array.isArray(data.vibe) && data.vibe.length > 0;
  const hasHighlights = data.highlights && Object.values(data.highlights || {}).some(Boolean);
  const hasParadas = Array.isArray(data.paradas || data.paradasNuevas) && (data.paradas || data.paradasNuevas).length > 0;

  return !hasTitle && !hasLocation && !hasLatLng && !hasText && !hasVibe && !hasHighlights && !hasParadas;
}

/**
 * Hook for debounced auto-save to Firebase.
 * Manages save state, error handling, and debounce timing.
 *
 * Supports draft promotion: when a new draft (id='new') is saved and receives
 * a real ID from the server, the onDraftPromoted callback is called so the editor
 * can update its local reference, ensuring the next auto-save triggers an updateDoc
 * instead of creating a duplicate document.
 *
 * @param {object} formData - Current form data
 * @param {string} viajeId - Trip ID ('new' for drafts, real ID for existing trips)
 * @param {function} onSave - Callback to persist data; should return: string (new ID), true (update success), or null/falsy (skip)
 * @param {number} debounceMs - Debounce delay in milliseconds (default 1500)
 * @param {function} onDraftPromoted - Callback invoked when new draft is saved and gets real ID; signature: (newId) => void
 *
 * Status: 'unsaved' | 'saving' | 'saved' | 'error'
 */
export function useAutoSaveEditor(formData, viajeId, onSave, debounceMs = 1500, onDraftPromoted = null) {
  const [saveStatus, setStatus] = useState('unsaved'); // unsaved | saving | saved | error
  const debounceTimer = useRef(null);
  const isMountedRef = useRef(true);
  const lastSavedData = useRef(null);
  const retryCount = useRef(0);

  const safeSetStatus = useCallback((status) => {
    if (isMountedRef.current) setStatus(status);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Reset auto-save state when editing a different trip
    lastSavedData.current = null;
    retryCount.current = 0;
    safeSetStatus('unsaved');
  }, [viajeId, safeSetStatus]);

  const performAutoSave = useCallback(async () => {
    // Skip saves when the draft is basically empty (no user intent yet)
    if (isDraftEmpty(formData)) {
      lastSavedData.current = structuredClone(formData);
      retryCount.current = 0;
      safeSetStatus('unsaved');
      return;
    }

    // Avoid redundant saves based on deep equality (prevents infinite loops)
    if (deepEqual(lastSavedData.current, formData)) {
      return;
    }

    safeSetStatus('saving');

    try {
      const result = await onSave(viajeId, formData);

      // PHASE 2: Recognize string returns (new trip IDs) as success
      if (result === true || (typeof result === 'object' && result?.success) || (typeof result === 'string' && result)) {
        lastSavedData.current = structuredClone(formData);
        safeSetStatus('saved');
        retryCount.current = 0;

        // PHASE 3: Draft promotion callback
        // When a new draft (id='new') is saved and gets a real ID back,
        // notify the parent EditorFocusPanel so it can update formData.id.
        // This ensures the next auto-save triggers an updateDoc, not a createDoc.
        if (viajeId === 'new' && typeof result === 'string' && result && onDraftPromoted) {
          onDraftPromoted(result);
        }

        // Auto-clear "saved" badge after 2s
        setTimeout(() => {
          safeSetStatus('unsaved');
        }, 2000);
      } else {
        // Save was intentionally skipped / not valid (e.g., draft not ready)
        // Treat it as a stable state to prevent repeated auto-save attempts.
        lastSavedData.current = structuredClone(formData);
        retryCount.current = 0;
        safeSetStatus('unsaved');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      safeSetStatus('error');

      // Retry on error after 1s (backoff, maximum 3 retries)
      retryCount.current += 1;
      if (retryCount.current <= 3) {
        setTimeout(() => {
          performAutoSaveRef.current?.();
        }, 1000 * retryCount.current);
      } else {
        console.warn('Auto-save retry limit reached');
      }
    }
  }, [formData, viajeId, onSave, onDraftPromoted, safeSetStatus]);

  const performAutoSaveRef = useRef(null);

  useEffect(() => {
    // Keep a ref to the latest save function so retries can call it without
    // creating a new callback in the timeout handler.
    // eslint-disable-next-line react-hooks/immutability
    performAutoSaveRef.current = performAutoSave;
  }, [performAutoSave]);

  const triggerAutoSave = useCallback(async () => {
    await performAutoSave();
  }, [performAutoSave]);

  // Debounced save trigger
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      triggerAutoSave();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData, triggerAutoSave, debounceMs]);

  // Force save immediately
  const forceSave = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    await triggerAutoSave();
  }, [triggerAutoSave]);

  return {
    saveStatus,
    forceSave,
  };
}
