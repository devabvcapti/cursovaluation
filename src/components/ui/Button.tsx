import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps {
  href: string;
  variant: ButtonVariant;
  children: ReactNode;
  className?: string;
}

/**
 * Used whenever `href` is missing or blank (e.g. a placeholder that was
 * emptied out), so the rendered link is never left with an empty `href`.
 */
const FALLBACK_HREF = "#";

const BASE_STYLES = cn(
  "inline-flex items-center justify-center min-h-11",
  "px-8 py-3.5",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  // Solid brand-green CTA. The hover scale + glow is the one deliberate
  // microinteraction on the page (design spec §8) — reserved for this
  // variant so it stays a single, legible signature instead of scattering
  // motion across every button.
  primary: cn(
    "bg-brand-green text-brand-navy border-2 border-brand-green",
    "motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-[0_0_28px_rgba(128,200,66,0.55)]",
    "motion-safe:active:scale-[0.98]",
  ),
  // Outlined. Colors are tuned for use on a white/light background by
  // default; a caller placing it on a navy section overrides the border/
  // text colors via `className` (tailwind-merge resolves the conflict).
  secondary: cn(
    "bg-transparent text-brand-navy border-2 border-brand-navy",
    "hover:bg-brand-navy hover:text-white",
    "motion-safe:active:scale-[0.98]",
  ),
};

/**
 * Brand CTA link. Always renders an `<a>` — there is no in-app checkout, so
 * every button on this page points either to the external sales platform
 * or to another external resource, and always opens safely in a new tab.
 */
export function Button({ href, variant, children, className }: ButtonProps) {
  const safeHref = href && href.trim() !== "" ? href : FALLBACK_HREF;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)}
    >
      {children}
    </a>
  );
}
