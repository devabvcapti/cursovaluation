import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PedidoRow } from "@/lib/supabase/types";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

function buildPedido(overrides: Partial<PedidoRow> = {}): PedidoRow {
  return {
    id: "pedido-1",
    mp_payment_id: "mp-123",
    nome: "Ana",
    email: "ana@example.com",
    cpf: "123.456.789-00",
    telefone: "11999999999",
    cnpj_informado: null,
    is_associado: true,
    cupom_codigo: "PROMO10",
    valor_base: 1000,
    valor_cobrado: 900,
    status: "approved",
    payment_method: "pix",
    curso_slug: "valuation",
    created_at: "2026-11-03T00:00:00.000Z",
    updated_at: "2026-11-03T00:00:00.000Z",
    ...overrides,
  };
}

describe("sendOrderNotificationEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalRecipient = process.env.LEAD_NOTIFICATION_EMAIL;

  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.LEAD_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
    process.env.LEAD_NOTIFICATION_EMAIL = originalRecipient;
  });

  it("fails without throwing when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendOrderNotificationEmail } = await import("./send-order-notification-email");
    const result = await sendOrderNotificationEmail(buildPedido());
    expect(result.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends to the default recipient when LEAD_NOTIFICATION_EMAIL is unset", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendOrderNotificationEmail } = await import("./send-order-notification-email");
    const result = await sendOrderNotificationEmail(buildPedido());
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["ti@abvcap.com.br"],
        subject: "Nova matrícula paga — Curso Valuation ABVCAP",
      }),
    );
    const call = sendMock.mock.calls[0][0];
    expect(call.text).toContain("Ana");
    expect(call.text).toContain("ana@example.com");
    expect(call.text).toContain("123.456.789-00");
    expect(call.text).toContain("11999999999");
    expect(call.text).toContain("true");
    expect(call.text).toContain("PROMO10");
    expect(call.text).toContain("900");
    expect(call.text).toContain("pix");
  });

  it("sends to the overridden recipient when LEAD_NOTIFICATION_EMAIL is set", async () => {
    process.env.LEAD_NOTIFICATION_EMAIL = "custom@abvcap.com.br";
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendOrderNotificationEmail } = await import("./send-order-notification-email");
    const result = await sendOrderNotificationEmail(buildPedido());
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["custom@abvcap.com.br"] }),
    );
  });

  it("returns ok:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const { sendOrderNotificationEmail } = await import("./send-order-notification-email");
    const result = await sendOrderNotificationEmail(buildPedido());
    expect(result).toEqual({ ok: false, reason: "domain not verified" });
  });
});
