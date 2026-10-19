"use client";

import { useEffect, useState } from "react";

/**
 * Renders the current year for the footer's copyright line.
 *
 * Extracted into its own client component because `new Date()` is a
 * non-deterministic value: Next.js's `cacheComponents` prerendering
 * (next.config.ts) rejects it if read directly during a Server
 * Component's render (error: "Next.js encountered the unstable value
 * `new Date()` while prerendering" — found during Task 15's production
 * build check of `Footer`, which previously called `new Date().getFullYear()`
 * inline). Reading it inside `useEffect` instead means it's never touched
 * during server rendering/prerendering, only after mount on the client,
 * so the static shell for `Footer` can still be prerendered.
 *
 * Starts blank (`null`) until mount to avoid a hydration mismatch between
 * server- and client-rendered output.
 */
export function CopyrightYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // Reading the current date is an external, time-dependent value (not
    // derived from props/state), so there's no render-time alternative to
    // this one-time, post-mount read — the usual "don't setState in an
    // effect" guidance doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);

  return <>{year}</>;
}
