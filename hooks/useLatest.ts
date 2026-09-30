import { useLayoutEffect, useRef } from "react";

/**
 * A ref that always holds the latest value, for callbacks created once (a
 * CodeMirror keymap, a memoised handler) that must still see current props.
 * Updated in a layout effect rather than during render, so rendering stays pure.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
