import { describe, it, expect } from "vitest";
import { validateLead } from "./validate-lead";

describe("validateLead", () => {
  it("rejects an empty name", () => {
    const result = validateLead({ name: "", email: "ana@example.com" });
    expect(result.valid).toBe(false);
  });
  it("rejects a malformed email", () => {
    const result = validateLead({ name: "Ana", email: "not-an-email" });
    expect(result.valid).toBe(false);
  });
  it("accepts a valid payload", () => {
    const result = validateLead({ name: "Ana", email: "ana@example.com" });
    expect(result.valid).toBe(true);
  });
});
