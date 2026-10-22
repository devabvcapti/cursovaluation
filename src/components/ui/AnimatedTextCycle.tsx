"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export interface AnimatedTextCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

const VARIANTS: Variants = {
  hidden: { y: -20, opacity: 0, filter: "blur(8px)" },
  visible: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" } },
  exit: { y: 20, opacity: 0, filter: "blur(8px)", transition: { duration: 0.3, ease: "easeIn" } },
};

/**
 * Cycles through `words` one at a time with a blur/slide crossfade,
 * measuring each word's natural width so the surrounding line never
 * reflows. The same tree always renders (word swapping never unmounts
 * it — see Hero/AnimatedCounter for why that matters); when
 * `prefers-reduced-motion: reduce` is set, the interval never starts and
 * the first word's entrance plays with zero duration, so reduced-motion
 * visitors only ever see a single static word.
 */
export function AnimatedTextCycle({ words, interval = 3000, className }: AnimatedTextCycleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = measureRef.current?.children;
    const target = elements?.[currentIndex];
    if (target) {
      setWidth(`${target.getBoundingClientRect().width}px`);
    }
  }, [currentIndex]);

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
    <>
      {/* Hidden measurement copy — every word rendered once, off-screen. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0"
        style={{ visibility: "hidden" }}
      >
        {words.map((word, i) => (
          <span key={i} className={className}>
            {word}
          </span>
        ))}
      </div>

      <motion.span
        className="relative inline-block"
        animate={{ width }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 15, mass: 1.2 }}
      >
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
      </motion.span>
    </>
  );
}
