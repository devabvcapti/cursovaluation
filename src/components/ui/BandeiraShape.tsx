import { cn } from "@/lib/cn";

export type BandeiraTone = "green" | "navy";

export type BandeiraCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface BandeiraShapeProps {
  tone: BandeiraTone;
  corner: BandeiraCorner;
  className?: string;
}

const TONE_FILL: Record<BandeiraTone, string> = {
  green: "#80c842",
  navy: "#112468",
};

const CORNER_POSITION: Record<BandeiraCorner, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

// The polygon below is authored once, for the top-right corner: an acute
// tip near the top edge, widening into a full-height wedge along the
// right edge. Every other corner reuses that exact same fragment, just
// mirrored with a CSS transform — so there is only ever one shape to keep
// "always partial" true for, and it can never be recomposed into the
// complete "bandeira" diamond from the ABVCAP logo.
const CORNER_TRANSFORM: Record<BandeiraCorner, string> = {
  "top-right": "",
  "top-left": "scale-x-[-1]",
  "bottom-right": "scale-y-[-1]",
  "bottom-left": "scale-x-[-1] scale-y-[-1]",
};

/**
 * Static, cropped diagonal fragment of the ABVCAP "bandeira" graphic,
 * scaled up as a structural section divider per design spec §7. Per the
 * brand guide, the shape must never render as the complete diamond — this
 * renders only a sliver (acute angle + one straight edge), never a closed
 * polygon that reads as the whole mark.
 *
 * Purely decorative (`aria-hidden`) and static; Task 6 is responsible for
 * adding drift/parallax motion to an instance of this in the Hero.
 */
export function BandeiraShape({ tone, corner, className }: BandeiraShapeProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 240 240"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute h-48 w-48 md:h-72 md:w-72 lg:h-96 lg:w-96",
        CORNER_POSITION[corner],
        CORNER_TRANSFORM[corner],
        className,
      )}
    >
      <polygon points="240,0 240,240 70,0" fill={TONE_FILL[tone]} />
      <polygon
        points="240,22 240,240 92,22"
        fill={TONE_FILL[tone]}
        opacity="0.35"
      />
    </svg>
  );
}
