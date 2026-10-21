import { Resend } from "resend";

export interface LeadNotificationPayload {
  name: string;
  email: string;
}

const FROM_ADDRESS = "ABVCAP Leads <onboarding@resend.dev>";
const DEFAULT_RECIPIENT = "ti@abvcap.com.br";

function getRecipient(): string {
  return process.env.LEAD_NOTIFICATION_EMAIL || DEFAULT_RECIPIENT;
}

/**
 * Delivers a captured lead to the admissions team by email via Resend.
 * Returns `{ ok: false }` on any send failure so the caller can surface a
 * retry-able error to the visitor instead of silently dropping the lead.
 */
export async function sendLeadNotification(
  lead: LeadNotificationPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [getRecipient()],
    subject: "Novo lead — Curso Valuation ABVCAP",
    text: `Nome: ${lead.name}\nE-mail: ${lead.email}\nRecebido em: ${new Date().toISOString()}`,
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
