import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// vitest.config.ts sets `globals: false`, so React Testing Library's
// automatic afterEach cleanup (which relies on a global `afterEach`) never
// registers. Without this, each `render()` call leaves its DOM tree
// mounted, and later tests in the same file fail with "found multiple
// elements" once more than one test renders the same component.
afterEach(() => {
  cleanup();
});

// jsdom has no IntersectionObserver. Framer Motion's `useInView` needs one
// to subscribe, so install an inert stub that never reports an intersection.
// Tests that need "in view" mock `useInView` directly.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class InertIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = InertIntersectionObserver as unknown as typeof IntersectionObserver;
}
