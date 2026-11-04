import { describe, it, expect } from "vitest";
import { isAllowedAdminEmail } from "./admin-allowlist";

describe("isAllowedAdminEmail", () => {
  it("accepts every one of the 7 allowed ABVCAP accounts", () => {
    expect(isAllowedAdminEmail("ti@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("rlima@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("mbarea@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("admin@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("afernandes@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("rlujan@abvcap.com.br")).toBe(true);
    expect(isAllowedAdminEmail("eventos@abvcap.com.br")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowedAdminEmail("TI@ABVCAP.COM.BR")).toBe(true);
  });

  it("rejects the external events-production account sharing this Supabase project", () => {
    expect(isAllowedAdminEmail("danila@sbeventos.com.br")).toBe(false);
  });

  it("rejects any other address, null, and undefined", () => {
    expect(isAllowedAdminEmail("someone-else@abvcap.com.br")).toBe(false);
    expect(isAllowedAdminEmail(null)).toBe(false);
    expect(isAllowedAdminEmail(undefined)).toBe(false);
    expect(isAllowedAdminEmail("")).toBe(false);
  });
});
