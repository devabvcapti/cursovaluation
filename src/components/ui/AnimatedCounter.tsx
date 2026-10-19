"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export interface AnimatedCounterProps {
  to: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

const DEFAULT_DURATION_MS = 1500;

/**
 * Counts up from 0 to `to` once the element scrolls into view. Visitors who
 * have asked the OS for reduced motion skip the animation entirely and see
 * the final value on first paint (Review Focus: reduced motion must show
 * final values immediately, no animation).
 */
export function AnimatedCounter({ to, suffix = "", durationMs = DEFAULT_DURATION_MS, className }: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(prefersReducedMotion ? to : 0);

  useEffect(() => {
    if (prefersReducedMotion || !isInView) {
      return;
    }

    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => {
        setValue(Math.round(latest));
      },
    });

    return () => {
      controls.stop();
    };
  }, [prefersReducedMotion, isInView, to, durationMs]);

  if (prefersReducedMotion) {
    return (
      <span data-motion="reduced" className={cn(className)}>
        {to}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} data-motion="full" className={cn(className)}>
      {value}
      {suffix}
    </span>
  );
}
