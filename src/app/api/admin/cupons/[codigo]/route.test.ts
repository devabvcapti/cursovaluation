import { describe, it, expect, vi, beforeEach } from "vitest";

const requireAdminSessionMock = vi.fn();

vi.mock("@/lib/supabase/require-admin-session", () => ({
  requireAdminSession: () => requireAdminSessionMock(),
}));

const maybeSingleMock = vi.fn();
const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
const eqMock = vi.fn().mockReturnValue({ select: selectMock });
const setMock = vi.fn().mockReturnValue({ eq: eqMock });
const fromMock = vi.fn().mockReturnValue({ update: setMock });
const serviceClientMock = { from: fromMock };
const getSupabaseServiceClientMock = vi.fn().mockReturnValue(serviceClientMock);

vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => getSupabaseServiceClientMock(),
}));

import { PATCH } from "./route";

function call(codigo: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/admin/cupons/${codigo}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ codigo }) },
  );
}

describe("PATCH /api/admin/cupons/[codigo]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ update: setMock });
    setMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ maybeSingle: maybeSingleMock });
  });

  it("returns 401 without a session and does not update", async () => {
    requireAdminSessionMock.mockResolvedValue(null);

    const res = await call("ABC10", { ativo: false });

    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown codigo", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const res = await call("MISSING", { ativo: false });

    expect(res.status).toBe(404);
  });

  it("updates ativo and returns the updated row for a known codigo", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    const updatedRow = { id: "1", codigo: "ABC10", ativo: false };
    maybeSingleMock.mockResolvedValue({ data: updatedRow, error: null });

    const res = await call("ABC10", { ativo: false });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updatedRow);
    expect(fromMock).toHaveBeenCalledWith("cupons");
    expect(setMock).toHaveBeenCalledWith({ ativo: false });
    expect(eqMock).toHaveBeenCalledWith("codigo", "ABC10");
  });
});
