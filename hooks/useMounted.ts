import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during the server render and hydration, true after. For UI that can
 * only be right on the client (next-themes' stored theme, window.location),
 * without a setState-in-effect round trip.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
