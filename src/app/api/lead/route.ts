import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";
import { sendLeadNotification } from "@/lib/send-lead-notification";
import { sendEmentaEmail } from "@/lib/send-ementa-email";

/**
 * Lead capture endpoint for the secondary CTA ("Baixar ementa completa").
 * Re-runs `validateLead` server-side — `LeadCaptureForm`'s client-side
 * validation is a UX convenience, not the trust boundary, so a payload sent
 * directly to this route (bypassing the form) is validated here too.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { name: "Payload inválido." } },
      { status: 400 },
    );
  }

  const { name: rawName, email: rawEmail } = (body ?? {}) as { name?: unknown; email?: unknown };
  const name = typeof rawName === "string" ? rawName : "";
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const result = validateLead({ name, email });

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const [notification, ementa] = await Promise.all([
    sendLeadNotification({ name, email }),
    sendEmentaEmail({ name, email }),
  ]);

  if (!notification.ok) {
    console.error("[lead] admissions notification failed:", notification.reason);
  }
  if (!ementa.ok) {
    console.error("[lead] ementa email failed:", ementa.reason);
  }

  // The visitor explicitly asked to receive the ementa — that's the one
  // delivery that must succeed for this request to count as successful.
  // The admissions notification failing is logged but doesn't block them.
  if (!ementa.ok) {
    return NextResponse.json(
      { errors: { name: "Não foi possível enviar seus dados agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
