import { Resend } from "resend";

/**
 * Where the lead came from — drives the subject tag and body line so
 * admissions can tell the two apart at a glance in their inbox: `"ementa"`
 * is the "Baixar ementa completa" CTA (someone just wants course material),
 * `"checkout"` is the checkout form's first screen (someone is actually
 * mid-purchase). Defaults to `"ementa"` so existing callers that don't pass
 * it keep behaving exactly as before.
 */
export type LeadOrigem = "ementa" | "checkout";

export interface LeadNotificationPayload {
  name: string;
  email: string;
  origem?: LeadOrigem;
}

const FROM_ADDRESS = "ABVCAP Leads <contato@resend.abvcap.com.br>";
const DEFAULT_RECIPIENT = "ti@abvcap.com.br";

// Same permissive pattern as `validate-lead.ts`'s EMAIL_PATTERN.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ORIGEM_CONFIG: Record<LeadOrigem, { tag: string; label: string; subject: string }> = {
  ementa: {
    tag: "LEAD",
    label: "Ementa (baixou o material, ainda não iniciou a compra)",
    subject: "Novo lead — Curso Modelagem Financeira e Valuation ABVCAP",
  },
  checkout: {
    tag: "COMPRAS",
    label: "Checkout (iniciou a inscrição/compra)",
    subject: "Novo lead no checkout — Curso Modelagem Financeira e Valuation ABVCAP",
  },
};

/**
 * Falls back to the default recipient for anything that isn't a single,
 * well-formed address — a malformed `LEAD_NOTIFICATION_EMAIL` (stray
 * quotes/whitespace, multiple comma-separated addresses, etc.) would
 * otherwise make Resend reject the whole send with "Invalid `to` field",
 * silently dropping every lead notification instead of just misrouting one.
 */
function getRecipient(): string {
  const configured = process.env.LEAD_NOTIFICATION_EMAIL?.trim();
  return configured && EMAIL_PATTERN.test(configured) ? configured : DEFAULT_RECIPIENT;
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
  const { tag, label, subject } = ORIGEM_CONFIG[lead.origem ?? "ementa"];

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [getRecipient()],
    subject: `[${tag}] ${subject}`,
    text: [
      `Nome: ${lead.name}`,
      `E-mail: ${lead.email}`,
      `Origem: ${label}`,
      `Recebido em: ${new Date().toISOString()}`,
    ].join("\n"),
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
