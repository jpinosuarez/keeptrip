import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for debounced auto-save to Firebase.
 * Manages save state, error handling, and debounce timing.
 * 
 * Status: 'unsaved' | 'saving' | 'saved' | 'error'
 */
export function useAutoSaveEditor(formData, viajeId, onSave, debounceMs = 1500) {
  const [saveStatus, setStatus] = useState('unsaved'); // unsaved | saving | saved | error
  const debounceTimer = useRef(null);
  const lastSavedData = useRef(null);

  // Trigger auto-save with debounce
  const triggerAutoSave = useCallback(async () => {
    // Check if data actually changed
    if (JSON.stringify(lastSavedData.current) === JSON.stringify(formData)) {
      return;
    }

    setStatus('saving');

    try {
      const result = await onSave(viajeId, formData);
      
      if (result === true || (typeof result === 'object' && result?.success)) {
        lastSavedData.current = { ...formData };
        setStatus('saved');
        
        // Auto-clear "saved" badge after 2s
        setTimeout(() => {
          setStatus('unsaved');
        }, 2000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
      
      // Retry on error after 1s
      setTimeout(() => {
        triggerAutoSave();
      }, 1000);
    }
  }, [formData, viajeId, onSave]);

  // Debounced save trigger
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    setStatus('unsaved');
    debounceTimer.current = setTimeout(() => {
      triggerAutoSave();
    }, debounceMs);

    // Cleanup on unmount
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
