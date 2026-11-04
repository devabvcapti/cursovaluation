import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const serverClientMock = { auth: { getUser: getUserMock } };
const getSupabaseServerClientMock = vi.fn().mockResolvedValue(serverClientMock);

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: () => getSupabaseServerClientMock(),
}));

import { requireAdminSession } from "./require-admin-session";

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseServerClientMock.mockResolvedValue(serverClientMock);
  });

  it("returns the session email when auth.getUser resolves a user", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "admin@abvcap.com.br" } },
      error: null,
    });

    const session = await requireAdminSession();

    expect(session).toEqual({ email: "admin@abvcap.com.br" });
  });

  it("returns null when auth.getUser resolves no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const session = await requireAdminSession();

    expect(session).toBeNull();
  });

  it("returns null when the resolved user has no email", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    });

    const session = await requireAdminSession();

    expect(session).toBeNull();
  });

  it("returns null when the resolved user's email is not on the admin allowlist", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "danila@sbeventos.com.br" } },
      error: null,
    });

    const session = await requireAdminSession();

    expect(session).toBeNull();
  });

  it("returns null (not a throw) when auth.getUser throws", async () => {
    getUserMock.mockRejectedValue(new Error("network down"));

    const session = await requireAdminSession();

    expect(session).toBeNull();
  });

  it("returns null (not a throw) when getSupabaseServerClient throws", async () => {
    getSupabaseServerClientMock.mockRejectedValue(new Error("cookies unavailable"));

    const session = await requireAdminSession();

    expect(session).toBeNull();
  });
});
