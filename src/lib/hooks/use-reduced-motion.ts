import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function hasMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function subscribe(onStoreChange: () => void): () => void {
  if (!hasMatchMedia()) {
    return () => {};
  }
  const mediaQueryList = window.matchMedia(QUERY);
  mediaQueryList.addEventListener("change", onStoreChange);
  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): boolean {
  // Without matchMedia we cannot know the preference: fall back to the safe
  // (reduced-motion) default, matching the server snapshot.
  if (!hasMatchMedia()) {
    return true;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * Server (and hydration) snapshot. Always `true` — assume reduced motion is
 * preferred. This is safe in both directions:
 * - It matches what the server rendered, so hydration never mismatches.
 * - A reduced-motion visitor's first client render also reads `true`, so they
 *   never see a flash of motion. Full-motion visitors are upgraded to `false`
 *   immediately after hydration (one-tick progressive enhancement).
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Tracks the user's OS-level `prefers-reduced-motion` preference, including
 * live changes made while the page is open (e.g. toggling the setting in
 * System Preferences without reloading).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
