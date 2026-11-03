import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
const fromMock = vi.fn().mockReturnValue({ select: selectMock });
const serviceClientMock = { from: fromMock };

vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

import { GET } from "./route";

function call(id: string) {
  return GET(new Request(`http://localhost/api/checkout/pedido/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/checkout/pedido/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    fromMock.mockReturnValue({ select: selectMock });
  });

  it("returns 200 with only the status for a known pedido", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { status: "approved" },
      error: null,
    });

    const res = await call("pedido-1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "approved" });
    expect(fromMock).toHaveBeenCalledWith("pedidos");
    expect(selectMock).toHaveBeenCalledWith("status");
    expect(eqMock).toHaveBeenCalledWith("id", "pedido-1");
  });

  it("returns 404 for an unknown pedido", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const res = await call("missing");

    expect(res.status).toBe(404);
  });

  it("returns 500 when the query errors", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const res = await call("pedido-1");

    expect(res.status).toBe(500);
  });
});
