import { Resend } from "resend";
import { courseContent } from "@/content/curso";
import { formatInvestment } from "@/lib/format-investment";
import type { PedidoRow } from "@/lib/supabase/types";

const FROM_ADDRESS = "ABVCAP <contato@resend.abvcap.com.br>";

function buildEmailBody(pedido: PedidoRow): string {
  const { investment } = courseContent;
  return [
    `Olá, ${pedido.nome}!`,
    "",
    "Sua matrícula no Curso de Modelagem Financeira e Valuation da ABVCAP está confirmada.",
    "",
    `Valor pago: ${formatInvestment(String(pedido.valor_cobrado))}.`,
    `Próxima turma: ${investment.nextCohortDate}.`,
    "",
    "Em breve você receberá mais informações sobre o curso por e-mail.",
    "",
    "Qualquer dúvida, é só responder este e-mail.",
    "",
    "ABVCAP — Aprenda com quem faz.",
  ].join("\n");
}

/**
 * Confirms a completed paid enrollment to the buyer by email via Resend.
 * Separate from `sendOrderNotificationEmail` (which only tells the admissions
 * team a paid order came in): this is the message that actually reaches the
 * person who paid.
 */
export async function sendOrderConfirmationEmail(
  pedido: PedidoRow,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [pedido.email],
    subject: "Matrícula confirmada — Curso de Modelagem Financeira e Valuation ABVCAP",
    text: buildEmailBody(pedido),
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
