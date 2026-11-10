import { Resend } from "resend";
import type { PedidoRow } from "@/lib/supabase/types";

const FROM_ADDRESS = "ABVCAP <contato@resend.abvcap.com.br>";
const DEFAULT_RECIPIENT = "ti@abvcap.com.br";

function getRecipient(): string {
  return process.env.LEAD_NOTIFICATION_EMAIL || DEFAULT_RECIPIENT;
}

function buildEmailBody(pedido: PedidoRow): string {
  return [
    `Nome: ${pedido.nome}`,
    `E-mail: ${pedido.email}`,
    `CPF: ${pedido.cpf}`,
    `Telefone: ${pedido.telefone}`,
    `Associado: ${pedido.is_associado}`,
    `Cupom: ${pedido.cupom_codigo ?? "-"}`,
    `Valor cobrado: ${pedido.valor_cobrado}`,
    `Forma de pagamento: ${pedido.payment_method ?? "-"}`,
  ].join("\n");
}

/**
 * Delivers a paid-order alert to the admissions team by email via Resend.
 * Separate from `sendOrderConfirmationEmail` (which reaches the buyer): this
 * email never reaches the visitor, it only tells ABVCAP staff a paid
 * enrollment came in.
 */
export async function sendOrderNotificationEmail(
  pedido: PedidoRow,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [getRecipient()],
    subject: "Nova matrícula paga — Curso Modelagem Financeira e Valuation ABVCAP",
    text: buildEmailBody(pedido),
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
