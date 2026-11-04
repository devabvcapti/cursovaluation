// @vitest-environment node
//
// The project's default Vitest environment is jsdom (vitest.config.ts), but
// jsdom installs its own `Headers`/`Request`/`Response` globals that are not
// `instanceof`-compatible with the ones Next.js's `NextRequest`/`NextResponse`
// expect (Next asserts `instanceof Headers` internally). Running this file
// under the plain "node" environment uses Node's built-in fetch globals,
// which is what `next/server` is built against, so `NextRequest`/`NextResponse`
// behave as they do in real proxy execution.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue({ auth: { getUser: getUserMock } }),
}));

describe("proxy", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("redirects an unauthenticated request for /admin/cupons to /admin/login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets an authenticated request through", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "ti@abvcap.com.br" } } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(200);
  });

  it("never redirects /admin/login itself, even unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(new URL("http://localhost/admin/login")));
    expect(response.status).toBe(200);
  });
});
