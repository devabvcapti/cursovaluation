import { describe, it, expect, vi, beforeEach } from "vitest";

const exchangeCodeForSessionMock = vi.fn();
const getSupabaseServerClientMock = vi.fn().mockResolvedValue({
  auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
});

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: () => getSupabaseServerClientMock(),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    getSupabaseServerClientMock.mockClear();
  });

  it("exchanges the code for a session and redirects to /admin/cupons", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/auth/callback?code=abc123"));

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("abc123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin/cupons");
  });

  it("redirects to /admin/cupons without exchanging when there is no code", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/auth/callback"));

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost/admin/cupons");
  });
});
