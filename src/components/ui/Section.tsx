import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionTone = "navy" | "white";

export interface SectionProps {
  tone: SectionTone;
  children: ReactNode;
  className?: string;
  id?: string;
}

const TONE_STYLES: Record<SectionTone, string> = {
  navy: "bg-brand-navy text-white",
  white: "bg-white text-brand-navy",
};

/**
 * Full-bleed section band. Alternating `navy`/`white` tones between
 * sections is the page's main rhythm device (design spec §7 — "sala de
 * reuniões / data room"), so this intentionally owns only the background
 * color, default text color and vertical rhythm.
 *
 * It deliberately does NOT wrap `children` in its own max-width container:
 * a section composing this often also places an absolutely-positioned
 * `BandeiraShape` at a corner, which needs to reach the section's true
 * edge rather than being boxed in by a content-width wrapper. Callers add
 * their own `mx-auto max-w-* px-*` wrapper around their text/content
 * children as needed.
 */
export function Section({ tone, children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full overflow-hidden",
        "py-20 md:py-28 lg:py-32",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}
