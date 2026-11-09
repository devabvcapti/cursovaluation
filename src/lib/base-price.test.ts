import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveBasePrice } from "./base-price";

describe("resolveBasePrice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the early-bird non-associado price before the deadline", () => {
    vi.setSystemTime(new Date("2026-12-04T23:59:59.999-03:00"));
    expect(resolveBasePrice(false)).toBe(7650);
  });

  it("returns the full non-associado price at and after the deadline", () => {
    vi.setSystemTime(new Date("2026-12-05T00:00:00-03:00"));
    expect(resolveBasePrice(false)).toBe(8500);
  });

  it("returns the early-bird associado price before the deadline", () => {
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
    expect(resolveBasePrice(true)).toBe(6120);
  });

  it("returns the full associado price at and after the deadline", () => {
    vi.setSystemTime(new Date("2026-12-05T00:00:00-03:00"));
    expect(resolveBasePrice(true)).toBe(6800);
  });
});
