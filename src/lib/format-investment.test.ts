import { describe, it, expect } from "vitest";
import { formatInvestment } from "./format-investment";

describe("formatInvestment", () => {
  it("returns placeholder values unchanged", () => {
    expect(formatInvestment("[PREÇO]")).toBe("[PREÇO]");
  });
  it("formats a real numeric value as BRL currency", () => {
    expect(formatInvestment("7500")).toBe("R$ 7.500,00");
  });
});
