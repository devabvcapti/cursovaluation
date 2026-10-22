import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { courseContent } from "@/content/curso";
import { formatInvestment } from "@/lib/format-investment";

export interface EmentaEmailPayload {
  name: string;
  email: string;
}

const FROM_ADDRESS = "ABVCAP <contato@resend.abvcap.com.br>";
const EMENTA_PATH = path.join(process.cwd(), "public", "docs", "ementa-valuation-abvcap.pdf");

// Pulls price/deadline/checkout straight from courseContent so this email
// never drifts out of sync with what the page itself promises.
function buildEmailBody(name: string): string {
  const { investment, hero } = courseContent;
  return [
    `Olá, ${name}!`,
    "",
    "Aqui está, como prometido: a ementa completa do curso de Valuation da ABVCAP.",
    "",
    "A maioria dos cursos de valuation do mercado termina no número. Este começa nele — você sai sabendo construir o modelo financeiro inteiro, do zero, e também montar o deal: calcular TIR e MOIC, decompor de onde vem o retorno e defender uma recomendação de investimento diante de um comitê.",
    "",
    "O que você leva:",
    "- Um modelo completo, construído com as próprias mãos, a partir de uma companhia aberta real",
    "- A estrutura de um deal de Private Equity, incluindo a alavancagem \"à brasileira\" (seller's finance)",
    "- IA aplicada à análise — só depois de você já dominar o trabalho na unha",
    `- Turma pequena (${investment.seatsLimit}), formato presencial, com a chancela institucional da ABVCAP`,
    "",
    `Condição de inscrição antecipada: ${formatInvestment(investment.earlyBirdPrice)} (de ${formatInvestment(investment.price)}) até ${investment.earlyBirdDeadline}.`,
    "",
    `Garanta sua vaga: ${hero.checkoutUrl}`,
    "",
    "Qualquer dúvida, é só responder este e-mail.",
    "",
    "ABVCAP — Aprenda com quem faz.",
  ].join("\n");
}

/**
 * Delivers the course syllabus (ementa) PDF to the lead's own email —
 * this is what "Baixar ementa completa" actually promises. Separate from
 * `sendLeadNotification` (which only tells the admissions team a lead came
 * in): that email never reaches the visitor, so without this, nothing is
 * ever sent to the person who asked for it.
 */
export async function sendEmentaEmail(
  lead: EmentaEmailPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY is not configured" };
  }

  let pdf: Buffer;
  try {
    pdf = await readFile(EMENTA_PATH);
  } catch (error) {
    return { ok: false, reason: `Could not read ementa PDF: ${(error as Error).message}` };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [lead.email],
    subject: "Sua ementa chegou — e a próxima turma de Valuation está com inscrições abertas",
    text: buildEmailBody(lead.name),
    attachments: [
      {
        filename: "Ementa - Curso de Valuation ABVCAP.pdf",
        content: pdf,
      },
    ],
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
