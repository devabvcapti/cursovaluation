import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";
import { sendLeadNotification } from "@/lib/send-lead-notification";

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

  const delivery = await sendLeadNotification({ name, email });
  if (!delivery.ok) {
    console.error("[lead] notification delivery failed:", delivery.reason);
    return NextResponse.json(
      { errors: { name: "Não foi possível enviar seus dados agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
