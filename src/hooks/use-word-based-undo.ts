import { useState, useEffect, useCallback, useRef } from "react";
import useUndo from "use-undo";

interface UseWordBasedUndoOptions {
  debounceMs?: number;
  initialValue: string;
}

// Helper function to count words
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

export function useWordBasedUndo({
  debounceMs = 1000,
  initialValue,
}: UseWordBasedUndoOptions) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(initialValue);

  // Undo/redo state for history management
  const [undoState, { set: setUndoValue, undo, redo, canUndo, canRedo }] =
    useUndo(initialValue);

  // Refs to track word boundaries and debouncing
  const lastWordCount = useRef(countWords(initialValue));
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const isUndoRedoAction = useRef(false);

  // Helper function to check if we should save to history
  const shouldSaveToHistory = useCallback(
    (newValue: string, oldValue: string) => {
      const newWordCount = countWords(newValue);
      const oldWordCount = countWords(oldValue);

      // Save if word count changed (word added/removed)
      if (newWordCount !== oldWordCount) {
        return true;
      }

      // Save if we go from/to empty state
      if (
        (oldValue.trim() === "" && newValue.trim() !== "") ||
        (oldValue.trim() !== "" && newValue.trim() === "")
      ) {
        return true;
      }

      // Save if we add/remove significant punctuation or line breaks
      const significantChars = /[.!?;:\n]/;
      const oldHasSignificant = significantChars.test(oldValue);
      const newHasSignificant = significantChars.test(newValue);
      if (oldHasSignificant !== newHasSignificant) {
        return true;
      }

      return false;
    },
    []
  );

  // Update local value and potentially save to history
  const updateValue = useCallback(
    (newValue: string) => {
      if (isUndoRedoAction.current) {
        // If this is from undo/redo, just update local value
        setLocalValue(newValue);
        isUndoRedoAction.current = false;
        return;
      }

      const oldValue = localValue;
      setLocalValue(newValue);

      // Clear existing debounce timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Check if we should save immediately (word boundary)
      if (shouldSaveToHistory(newValue, oldValue)) {
        setUndoValue(newValue);
        lastWordCount.current = countWords(newValue);
      } else {
        // Set debounced save for continuous typing
        debounceTimeout.current = setTimeout(() => {
          if (newValue !== undoState.present) {
            setUndoValue(newValue);
            lastWordCount.current = countWords(newValue);
          }
        }, debounceMs);
      }
    },
    [
      localValue,
      shouldSaveToHistory,
      setUndoValue,
      undoState.present,
      debounceMs,
    ]
  );

  // Wrap undo to update local value
  const handleUndo = useCallback(() => {
    if (canUndo) {
      isUndoRedoAction.current = true;
      undo();
      // The local value will be updated in the effect below
    }
  }, [canUndo, undo]);

  // Wrap redo to update local value
  const handleRedo = useCallback(() => {
    if (canRedo) {
      isUndoRedoAction.current = true;
      redo();
      // The local value will be updated in the effect below
    }
  }, [canRedo, redo]);

  // Sync local value when undo state changes (from undo/redo actions)
  useEffect(() => {
    if (isUndoRedoAction.current) {
      setLocalValue(undoState.present);
      lastWordCount.current = countWords(undoState.present);
    }
  }, [undoState.present]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return {
    value: localValue,
    updateValue,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  };
}
