import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

export interface EmentaEmailPayload {
  name: string;
  email: string;
}

const FROM_ADDRESS = "ABVCAP <contato@resend.abvcap.com.br>";
const EMENTA_PATH = path.join(process.cwd(), "public", "docs", "ementa-valuation-abvcap.pdf");

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
    subject: "Ementa completa — Curso de Valuation ABVCAP",
    text: `Olá, ${lead.name}!\n\nSegue em anexo a ementa completa do curso de Valuation da ABVCAP.\n\nQualquer dúvida, é só responder este e-mail.\n\nABVCAP — Aprenda com quem faz.`,
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
