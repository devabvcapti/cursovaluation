import { describe, it, expect, vi, afterEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, renderHook } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";

type Listener = () => void;

function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_type: string, listener: Listener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: Listener) => {
      listeners.delete(listener);
    }),
  };
  vi.stubGlobal("matchMedia", () => mql);
  return {
    mql,
    set(value: boolean) {
      mql.matches = value;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useReducedMotion", () => {
  it("returns true when the media query matches", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false on the client when the media query does not match", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("updates live when the OS preference changes", () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
    act(() => media.set(false));
    expect(result.current).toBe(false);
  });

  // Regression: server render and the first (hydration) client render must
  // both read the safe default `true`, regardless of the real preference, so
  // there is no hydration mismatch and no flash of motion.
  it("uses the safe reduced-motion default (true) for the server snapshot", () => {
    stubMatchMedia(false);
    function Probe() {
      return createElement("span", null, String(useReducedMotion()));
    }
    expect(renderToString(createElement(Probe))).toContain("true");
  });

  it("hydrates with true first, then upgrades to the real value without a mismatch", async () => {
    stubMatchMedia(false);
    const renders: boolean[] = [];
    function Probe() {
      const value = useReducedMotion();
      renders.push(value);
      return createElement("span", null, String(value));
    }

    const html = renderToString(createElement(Probe));
    renders.length = 0;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, createElement(Probe), { onRecoverableError });
    });

    expect(renders[0]).toBe(true);
    expect(renders[renders.length - 1]).toBe(false);
    expect(container.textContent).toBe("false");
    expect(onRecoverableError).not.toHaveBeenCalled();

    container.remove();
  });
});
