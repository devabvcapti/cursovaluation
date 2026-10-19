import { describe, it, expect } from "vitest";
import { placeholder, isPlaceholder } from "./placeholder";

describe("placeholder", () => {
  it("wraps a label in brackets", () => {
    expect(placeholder("PREÇO")).toBe("[PREÇO]");
  });
  it("isPlaceholder recognizes bracketed values", () => {
    expect(isPlaceholder("[PREÇO]")).toBe(true);
  });
  it("isPlaceholder rejects real-looking values", () => {
    expect(isPlaceholder("R$ 6.000")).toBe(false);
  });
});
