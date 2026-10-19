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
