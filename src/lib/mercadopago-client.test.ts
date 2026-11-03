import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createMock = vi.fn();
const getMock = vi.fn();

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn().mockImplementation(() => ({ create: createMock, get: getMock })),
}));

describe("createMpPayment", () => {
  const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  beforeEach(() => {
    createMock.mockReset();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  });
  afterEach(() => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = originalToken;
  });

  const INPUT = {
    pedidoId: "pedido-1",
    transactionAmount: 9000,
    payer: { email: "ana@example.com", firstName: "Ana", identificationNumber: "11144477735" },
    formData: { token: "tok", payment_method_id: "visa", installments: 1 },
  };

  it("fails without throwing when MERCADOPAGO_ACCESS_TOKEN is missing", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result.ok).toBe(false);
  });

  it("creates a payment with external_reference set to the pedidoId", async () => {
    createMock.mockResolvedValue({ id: 123, status: "approved" });
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({ ok: true, mpPaymentId: "123", status: "approved" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ external_reference: "pedido-1", transaction_amount: 9000 }),
      }),
    );
  });

  it("includes pix QR data when the payment response carries point_of_interaction", async () => {
    createMock.mockResolvedValue({
      id: 456,
      status: "in_process",
      point_of_interaction: { transaction_data: { qr_code: "000...", qr_code_base64: "iVBORw0K..." } },
    });
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({
      ok: true,
      mpPaymentId: "456",
      status: "in_process",
      pix: { qrCode: "000...", qrCodeBase64: "iVBORw0K..." },
    });
  });

  it('passes through a "pending" status with pix QR data (what a real fresh Pix charge returns)', async () => {
    createMock.mockResolvedValue({
      id: 789,
      status: "pending",
      status_detail: "pending_waiting_transfer",
      point_of_interaction: { transaction_data: { qr_code: "000...", qr_code_base64: "iVBORw0K..." } },
    });
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment({ ...INPUT, formData: { payment_method_id: "pix" } });
    expect(result).toEqual({
      ok: true,
      mpPaymentId: "789",
      status: "pending",
      pix: { qrCode: "000...", qrCodeBase64: "iVBORw0K..." },
    });
  });

  it("never lets formData override transaction_amount, external_reference or payer, and forwards only payment-method fields", async () => {
    createMock.mockResolvedValue({ id: 1, status: "approved" });
    const { createMpPayment } = await import("./mercadopago-client");
    await createMpPayment({
      ...INPUT,
      formData: {
        token: "tok",
        payment_method_id: "visa",
        installments: 3,
        issuer_id: "24",
        // Tampered, browser-controlled values — must all be ignored:
        transaction_amount: 1,
        external_reference: "someone-elses-pedido",
        payer: { email: "attacker@evil.com", identification: { type: "CPF", number: "00000000000" } },
        additional_info: { items: [] },
        notification_url: "https://evil.example/hook",
      },
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const { body } = createMock.mock.calls[0][0];
    expect(body).toEqual({
      token: "tok",
      payment_method_id: "visa",
      installments: 3,
      issuer_id: "24",
      transaction_amount: 9000,
      external_reference: "pedido-1",
      payer: {
        email: "ana@example.com",
        first_name: "Ana",
        identification: { type: "CPF", number: "11144477735" },
      },
    });
  });

  it("returns ok:false when the SDK throws", async () => {
    createMock.mockRejectedValue(new Error("mp down"));
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({ ok: false, reason: "mp down" });
  });
});

describe("getMpPayment", () => {
  beforeEach(() => {
    getMock.mockReset();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  });

  it("fetches a payment by id and maps its status and external_reference", async () => {
    getMock.mockResolvedValue({ id: 123, status: "approved", external_reference: "pedido-1" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({
      ok: true,
      status: "approved",
      externalReference: "pedido-1",
    });
  });

  it("passes through a cancelled status (e.g. an expired Pix charge), with a null externalReference when absent", async () => {
    getMock.mockResolvedValue({ id: 123, status: "cancelled" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({
      ok: true,
      status: "cancelled",
      externalReference: null,
    });
  });

  it('passes through a "pending" status (an unpaid Pix charge)', async () => {
    getMock.mockResolvedValue({ id: 123, status: "pending", external_reference: "pedido-1" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({
      ok: true,
      status: "pending",
      externalReference: "pedido-1",
    });
  });
});
