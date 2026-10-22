"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export interface AnimatedTextCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

const VARIANTS: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { y: 20, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

/**
 * Cycles through `words` one at a time with a fade/slide crossfade. Only
 * one motion element is ever active (no nested width-animated wrapper —
 * that combination rendered as hollow/outline-only text when nested inside
 * Hero's clip-mask + transform entrance wrapper, a compositing bug, not a
 * CSS mistake: computed styles were all correct). The word's natural width
 * is used directly, so the line may reflow slightly between words; each
 * headline line is its own row, so this never shifts anything else.
 *
 * The same tree always renders (word swapping never unmounts it — see
 * Hero/AnimatedCounter for why that matters); when
 * `prefers-reduced-motion: reduce` is set, the interval never starts and
 * the first word's entrance plays with zero duration, so reduced-motion
 * visitors only ever see a single static word.
 */
export function AnimatedTextCycle({ words, interval = 3000, className }: AnimatedTextCycleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, words.length, prefersReducedMotion]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={currentIndex}
        className={cn("inline-block", className)}
        variants={VARIANTS}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        exit="exit"
        style={{ whiteSpace: "nowrap" }}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
}
