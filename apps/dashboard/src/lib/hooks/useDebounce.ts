import { useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useState<ReturnType<typeof setTimeout> | null>(null);

  if (value !== debouncedValue) {
    if (timeoutRef[0]) clearTimeout(timeoutRef[0]);
    timeoutRef[1](setTimeout(() => setDebouncedValue(value), delay));
  }

  return debouncedValue;
}
