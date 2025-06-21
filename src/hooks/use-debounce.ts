import { useState, useEffect, useRef } from "react";

// Deep comparison function for objects and arrays
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a !== null &&
    b !== null
  ) {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (
        !keysB.includes(key) ||
        !deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }

    return true;
  }

  return false;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Only set timeout if value actually changed (deep comparison for objects)
    const hasChanged =
      typeof value === "object"
        ? !deepEqual(previousValueRef.current, value)
        : previousValueRef.current !== value;

    if (!hasChanged) {
      return;
    }

    previousValueRef.current = value;

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Enhanced debounce hook with immediate first call and leading edge support
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { trailing: true }
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTimeRef = useRef<number>(0);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  const debouncedCallback = useRef((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    const executeCallback = () => {
      lastCallTimeRef.current = now;
      (callbackRef.current as (...args: unknown[]) => unknown)(...args);
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Leading edge execution
    if (options.leading && timeSinceLastCall >= delay) {
      executeCallback();
      return;
    }

    // Trailing edge execution
    if (options.trailing) {
      timeoutRef.current = setTimeout(executeCallback, delay);
    }
  }).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}
