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
    is_associado: false,
    cupom_codigo: null,
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

describe("sendOrderConfirmationEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
  });

  it("fails without throwing when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendOrderConfirmationEmail } = await import("./send-order-confirmation-email");
    const result = await sendOrderConfirmationEmail(buildPedido());
    expect(result.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("emails the buyer directly with the confirmation details", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendOrderConfirmationEmail } = await import("./send-order-confirmation-email");
    const result = await sendOrderConfirmationEmail(buildPedido());
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["ana@example.com"],
        subject: "Matrícula confirmada — Curso de Valuation ABVCAP",
      }),
    );
    const call = sendMock.mock.calls[0][0];
    expect(call.text).toContain("Ana");
    expect(call.text).toContain("R$");
    expect(call.text).toContain("16 de fevereiro de 2027");
  });

  it("returns ok:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const { sendOrderConfirmationEmail } = await import("./send-order-confirmation-email");
    const result = await sendOrderConfirmationEmail(buildPedido());
    expect(result).toEqual({ ok: false, reason: "domain not verified" });
  });
});
