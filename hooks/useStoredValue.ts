import { useCallback, useSyncExternalStore } from "react";

// A string in localStorage as React state. Reads go through
// useSyncExternalStore, so the server render and hydration see `fallback` and
// the client switches to the stored value without a setState-in-effect pass.
// Writes notify this tab only: a panel opened in one tab shouldn't open in all.

const EVENT = "lockin:stored-value";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private mode, blocked storage
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useStoredValue(key: string, fallback: string | null = null): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key) ?? fallback,
    () => fallback,
  );
  const set = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}
