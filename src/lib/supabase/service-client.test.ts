import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createClientMock = vi.fn().mockReturnValue({ fromMarker: "service" });

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

describe("getSupabaseServiceClient", () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    createClientMock.mockClear();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  afterEach(() => {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("throws when the required env vars are missing", async () => {
    delete process.env.SUPABASE_URL;
    const { getSupabaseServiceClient } = await import("./service-client");
    expect(() => getSupabaseServiceClient()).toThrow();
  });

  it("creates a client with the service-role key", async () => {
    const { getSupabaseServiceClient } = await import("./service-client");
    getSupabaseServiceClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.anything(),
    );
  });
});
