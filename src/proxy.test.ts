// @vitest-environment node
//
// The project's default Vitest environment is jsdom (vitest.config.ts), but
// jsdom installs its own `Headers`/`Request`/`Response` globals that are not
// `instanceof`-compatible with the ones Next.js's `NextRequest`/`NextResponse`
// expect (Next asserts `instanceof Headers` internally). Running this file
// under the plain "node" environment uses Node's built-in fetch globals,
// which is what `next/server` is built against, so `NextRequest`/`NextResponse`
// behave as they do in real proxy execution.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue({ auth: { getUser: getUserMock } }),
}));

describe("proxy", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    getUserMock.mockReset();
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("redirects an unauthenticated request for /admin/cupons to /admin/login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets an authenticated request from an allowlisted account through", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "ti@abvcap.com.br" } } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(200);
  });

  it("redirects an authenticated but non-allowlisted account to /admin/login?denied=1", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "danila@sbeventos.com.br" } } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/admin/login");
    expect(location).toContain("denied=1");
  });

  it("never redirects /admin/login itself, even for a non-allowlisted authenticated account", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "danila@sbeventos.com.br" } } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/login")));
    expect(response.status).toBe(200);
  });

  it("never redirects /admin/login itself, even unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/login")));
    expect(response.status).toBe(200);
  });

  it("redirects via NEXT_PUBLIC_SITE_URL instead of the request's own origin when it's set", async () => {
    // Reproduces the Hostinger bug: behind its reverse proxy, the incoming
    // request's own origin resolves to the Next.js server's bind address
    // (http://0.0.0.0:3000), not the public domain. Since the PKCE exchange
    // in /auth/callback was failing, `user` was always null here, so EVERY
    // /admin/* request redirected to an unreachable /admin/login — the
    // generic 500 the user kept seeing, even in a fresh incognito window.
    process.env.NEXT_PUBLIC_SITE_URL = "https://educacaoexecutiva.abvcap.com.br";
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://0.0.0.0:3000/admin/cupons")));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://educacaoexecutiva.abvcap.com.br/admin/login");
  });
});
