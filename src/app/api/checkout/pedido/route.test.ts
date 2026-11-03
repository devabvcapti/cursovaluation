import { describe, it, expect, vi, beforeEach } from "vitest";

const validateCheckoutMock = vi.fn();
const resolvePriceMock = vi.fn();
const singleMock = vi.fn();
const selectMock = vi.fn().mockReturnValue({ single: singleMock });
const insertMock = vi.fn().mockReturnValue({ select: selectMock });
const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
const serviceClientMock = { from: fromMock };

vi.mock("@/lib/validate-checkout", () => ({
  validateCheckout: validateCheckoutMock,
}));
vi.mock("@/lib/pricing", () => ({
  resolvePrice: resolvePriceMock,
}));
vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

const validPayload = {
  nome: "Ana",
  email: "ana@example.com",
  cpf: "123.456.789-09",
  telefone: "11999998888",
  cnpj: "11.222.333/0001-81",
  cupom: "PROMO10",
};

describe("POST /api/checkout/pedido", () => {
  beforeEach(() => {
    validateCheckoutMock.mockReset();
    resolvePriceMock.mockReset();
    singleMock.mockReset();
    selectMock.mockClear();
    insertMock.mockClear();
    fromMock.mockClear();
  });

  it("returns 400 and does not call Supabase for an invalid payload", async () => {
    validateCheckoutMock.mockReturnValue({
      valid: false,
      errors: { nome: "Campo obrigatório." },
    });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pedido", {
      method: "POST",
      body: JSON.stringify({ ...validPayload, nome: "" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ errors: { nome: "Campo obrigatório." } });
    expect(resolvePriceMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("resolves price server-side, inserts a pending pedido, and returns pedidoId/valorCobrado", async () => {
    validateCheckoutMock.mockReturnValue({ valid: true });
    const price = {
      isAssociado: true,
      cupomAplicado: "PROMO10",
      valorBase: 1000,
      valorCobrado: 900,
    };
    resolvePriceMock.mockResolvedValue(price);
    singleMock.mockResolvedValue({ data: { id: "pedido-123" }, error: null });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pedido", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });
    const response = await POST(request);

    expect(resolvePriceMock).toHaveBeenCalledWith({
      cnpj: validPayload.cnpj,
      cupom: validPayload.cupom,
    });
    expect(fromMock).toHaveBeenCalledWith("pedidos");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: validPayload.nome,
        email: validPayload.email,
        cpf: validPayload.cpf,
        telefone: validPayload.telefone,
        cnpj_informado: validPayload.cnpj,
        is_associado: price.isAssociado,
        cupom_codigo: price.cupomAplicado,
        valor_base: price.valorBase,
        valor_cobrado: price.valorCobrado,
        status: "pending",
      }),
    );
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ pedidoId: "pedido-123", valorCobrado: 900 });
  });

  it("never lets a client-supplied price reach the database: insert uses only server-resolved values", async () => {
    validateCheckoutMock.mockReturnValue({ valid: true });
    const price = {
      isAssociado: false,
      cupomAplicado: null,
      valorBase: 1000,
      valorCobrado: 1000,
    };
    resolvePriceMock.mockResolvedValue(price);
    singleMock.mockResolvedValue({ data: { id: "pedido-456" }, error: null });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pedido", {
      method: "POST",
      body: JSON.stringify({
        ...validPayload,
        valorCobrado: 1, // malicious client-sent price, must be ignored
        valor_cobrado: 1,
      }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ valor_cobrado: 1000, valor_base: 1000 }),
    );
    expect(body.valorCobrado).toBe(1000);
    expect(response.status).toBe(200);
  });

  it("sets cnpj_informado to null (not an empty string) when no cnpj is submitted", async () => {
    validateCheckoutMock.mockReturnValue({ valid: true });
    const price = {
      isAssociado: false,
      cupomAplicado: null,
      valorBase: 1000,
      valorCobrado: 1000,
    };
    resolvePriceMock.mockResolvedValue(price);
    singleMock.mockResolvedValue({ data: { id: "pedido-789" }, error: null });

    const { POST } = await import("./route");
    const payloadWithoutCnpj: Record<string, unknown> = { ...validPayload };
    delete payloadWithoutCnpj.cnpj;
    const request = new Request("http://localhost/api/checkout/pedido", {
      method: "POST",
      body: JSON.stringify(payloadWithoutCnpj),
    });
    await POST(request);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ cnpj_informado: null }),
    );
  });

  it("returns 502 with a nome error when the Supabase insert fails", async () => {
    validateCheckoutMock.mockReturnValue({ valid: true });
    resolvePriceMock.mockResolvedValue({
      isAssociado: false,
      cupomAplicado: null,
      valorBase: 1000,
      valorCobrado: 1000,
    });
    singleMock.mockResolvedValue({ data: null, error: { message: "connection error" } });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pedido", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });
    const response = await POST(request);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      errors: { nome: "Não foi possível iniciar o pagamento agora." },
    });
  });
});
