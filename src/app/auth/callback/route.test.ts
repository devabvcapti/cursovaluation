import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const exchangeCodeForSessionMock = vi.fn();
const getSupabaseServerClientMock = vi.fn().mockResolvedValue({
  auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
});

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: () => getSupabaseServerClientMock(),
}));

describe("GET /auth/callback", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    getSupabaseServerClientMock.mockClear();
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
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

  it("redirects via NEXT_PUBLIC_SITE_URL instead of the request's own origin when it's set", async () => {
    // Reproduces the Hostinger bug: behind its reverse proxy, `request.url`'s
    // origin resolves to the Next.js server's own bind address
    // (http://0.0.0.0:3000), not the public domain — redirecting there sent
    // every browser to an unreachable address, rendered as a generic 500.
    process.env.NEXT_PUBLIC_SITE_URL = "https://educacaoexecutiva.abvcap.com.br";
    exchangeCodeForSessionMock.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("./route");

    const response = await GET(new Request("http://0.0.0.0:3000/auth/callback?code=abc123"));

    expect(response.headers.get("location")).toBe("https://educacaoexecutiva.abvcap.com.br/admin/cupons");
  });
});
