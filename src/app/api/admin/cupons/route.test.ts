import { describe, it, expect, vi, beforeEach } from "vitest";

const requireAdminSessionMock = vi.fn();

vi.mock("@/lib/supabase/require-admin-session", () => ({
  requireAdminSession: () => requireAdminSessionMock(),
}));

const singleMock = vi.fn();
const selectInsertMock = vi.fn().mockReturnValue({ single: singleMock });
const insertMock = vi.fn().mockReturnValue({ select: selectInsertMock });

const orderMock = vi.fn();
const selectListMock = vi.fn().mockReturnValue({ order: orderMock });

const fromMock = vi.fn().mockReturnValue({
  select: selectListMock,
  insert: insertMock,
});
const serviceClientMock = { from: fromMock };
const getSupabaseServiceClientMock = vi.fn().mockReturnValue(serviceClientMock);

vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => getSupabaseServiceClientMock(),
}));

import { GET, POST } from "./route";

function getRequest() {
  return new Request("http://localhost/api/admin/cupons");
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/admin/cupons", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/cupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ select: selectListMock, insert: insertMock });
    selectListMock.mockReturnValue({ order: orderMock });
    insertMock.mockReturnValue({ select: selectInsertMock });
    selectInsertMock.mockReturnValue({ single: singleMock });
  });

  it("returns 401 without a session and does not query", async () => {
    requireAdminSessionMock.mockResolvedValue(null);

    const res = await GET(getRequest());

    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 200 with the listed rows when a session is present", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    const rows = [{ id: "1", codigo: "ABC10" }];
    orderMock.mockResolvedValue({ data: rows, error: null });

    const res = await GET(getRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(rows);
    expect(fromMock).toHaveBeenCalledWith("cupons");
    expect(selectListMock).toHaveBeenCalledWith("*");
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("POST /api/admin/cupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ select: selectListMock, insert: insertMock });
    selectListMock.mockReturnValue({ order: orderMock });
    insertMock.mockReturnValue({ select: selectInsertMock });
    selectInsertMock.mockReturnValue({ single: singleMock });
  });

  it("returns 401 without a session and does not insert", async () => {
    requireAdminSessionMock.mockResolvedValue(null);

    const res = await POST(
      postRequest({ codigo: "ABC10", percentualDesconto: 10 }),
    );

    expect(res.status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts with criado_por from the session, usos_atuais 0 and ativo true, and returns 201", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    const insertedRow = {
      id: "1",
      codigo: "ABC10",
      percentual_desconto: 10,
      ativo: true,
      valido_de: null,
      valido_ate: null,
      limite_uso: null,
      usos_atuais: 0,
      criado_por: "admin@abvcap.com.br",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    singleMock.mockResolvedValue({ data: insertedRow, error: null });

    const res = await POST(
      postRequest({
        codigo: "abc10",
        percentualDesconto: 10,
        criado_por: "attacker@evil.com",
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(insertedRow);
    expect(insertMock).toHaveBeenCalledWith({
      codigo: "ABC10",
      percentual_desconto: 10,
      ativo: true,
      valido_de: null,
      valido_ate: null,
      limite_uso: null,
      usos_atuais: 0,
      criado_por: "admin@abvcap.com.br",
    });
  });

  it("anchors date-only validoDe/validoAte to the start/end of that day in BRT", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    singleMock.mockResolvedValue({ data: { id: "1" }, error: null });

    const res = await POST(
      postRequest({
        codigo: "NATAL",
        percentualDesconto: 10,
        validoDe: "2026-12-01",
        validoAte: "2026-12-20",
      }),
    );

    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        valido_de: "2026-12-01T00:00:00-03:00",
        valido_ate: "2026-12-20T23:59:59.999-03:00",
      }),
    );
    // Sanity: the end boundary is still Dec 20 in BRT, i.e. 02:59:59.999Z on Dec 21.
    const [{ valido_ate }] = insertMock.mock.calls[0] as [{ valido_ate: string }];
    expect(new Date(valido_ate).toISOString()).toBe("2026-12-21T02:59:59.999Z");
  });

  it("stores blank validoDe/validoAte as null", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });
    singleMock.mockResolvedValue({ data: { id: "1" }, error: null });

    await POST(postRequest({ codigo: "X", percentualDesconto: 10, validoDe: "", validoAte: "  " }));

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ valido_de: null, valido_ate: null }),
    );
  });

  it("returns 400 and does not insert when codigo is missing", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });

    const res = await POST(postRequest({ percentualDesconto: 10 }));

    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 400 and does not insert when percentualDesconto is non-numeric", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });

    const res = await POST(
      postRequest({ codigo: "ABC10", percentualDesconto: "dez" }),
    );

    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 400 and does not insert when percentualDesconto is 0", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });

    const res = await POST(
      postRequest({ codigo: "ABC10", percentualDesconto: 0 }),
    );

    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 400 and does not insert when percentualDesconto is above 100", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "admin@abvcap.com.br" });

    const res = await POST(
      postRequest({ codigo: "ABC10", percentualDesconto: 101 }),
    );

    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
