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

  it("fetches a payment by id and maps its status", async () => {
    getMock.mockResolvedValue({ id: 123, status: "approved" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({ ok: true, status: "approved" });
  });

  it("passes through a cancelled status (e.g. an expired Pix charge)", async () => {
    getMock.mockResolvedValue({ id: 123, status: "cancelled" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({ ok: true, status: "cancelled" });
  });
});
