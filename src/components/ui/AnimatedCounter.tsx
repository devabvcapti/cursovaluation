"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, type AnimationPlaybackControls } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export interface AnimatedCounterProps {
  to: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

const DEFAULT_DURATION_MS = 1500;

type Decision = "undecided" | "count-up" | "static";

/**
 * Counts up from 0 to `to` the first time the element scrolls into view.
 *
 * Invariant: the visitor never sees the number go backwards. `to` is the
 * starting display (server render, hydration, reduced motion, no JS). The
 * component only shows 0 while the number is out of view, right before a
 * count-up the visitor is about to watch.
 *
 * Why it is built this way:
 * - `useReducedMotion()` reads `true` during SSR and hydration and only
 *   switches to the real preference (usually `false`) one tick after mount.
 *   That switch is NOT what starts the animation. Entering the viewport is.
 *   By the time a below-the-fold stat scrolls in, the real preference is
 *   already known.
 * - A counter that is already on screen when it mounts was seen showing its
 *   final value (in the server HTML), so it never animates. It stays static.
 * - The count-up is decided once, the first time the counter is in view, and
 *   never re-decided. Later preference changes cannot restart it. Switching
 *   to reduced motion mid-count completes it at once.
 * - It renders one `<span>` whatever the preference, so it is never
 *   remounted and the in-view observer stays attached.
 */
export function AnimatedCounter({ to, suffix = "", durationMs = DEFAULT_DURATION_MS, className }: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  // null until measured after mount (server render / hydration).
  const [belowFoldAtMount, setBelowFoldAtMount] = useState<boolean | null>(null);
  const [decision, setDecision] = useState<Decision>("undecided");
  // Latest count-up frame. null until the count-up emits its first frame.
  const [count, setCount] = useState<number | null>(null);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    setBelowFoldAtMount(element.getBoundingClientRect().top >= window.innerHeight);
  }, []);

  // Decide exactly once, the first time the counter is in view. This adjusts
  // state during render (no effect), so the decision and the frame that
  // shows it commit together.
  if (decision === "undecided" && isInView && belowFoldAtMount !== null) {
    setDecision(belowFoldAtMount && !prefersReducedMotion ? "count-up" : "static");
  }

  useEffect(() => {
    if (decision !== "count-up" || controlsRef.current) {
      return;
    }
    controlsRef.current = animate(0, to, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setCount(Math.round(latest)),
      onComplete: () => setCount(to),
    });
  }, [decision, to, durationMs]);

  // Switching to reduced motion mid-count: jump to the end.
  useEffect(() => {
    if (prefersReducedMotion) {
      controlsRef.current?.complete();
    }
  }, [prefersReducedMotion]);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    },
    [],
  );

  let shown: number;
  if (prefersReducedMotion || decision === "static") {
    shown = to;
  } else if (decision === "count-up") {
    shown = count ?? 0;
  } else {
    // Undecided. Show 0 only if it was below the fold at mount and is still
    // off screen (otherwise the decision would already be made). Nobody can
    // see it.
    shown = belowFoldAtMount ? 0 : to;
  }

  return (
    <span ref={ref} data-motion={prefersReducedMotion ? "reduced" : "full"} className={cn(className)}>
      {shown.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}
