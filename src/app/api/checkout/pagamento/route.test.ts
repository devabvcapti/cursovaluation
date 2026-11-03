import { describe, it, expect, vi, beforeEach } from "vitest";

const createMpPaymentMock = vi.fn();
vi.mock("@/lib/mercadopago-client", () => ({
  createMpPayment: createMpPaymentMock,
}));

const maybeSingleMock = vi.fn();
const eqSelectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
const selectMock = vi.fn().mockReturnValue({ eq: eqSelectMock });

const eqUpdateMock = vi.fn().mockResolvedValue({ data: null, error: null });
const updateMock = vi.fn().mockReturnValue({ eq: eqUpdateMock });

const fromMock = vi.fn().mockReturnValue({ select: selectMock, update: updateMock });
const serviceClientMock = { from: fromMock };

vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

const pedidoRow = {
  id: "pedido-1",
  mp_payment_id: null,
  nome: "Ana Souza",
  email: "ana@example.com",
  cpf: "12345678909",
  telefone: "11999998888",
  cnpj_informado: null,
  is_associado: false,
  cupom_codigo: null,
  valor_base: 1000,
  valor_cobrado: 900,
  status: "pending",
  payment_method: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("POST /api/checkout/pagamento", () => {
  beforeEach(() => {
    createMpPaymentMock.mockReset();
    maybeSingleMock.mockReset();
    eqSelectMock.mockClear();
    selectMock.mockClear();
    eqUpdateMock.mockClear();
    eqUpdateMock.mockResolvedValue({ data: null, error: null });
    updateMock.mockClear();
    fromMock.mockClear();
  });

  it("returns 404 and never calls Mercado Pago for an unknown pedidoId", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pagamento", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: "unknown-id",
        formData: {},
        paymentMethodId: "pix",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(createMpPaymentMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("fetches the pedido, calls createMpPayment, updates the row, and returns 200 with the approved status", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: true,
      mpPaymentId: "mp-123",
      status: "approved",
    });

    const formData = { token: "card-token-abc", installments: 1 };
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pagamento", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: pedidoRow.id,
        formData,
        paymentMethodId: "visa",
      }),
    });
    const response = await POST(request);

    expect(fromMock).toHaveBeenCalledWith("pedidos");
    expect(selectMock).toHaveBeenCalled();
    expect(eqSelectMock).toHaveBeenCalledWith("id", pedidoRow.id);

    expect(createMpPaymentMock).toHaveBeenCalledWith({
      pedidoId: pedidoRow.id,
      transactionAmount: pedidoRow.valor_cobrado,
      payer: {
        email: pedidoRow.email,
        firstName: "Ana",
        identificationNumber: pedidoRow.cpf,
      },
      formData,
    });

    expect(updateMock).toHaveBeenCalledWith({
      mp_payment_id: "mp-123",
      status: "approved",
      payment_method: "credit_card",
    });
    expect(eqUpdateMock).toHaveBeenCalledWith("id", pedidoRow.id);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "approved" });
  });

  it("sets payment_method to pix only when paymentMethodId is \"pix\"", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: true,
      mpPaymentId: "mp-456",
      status: "approved",
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pagamento", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: pedidoRow.id,
        formData: {},
        paymentMethodId: "pix",
      }),
    });
    await POST(request);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method: "pix" }),
    );
  });

  it('maps an "in_process" result to a stored "pending" status while the JSON response still reports "in_process", and includes the pix payload', async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: true,
      mpPaymentId: "mp-789",
      status: "in_process",
      pix: { qrCode: "00020126...", qrCodeBase64: "iVBORw0KGgo=" },
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pagamento", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: pedidoRow.id,
        formData: {},
        paymentMethodId: "pix",
      }),
    });
    const response = await POST(request);

    // Stored value must be the DB-safe "pending" — our pedidos.status column
    // has no "in_process" member.
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );

    // Responded value must be the RAW, unmapped "in_process" — Task 16's
    // Pix-waiting UI switches on this exact value.
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      status: "in_process",
      pix: { qrCode: "00020126...", qrCodeBase64: "iVBORw0KGgo=" },
    });
  });

  it("returns 502 and leaves the pedido's status untouched when createMpPayment fails", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: false,
      reason: "MERCADOPAGO_ACCESS_TOKEN is not configured",
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/pagamento", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: pedidoRow.id,
        formData: {},
        paymentMethodId: "pix",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      errors: { nome: "Não foi possível processar o pagamento agora." },
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
