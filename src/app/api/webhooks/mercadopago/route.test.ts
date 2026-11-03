import { describe, it, expect, vi, beforeEach } from "vitest";

const verifyMpWebhookSignatureMock = vi.fn();
vi.mock("@/lib/verify-mp-webhook-signature", () => ({
  verifyMpWebhookSignature: verifyMpWebhookSignatureMock,
}));

const getMpPaymentMock = vi.fn();
vi.mock("@/lib/mercadopago-client", () => ({
  getMpPayment: getMpPaymentMock,
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

const incrementCupomUsoMock = vi.fn();
vi.mock("@/lib/cupons", () => ({
  incrementCupomUso: incrementCupomUsoMock,
}));

const sendOrderConfirmationEmailMock = vi.fn();
vi.mock("@/lib/send-order-confirmation-email", () => ({
  sendOrderConfirmationEmail: sendOrderConfirmationEmailMock,
}));

const sendOrderNotificationEmailMock = vi.fn();
vi.mock("@/lib/send-order-notification-email", () => ({
  sendOrderNotificationEmail: sendOrderNotificationEmailMock,
}));

function buildPedidoRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "pedido-1",
    mp_payment_id: "mp-123",
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
    payment_method: "pix",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    headers: {
      "x-signature": "ts=1700000000,v1=abcdef",
      "x-request-id": "req-1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/mercadopago", () => {
  beforeEach(() => {
    verifyMpWebhookSignatureMock.mockReset();
    verifyMpWebhookSignatureMock.mockReturnValue(true);
    getMpPaymentMock.mockReset();
    maybeSingleMock.mockReset();
    eqSelectMock.mockClear();
    selectMock.mockClear();
    eqUpdateMock.mockClear();
    eqUpdateMock.mockResolvedValue({ data: null, error: null });
    updateMock.mockClear();
    fromMock.mockClear();
    incrementCupomUsoMock.mockReset();
    incrementCupomUsoMock.mockResolvedValue(undefined);
    sendOrderConfirmationEmailMock.mockReset();
    sendOrderConfirmationEmailMock.mockResolvedValue({ ok: true });
    sendOrderNotificationEmailMock.mockReset();
    sendOrderNotificationEmailMock.mockResolvedValue({ ok: true });
  });

  it("returns 401 and makes no Supabase/email calls when the signature is invalid", async () => {
    verifyMpWebhookSignatureMock.mockReturnValue(false);

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(getMpPaymentMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
  });

  it('on "approved" with a matching pending row, updates status, increments the cupom when present, sends both emails, and returns 200', async () => {
    const pedidoRow = buildPedidoRow({ status: "pending", cupom_codigo: "PROMO10" });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "approved" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(eqSelectMock).toHaveBeenCalledWith("mp_payment_id", "mp-123");
    expect(updateMock).toHaveBeenCalledWith({ status: "approved" });
    expect(eqUpdateMock).toHaveBeenCalledWith("id", pedidoRow.id);
    expect(incrementCupomUsoMock).toHaveBeenCalledWith("PROMO10");
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalledWith(pedidoRow);
    expect(sendOrderNotificationEmailMock).toHaveBeenCalledWith(pedidoRow);
    expect(response.status).toBe(200);
  });

  it("does not call incrementCupomUso when the row has no cupom_codigo", async () => {
    const pedidoRow = buildPedidoRow({ status: "pending", cupom_codigo: null });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "approved" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    await POST(request);

    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).toHaveBeenCalled();
  });

  it("is idempotent: redelivering the same payload against an already-approved row updates nothing and sends no emails again", async () => {
    const pedidoRow = buildPedidoRow({ status: "approved", cupom_codigo: "PROMO10" });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "approved" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(updateMock).not.toHaveBeenCalled();
    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('on "rejected", updates status to rejected, sends no emails, and returns 200', async () => {
    const pedidoRow = buildPedidoRow({ status: "pending" });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "rejected" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(updateMock).toHaveBeenCalledWith({ status: "rejected" });
    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('on "in_process" against an already-"pending" row, updates nothing (mapping collapses to the same status) and sends no emails', async () => {
    const pedidoRow = buildPedidoRow({ status: "pending" });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "in_process" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(updateMock).not.toHaveBeenCalled();
    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('on "cancelled" (e.g. an expired Pix charge) against a "pending" row, updates status to cancelled, sends no emails, and returns 200', async () => {
    const pedidoRow = buildPedidoRow({ status: "pending" });
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "cancelled" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(updateMock).toHaveBeenCalledWith({ status: "cancelled" });
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("returns 200 and does not crash when getMpPayment fails", async () => {
    getMpPaymentMock.mockResolvedValue({ ok: false, reason: "network error" });

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 200 and logs a warning when no pedidos row matches the payment", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    getMpPaymentMock.mockResolvedValue({ ok: true, status: "approved" });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { POST } = await import("./route");
    const request = buildRequest({ action: "payment.updated", data: { id: "mp-123" } });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
