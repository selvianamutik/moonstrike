"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of no changes. Useful for search inputs to avoid firing on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
