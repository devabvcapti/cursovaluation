"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BandeiraShape } from "@/components/ui/BandeiraShape";
import { Button } from "@/components/ui/Button";
import { LeadCaptureForm } from "@/components/ui/LeadCaptureForm";
import { Section } from "@/components/ui/Section";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { courseContent } from "@/content/curso";
import { cn } from "@/lib/cn";

/*
 * Motion tokens for the Hero — the one deliberately "bold but institutional"
 * motion moment on the page (design spec §8). Restraint is the brief:
 *
 * - Ease: cubic-bezier(0.22, 1, 0.36, 1), a long-tail ease-out (close to
 *   easeOutQuint). Lines arrive quickly and then settle slowly, which reads
 *   as confident/editorial rather than bouncy. No springs/overshoot on
 *   purpose: overshoot reads as playful, wrong for a capital-markets
 *   institution.
 * - Headline lines rise out of a clip mask (not a fade-from-nowhere), like
 *   type being set. 0.9s per line is above the 300ms micro-interaction band
 *   because this is a one-time page-load sequence, not UI feedback; the 0.12s
 *   stagger is wider than the ~40ms list-item norm because there are only
 *   three very large lines and each needs to register as its own "layer".
 * - Drift: ~22s loop, ≤16px travel and ≤1.2° rotation. Slow enough that it
 *   is perceived as the background "breathing", never as something moving
 *   that demands attention while reading.
 * - Parallax: the bandeira travels further than the type over the hero's
 *   scroll range (≈140px vs ≈48px), so the depth split is perceptible but
 *   the page never "floats" — content still scrolls essentially 1:1.
 *
 * The entrance durations/easing live in globals.css (`.hero-enter-*`); only
 * the per-element delays are set here, via the `--hero-enter-delay` custom
 * property.
 */
const LINE_STAGGER_S = 0.12;
const LINE_DURATION_S = 0.9;
const SEQUENCE_DELAY_S = 0.15;
// Supporting copy and CTAs land as the last headline line is settling.
const SUPPORT_DELAY_S = SEQUENCE_DELAY_S + LINE_STAGGER_S * 2 + LINE_DURATION_S * 0.6;

const DRIFT_DURATION_S = 22;
const BANDEIRA_PARALLAX_PX = 140;
const CONTENT_PARALLAX_PX = 48;

const DRIFT_KEYFRAMES = { x: [0, -16, 0], y: [0, -10, 0], rotate: [0, -1.2, 0] };
const DRIFT_TRANSITION = { duration: DRIFT_DURATION_S, ease: "easeInOut", repeat: Infinity } as const;
// The rest pose equals the drift's first/last keyframe, so starting or
// stopping the drift never jumps.
const DRIFT_REST = { x: 0, y: 0, rotate: 0 };
const DRIFT_STOP_TRANSITION = { duration: 0 } as const;

function enterDelay(seconds: number): CSSProperties {
  return { "--hero-enter-delay": `${seconds}s` } as CSSProperties;
}

// Applied to the navy `Section`, which already owns bg/text color,
// `relative overflow-hidden` and vertical padding.
// Below `lg` the extra bottom padding reserves a band for the bandeira so
// the green wedge never sits behind the copy or the green CTA.
const SECTION_CLASSES = cn(
  "isolate flex min-h-[calc(100svh-4rem)] items-center",
  "pb-48 sm:pb-56 md:pb-64 lg:py-20 xl:py-24",
);

// Wrapper that anchors the bandeira to the bottom-right edge. It overhangs
// the section on the right and bottom so that neither the drift nor the
// downward parallax ever pulls the shape's edges inward and exposes a gap —
// the fragment always reads as cut off by the frame (always partial, §7).
const BANDEIRA_FRAME_CLASSES = cn(
  "pointer-events-none absolute -right-10 -bottom-16 -z-10",
  "h-64 w-[90%] sm:h-72 sm:w-[70%] md:h-80 md:w-[55%] lg:h-[88%] lg:w-[52%]",
);

// BandeiraShape ships its own fixed size per breakpoint; stretch it to fill
// the frame instead (tailwind-merge resolves the per-breakpoint conflicts).
const BANDEIRA_FILL_CLASSES = "h-full w-full md:h-full md:w-full lg:h-full lg:w-full";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-7xl px-6 lg:px-10";

const EYEBROW_CLASSES = cn(
  "mb-8 inline-flex items-center gap-3",
  "font-body text-xs font-bold uppercase tracking-[0.18em] text-white/70",
);

const H1_CLASSES = cn(
  "max-w-[15ch] font-heading font-light",
  "text-[2.375rem] leading-[1.04] tracking-[-0.02em]",
  "sm:text-6xl md:text-7xl lg:text-[88px] lg:leading-[0.98] xl:text-[96px]",
);

// The opening line ("Valuation:") is the course's name — the one accent.
function lineColorClass(index: number) {
  return index === 0 ? "text-brand-green" : "text-white";
}

const SUBHEADLINE_CLASSES = "max-w-xl font-body text-base leading-relaxed text-white/80 md:text-lg";

const CTA_ROW_CLASSES = "mt-8 flex flex-col gap-4 md:mt-10 sm:flex-row sm:items-center";

// LeadCaptureForm's labels/inputs are styled for a light section; wrap it in
// its own light card here since it's revealed on top of the navy hero.
const LEAD_FORM_WRAPPER_CLASSES = "mt-6 max-w-md rounded-sm bg-white p-6 md:p-8";

const SECONDARY_CTA_CLASSES = cn(
  "inline-flex min-h-11 items-center justify-center px-8 py-3.5",
  "border-2 border-white/40 bg-transparent text-white",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-colors duration-200 ease-out hover:border-white hover:bg-white/10",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

function EyebrowContent() {
  return (
    <>
      <span aria-hidden="true" className="h-px w-10 bg-brand-green" />
      {courseContent.hero.eyebrow}
    </>
  );
}

interface CtasProps {
  onSecondaryClick: () => void;
}

function Ctas({ onSecondaryClick }: CtasProps) {
  return (
    <>
      <Button href={courseContent.hero.checkoutUrl} variant="primary">
        Quero me matricular
      </Button>
      <button
        type="button"
        data-testid="hero-secondary-cta"
        onClick={onSecondaryClick}
        className={SECONDARY_CTA_CLASSES}
      >
        {courseContent.hero.syllabusCtaLabel}
      </button>
    </>
  );
}

/**
 * Above-the-fold hero (design spec §8): navy field, oversized light
 * headline entering line by line, a cropped green "bandeira" that drifts
 * slowly and parallaxes on scroll, and the primary checkout CTA (its hover
 * scale + glow lives in Button's `primary` variant).
 *
 * ONE persistent tree, never swapped by motion preference.
 * `useReducedMotion()` reads `true` during SSR and hydration and switches to
 * the real preference (usually `false`) a tick after mount. Swapping
 * component types on that value would remount the hero and replay its
 * entrance for most visitors. So the preference only changes props on
 * elements that never unmount:
 * - Drift: `animate` is the rest pose (reduced) or the drift loop (full).
 *   The rest pose equals the loop's first keyframe, so the upgrade starts
 *   seamlessly. `initial={false}` means there is no "enter" state.
 * - Parallax: the `y` style is 0 (reduced) or the scroll-linked value (full).
 *   At page top the scroll value is 0 anyway, so the upgrade is invisible.
 * - Entrance: CSS keyframes (`.hero-enter-*` in globals.css), gated by
 *   `@media (prefers-reduced-motion: no-preference)`. They play once from the
 *   first paint of the server HTML and do not depend on the JS hook, so the
 *   hook resolving can never hide content or restart them.
 *
 * The root always carries `data-testid="hero-root"` and
 * `data-motion="reduced" | "full"`, matching AnimatedCounter's convention.
 * The attribute changes in place. It does not remount anything.
 */
export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const { headlineLines, subheadline } = courseContent.hero;
  const sectionRef = useRef<HTMLDivElement>(null);
  // Secondary CTA ("Baixar ementa completa") reveals `LeadCaptureForm`
  // inline, right below the CTA row, instead of a modal — the hero's
  // existing entrance/drift/parallax tree never changes shape, so this
  // toggle only ever adds/removes a sibling block after it.
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  // 0 when the hero's top meets the viewport top, 1 when its bottom does —
  // i.e. the parallax only runs while the hero is scrolling out of view.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bandeiraY = useTransform(scrollYProgress, [0, 1], [0, BANDEIRA_PARALLAX_PX]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, CONTENT_PARALLAX_PX]);

  return (
    <div ref={sectionRef} data-testid="hero-root" data-motion={prefersReducedMotion ? "reduced" : "full"}>
      <Section tone="navy" id="top" className={SECTION_CLASSES}>
        {/* Outer layer: scroll parallax. Inner layer: continuous drift. Kept
            separate so the two transforms compose instead of fighting. */}
        <motion.div
          data-testid="hero-bandeira-parallax"
          style={{ y: prefersReducedMotion ? 0 : bandeiraY }}
          className={BANDEIRA_FRAME_CLASSES}
        >
          <motion.div
            data-testid="hero-bandeira-drift"
            className="h-full w-full will-change-transform"
            style={{ transformOrigin: "100% 100%" }}
            initial={false}
            animate={prefersReducedMotion ? DRIFT_REST : DRIFT_KEYFRAMES}
            transition={prefersReducedMotion ? DRIFT_STOP_TRANSITION : DRIFT_TRANSITION}
          >
            <BandeiraShape tone="green" corner="bottom-right" className={BANDEIRA_FILL_CLASSES} />
          </motion.div>
        </motion.div>

        <motion.div style={{ y: prefersReducedMotion ? 0 : contentY }} className={CONTENT_CLASSES}>
          <p className={cn(EYEBROW_CLASSES, "hero-enter-eyebrow")}>
            <EyebrowContent />
          </p>
          <h1 className={H1_CLASSES}>
            {headlineLines.map((line, index) => (
              // Clip mask: each line rises from just below its own baseline.
              // Small vertical padding keeps descenders from being clipped.
              <span key={line} className="-my-[0.08em] block overflow-hidden py-[0.08em]">
                <span
                  data-testid="hero-headline-line"
                  className={cn("hero-enter-line block", lineColorClass(index))}
                  style={enterDelay(SEQUENCE_DELAY_S + LINE_STAGGER_S * index)}
                >
                  {line}{" "}
                </span>
              </span>
            ))}
          </h1>
          <div className="hero-enter-support mt-8 md:mt-10" style={enterDelay(SUPPORT_DELAY_S)}>
            <p className={SUBHEADLINE_CLASSES}>{subheadline}</p>
            <div className={CTA_ROW_CLASSES}>
              <Ctas onSecondaryClick={() => setIsLeadFormOpen(true)} />
            </div>
            {isLeadFormOpen ? (
              <div className={LEAD_FORM_WRAPPER_CLASSES}>
                <LeadCaptureForm
                  className="max-w-full"
                  onSuccess={() => setIsLeadFormOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </motion.div>
      </Section>
    </div>
  );
}
