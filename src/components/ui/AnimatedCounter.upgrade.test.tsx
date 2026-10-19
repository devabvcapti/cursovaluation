import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./AnimatedCounter";

/*
 * Regression for fix round 2. The reduced-motion hook reads `true` on the
 * first render and switches to the real preference after mount. The counter
 * must never show a number that then goes backwards (final value -> 0 ->
 * count-up) while the visitor can see it.
 */
const state = vi.hoisted(() => ({
  reduced: true,
  inView: false,
  animateCalls: [] as Array<{
    from: number;
    to: number;
    onUpdate: (v: number) => void;
    stop: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => state.reduced }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useInView: () => state.inView,
    animate: (from: number, to: number, options: { onUpdate: (v: number) => void; onComplete?: () => void }) => {
      // Mirrors Framer Motion: complete() jumps to the end and fires onComplete.
      const call = { from, to, onUpdate: options.onUpdate, stop: vi.fn(), complete: vi.fn(() => options.onComplete?.()) };
      state.animateCalls.push(call);
      return { stop: call.stop, complete: call.complete };
    },
  };
});

const TO = 20;
const SUFFIX = "+";

function counterText() {
  return screen.getByTestId("counter").textContent;
}

function numberShown() {
  return Number((counterText() ?? "").replace(SUFFIX, ""));
}

function Counter() {
  return (
    <span data-testid="counter">
      <AnimatedCounter to={TO} suffix={SUFFIX} />
    </span>
  );
}

function placeCounter(top: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 40,
    left: 0,
    right: 100,
    width: 100,
    height: 40,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
}

describe("AnimatedCounter: reduced-motion hook resolving after mount", () => {
  beforeEach(() => {
    state.reduced = true;
    state.inView = false;
    state.animateCalls = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("above the fold: shows the final value throughout and never animates", () => {
    placeCounter(100); // inside the 768px jsdom viewport
    const seen: string[] = [];
    const { rerender } = render(<Counter />);
    seen.push(counterText()!);

    state.reduced = false; // hook resolves to the real preference
    rerender(<Counter />);
    seen.push(counterText()!);

    state.inView = true; // IntersectionObserver fires
    rerender(<Counter />);
    seen.push(counterText()!);

    expect(seen).toEqual(["20+", "20+", "20+"]);
    expect(state.animateCalls).toHaveLength(0);
  });

  it("below the fold: arms at 0 only while off screen, then counts up once and never goes backwards in view", () => {
    placeCounter(2000);
    const { rerender } = render(<Counter />);
    expect(counterText()).toBe("20+"); // SSR/hydration-safe starting value

    state.reduced = false;
    rerender(<Counter />);
    // Off screen (inView=false): arming at 0 here is invisible to the visitor.

    state.inView = true;
    rerender(<Counter />);
    expect(state.animateCalls).toHaveLength(1);
    expect(state.animateCalls[0]).toMatchObject({ from: 0, to: TO });

    const visibleValues: number[] = [numberShown()];
    for (const v of [3, 9, 15, 20]) {
      act(() => state.animateCalls[0].onUpdate(v));
      visibleValues.push(numberShown());
    }
    // Monotonic non-decreasing while in view: no final -> 0 drop.
    visibleValues.forEach((v, i) => {
      if (i > 0) expect(v).toBeGreaterThanOrEqual(visibleValues[i - 1]);
    });
    expect(visibleValues[0]).toBe(0);
    expect(counterText()).toBe("20+");

    // Later preference flips never restart the count-up.
    state.reduced = true;
    rerender(<Counter />);
    state.reduced = false;
    rerender(<Counter />);
    expect(state.animateCalls).toHaveLength(1);
    expect(counterText()).toBe("20+");
  });

  it("below the fold with reduced motion resolved: enters view showing the final value, no animation", () => {
    placeCounter(2000);
    const { rerender } = render(<Counter />);
    rerender(<Counter />); // hook stays true (visitor prefers reduced motion)
    state.inView = true;
    rerender(<Counter />);
    expect(counterText()).toBe("20+");
    expect(state.animateCalls).toHaveLength(0);
    expect(screen.getByText("20+")).toHaveAttribute("data-motion", "reduced");
  });

  it("switching to reduced motion mid-count stops the animation and shows the final value", () => {
    placeCounter(2000);
    const { rerender } = render(<Counter />);
    state.reduced = false;
    rerender(<Counter />);
    state.inView = true;
    rerender(<Counter />);
    act(() => state.animateCalls[0].onUpdate(7));
    expect(counterText()).toBe("7+");

    state.reduced = true;
    rerender(<Counter />);
    expect(state.animateCalls[0].complete).toHaveBeenCalled();
    expect(counterText()).toBe("20+");

    // Flipping back to full motion must not resume, restart or drop to 0.
    state.reduced = false;
    rerender(<Counter />);
    expect(counterText()).toBe("20+");
    expect(state.animateCalls).toHaveLength(1);
  });

  it("enters view while the hook still reads the SSR default (true): stays static forever", () => {
    placeCounter(2000);
    const { rerender } = render(<Counter />);
    state.inView = true; // in view before the hook resolves (rare edge case)
    rerender(<Counter />);
    state.reduced = false;
    rerender(<Counter />);
    expect(counterText()).toBe("20+");
    expect(state.animateCalls).toHaveLength(0);
  });

  it("keeps the same <span> node across the preference change (no remount)", () => {
    placeCounter(100);
    const { rerender } = render(<Counter />);
    const before = screen.getByTestId("counter").firstElementChild;
    expect(before).toHaveAttribute("data-motion", "reduced");
    state.reduced = false;
    rerender(<Counter />);
    const after = screen.getByTestId("counter").firstElementChild;
    expect(after).toBe(before);
    expect(after).toHaveAttribute("data-motion", "full");
  });
});
