import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";
import { courseContent } from "@/content/curso";

/*
 * Regression for fix round 2. `useReducedMotion()` returns `true` (SSR-safe
 * default) on the first render and switches to the real preference,
 * usually `false`, right after mount. The hero must not remount or hide
 * already-visible content when that happens, so the entrance can never replay.
 */
const motionPref = vi.hoisted(() => ({ reduced: true }));
vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => motionPref.reduced }));

// Inline styles that would mean "content hidden / about to enter".
const HIDDEN_STYLE_PATTERNS = [/opacity:\s*0(?![.\d])/, /translateY\(105%\)/, /translateY\(12px\)/];

function hiddenStyledElements(root: HTMLElement) {
  return [root, ...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
    const style = el.getAttribute("style") ?? "";
    return HIDDEN_STYLE_PATTERNS.some((pattern) => pattern.test(style));
  });
}

function snapshotNodes() {
  return {
    root: screen.getByTestId("hero-root"),
    heading: screen.getByRole("heading", { level: 1 }),
    lines: screen.getAllByTestId("hero-headline-line"),
    drift: screen.getByTestId("hero-bandeira-drift"),
    parallax: screen.getByTestId("hero-bandeira-parallax"),
    secondaryCta: screen.getByTestId("hero-secondary-cta"),
  };
}

describe("Hero: reduced-motion hook resolving after mount", () => {
  beforeEach(() => {
    motionPref.reduced = true;
  });

  it("keeps the same DOM nodes (no remount) when the hook upgrades true -> false", () => {
    const { rerender } = render(<Hero />);
    const before = snapshotNodes();
    expect(before.root).toHaveAttribute("data-motion", "reduced");

    motionPref.reduced = false;
    rerender(<Hero />);
    const after = snapshotNodes();

    expect(after.root).toHaveAttribute("data-motion", "full");
    expect(after.root).toBe(before.root);
    expect(after.heading).toBe(before.heading);
    expect(after.drift).toBe(before.drift);
    expect(after.parallax).toBe(before.parallax);
    expect(after.secondaryCta).toBe(before.secondaryCta);
    after.lines.forEach((line, index) => expect(line).toBe(before.lines[index]));
  });

  it("never puts any element into a hidden / pre-entrance inline style at any step", () => {
    const { rerender } = render(<Hero />);
    const root = screen.getByTestId("hero-root");
    expect(hiddenStyledElements(root)).toEqual([]);

    // true -> false (normal visitor), then a live OS toggle back and forth.
    for (const reduced of [false, true, false]) {
      motionPref.reduced = reduced;
      rerender(<Hero />);
      expect(hiddenStyledElements(screen.getByTestId("hero-root"))).toEqual([]);
      const heading = screen.getByRole("heading", { level: 1 });
      for (const line of courseContent.hero.headlineLines) {
        expect(heading).toHaveTextContent(line);
      }
    }
  });

  it("drives the entrance with CSS classes the JS hook never touches", () => {
    const { rerender } = render(<Hero />);
    const classesBefore = screen.getAllByTestId("hero-headline-line").map((el) => el.className);
    classesBefore.forEach((cls) => expect(cls).toContain("hero-enter-line"));

    motionPref.reduced = false;
    rerender(<Hero />);
    const classesAfter = screen.getAllByTestId("hero-headline-line").map((el) => el.className);
    // Same class string, so the browser does not restart a CSS animation.
    expect(classesAfter).toEqual(classesBefore);
  });

  it("gates every hero entrance animation behind prefers-reduced-motion: no-preference", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    const gateStart = css.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(gateStart).toBeGreaterThan(-1);
    const gated = css.slice(gateStart);
    const ungated = css.slice(0, gateStart);
    for (const cls of [".hero-enter-line", ".hero-enter-support", ".hero-enter-eyebrow"]) {
      expect(gated).toContain(cls);
      expect(ungated).not.toContain(cls);
    }
    expect(ungated).not.toMatch(/animation\s*:/);
  });
});
