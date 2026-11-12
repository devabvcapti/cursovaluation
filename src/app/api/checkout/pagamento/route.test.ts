import { describe, it, expect, vi, beforeEach } from "vitest";
import { TABLE_PEDIDOS } from "@/lib/supabase/table-names";

const createMpPaymentMock = vi.fn();
vi.mock("@/lib/mercadopago-client", () => ({
  createMpPayment: createMpPaymentMock,
}));

const maybeSingleMock = vi.fn();
const eqSelectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
const selectMock = vi.fn().mockReturnValue({ eq: eqSelectMock });

// Chain (via applyPedidoStatus): .update({...}).eq("id", id).eq("status", s).select("id")
const updateSelectMock = vi.fn().mockResolvedValue({ data: [{ id: "pedido-1" }], error: null });
const eqUpdateStatusMock = vi.fn().mockReturnValue({ select: updateSelectMock });
const eqUpdateIdMock = vi.fn().mockReturnValue({ eq: eqUpdateStatusMock });
const updateMock = vi.fn().mockReturnValue({ eq: eqUpdateIdMock });

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

const pedidoRow = {
  id: "pedido-1",
  mp_payment_id: null,
  nome: "Ana Souza",
  email: "ana@example.com",
  cpf: "12345678909",
  telefone: "11999998888",
  cnpj_informado: null,
  empresa: null,
  cargo: null,
  is_associado: false,
  cupom_codigo: null,
  valor_base: 1000,
  valor_cobrado: 900,
  status: "pending",
  payment_method: null,
  curso_slug: "valuation",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/checkout/pagamento", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/pagamento", () => {
  beforeEach(() => {
    createMpPaymentMock.mockReset();
    maybeSingleMock.mockReset();
    eqSelectMock.mockClear();
    selectMock.mockClear();
    updateSelectMock.mockClear();
    updateSelectMock.mockResolvedValue({ data: [{ id: "pedido-1" }], error: null });
    eqUpdateStatusMock.mockClear();
    eqUpdateIdMock.mockClear();
    updateMock.mockClear();
    fromMock.mockClear();
    incrementCupomUsoMock.mockReset();
    incrementCupomUsoMock.mockResolvedValue(undefined);
    sendOrderConfirmationEmailMock.mockReset();
    sendOrderConfirmationEmailMock.mockResolvedValue({ ok: true });
    sendOrderNotificationEmailMock.mockReset();
    sendOrderNotificationEmailMock.mockResolvedValue({ ok: true });
  });

  it("returns 404 and never calls Mercado Pago for an unknown pedidoId", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: "unknown-id", formData: {}, paymentMethodId: "pix" }),
    );

    expect(response.status).toBe(404);
    expect(createMpPaymentMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("never charges an already-approved pedido again: returns approved without calling Mercado Pago or writing", async () => {
    maybeSingleMock.mockResolvedValue({ data: { ...pedidoRow, status: "approved" }, error: null });

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: { token: "tok" }, paymentMethodId: "visa" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "approved" });
    expect(createMpPaymentMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
  });

  it("fetches the pedido, calls createMpPayment with server-side amount/payer, conditionally updates the row, and returns 200 with the approved status", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: true,
      mpPaymentId: "mp-123",
      status: "approved",
    });

    const formData = { token: "card-token-abc", installments: 1 };
    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData, paymentMethodId: "visa" }),
    );

    expect(fromMock).toHaveBeenCalledWith(TABLE_PEDIDOS);
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
      status: "approved",
      mp_payment_id: "mp-123",
      payment_method: "credit_card",
    });
    expect(eqUpdateIdMock).toHaveBeenCalledWith("id", pedidoRow.id);
    expect(eqUpdateStatusMock).toHaveBeenCalledWith("status", "pending");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "approved" });
  });

  it("a card approved synchronously fires both emails and the cupom increment from THIS route (no webhook needed)", async () => {
    const rowWithCupom = { ...pedidoRow, cupom_codigo: "PROMO10" };
    maybeSingleMock.mockResolvedValue({ data: rowWithCupom, error: null });
    createMpPaymentMock.mockResolvedValue({ ok: true, mpPaymentId: "mp-123", status: "approved" });

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: { token: "tok" }, paymentMethodId: "visa" }),
    );

    expect(response.status).toBe(200);
    expect(incrementCupomUsoMock).toHaveBeenCalledWith("PROMO10");
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalledWith(rowWithCupom);
    expect(sendOrderNotificationEmailMock).toHaveBeenCalledWith(rowWithCupom);
  });

  it("still reports approved to the buyer (200) when an email sender throws after the charge", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({ ok: true, mpPaymentId: "mp-123", status: "approved" });
    sendOrderConfirmationEmailMock.mockRejectedValue(new Error("resend down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "visa" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "approved" });
    expect(sendOrderNotificationEmailMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("sends no emails when the conditional write lost the race (e.g. the webhook already approved the row) — no duplicate side effects", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({ ok: true, mpPaymentId: "mp-123", status: "approved" });
    updateSelectMock.mockResolvedValue({ data: [], error: null });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "visa" }),
    );

    expect(response.status).toBe(200);
    expect(incrementCupomUsoMock).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderNotificationEmailMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("checks the update result: logs and sends no emails when the DB write errors", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({ ok: true, mpPaymentId: "mp-123", status: "approved" });
    updateSelectMock.mockResolvedValue({ data: null, error: { message: "db unavailable" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "visa" }),
    );

    expect(response.status).toBe(200);
    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("sets payment_method to pix only when paymentMethodId is \"pix\"", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: true,
      mpPaymentId: "mp-456",
      status: "approved",
    });

    const { POST } = await import("./route");
    await POST(buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "pix" }));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method: "pix" }),
    );
  });

  it.each(["pending", "in_process"])(
    'stores a "%s" Pix result as "pending" (recording mp_payment_id), sends no emails, and responds with the raw status plus the pix payload',
    async (rawStatus) => {
      maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
      createMpPaymentMock.mockResolvedValue({
        ok: true,
        mpPaymentId: "mp-789",
        status: rawStatus,
        pix: { qrCode: "00020126...", qrCodeBase64: "iVBORw0KGgo=" },
      });

      const { POST } = await import("./route");
      const response = await POST(
        buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "pix" }),
      );

      // Status unchanged (pending -> pending) but the payment id/method are
      // still written, through the same conditional update.
      expect(updateMock).toHaveBeenCalledWith({
        status: "pending",
        mp_payment_id: "mp-789",
        payment_method: "pix",
      });
      expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        status: rawStatus,
        pix: { qrCode: "00020126...", qrCodeBase64: "iVBORw0KGgo=" },
      });
    },
  );

  it("skips Mercado Pago entirely for a 100%-off pedido (valor_cobrado 0), finalizing it as approved via applyPedidoStatus", async () => {
    const freeRow = { ...pedidoRow, valor_cobrado: 0, cupom_codigo: "GRATIS100" };
    maybeSingleMock.mockResolvedValue({ data: freeRow, error: null });

    const { POST } = await import("./route");
    const response = await POST(buildRequest({ pedidoId: pedidoRow.id }));

    expect(createMpPaymentMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({ status: "approved", payment_method: "free" });
    expect(incrementCupomUsoMock).toHaveBeenCalledWith("GRATIS100");
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalledWith(freeRow);
    expect(sendOrderNotificationEmailMock).toHaveBeenCalledWith(freeRow);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "approved" });
  });

  it("returns 502 and leaves the pedido's status untouched when createMpPayment fails", async () => {
    maybeSingleMock.mockResolvedValue({ data: pedidoRow, error: null });
    createMpPaymentMock.mockResolvedValue({
      ok: false,
      reason: "MERCADOPAGO_ACCESS_TOKEN is not configured",
    });

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ pedidoId: pedidoRow.id, formData: {}, paymentMethodId: "pix" }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      errors: { nome: "Não foi possível processar o pagamento agora." },
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
