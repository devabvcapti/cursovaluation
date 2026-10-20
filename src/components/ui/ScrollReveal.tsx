"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

const REVEAL_DISTANCE_PX = 24;
const REVEAL_DURATION_S = 0.6;

const VISIBLE = { opacity: 1, y: 0 };
const HIDDEN = { opacity: 0, y: REVEAL_DISTANCE_PX };

type Decision = "undecided" | "reveal" | "static";

/**
 * Fades a section's content up into place the first time it scrolls into
 * view.
 *
 * Invariant: the visitor never sees a flash of hidden content. The server
 * and first client render always show the final (visible) state — same
 * invariant as `AnimatedCounter`, for the same reason: `useReducedMotion()`
 * reads `true` until one tick after mount, and anything already on screen
 * at mount must never animate in.
 *
 * - The hidden starting state is only ever applied once the element is
 *   confirmed below the fold at mount (nobody can see it yet) *and*
 *   confirmed full-motion.
 * - The reveal/skip decision is made once, the first time the element is
 *   in view, and never re-decided — a later preference change cannot
 *   retrigger it.
 * - One `motion.div` throughout (never swapped for a plain `div`), driven
 *   entirely through the reactive `animate` prop, never through `initial`
 *   (which is captured once at mount, before this decision exists, and
 *   would otherwise freeze on the server's reduced-motion default — see
 *   Hero's fix-round history for the class of bug that produces).
 */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  // null until measured after mount (server render / hydration).
  const [belowFoldAtMount, setBelowFoldAtMount] = useState<boolean | null>(null);
  const [decision, setDecision] = useState<Decision>("undecided");

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    setBelowFoldAtMount(element.getBoundingClientRect().top >= window.innerHeight);
  }, []);

  // Decide exactly once, the first time the element is in view. This
  // adjusts state during render (no effect), so the decision and the
  // frame that shows it commit together.
  if (decision === "undecided" && isInView && belowFoldAtMount !== null) {
    setDecision(belowFoldAtMount && !prefersReducedMotion ? "reveal" : "static");
  }

  let animate: typeof VISIBLE;
  if (prefersReducedMotion || decision === "static") {
    animate = VISIBLE;
  } else if (decision === "reveal") {
    animate = isInView ? VISIBLE : HIDDEN;
  } else {
    // Undecided. Hide only once confirmed below the fold — nobody can see
    // it yet. Otherwise show the final state (matches the server render).
    animate = belowFoldAtMount ? HIDDEN : VISIBLE;
  }

  return (
    <motion.div
      ref={ref}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      className={cn(className)}
      initial={false}
      animate={animate}
      transition={decision === "reveal" ? { duration: REVEAL_DURATION_S, ease: "easeOut" } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}
