import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";

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

  // TODO(lead-delivery): wire a real integration (email/CRM/sheet) here —
  // decision deferred by product owner on 2026-10-19. Until then, leads are
  // only logged here (visible in server logs); nothing currently reaches the
  // admissions team, so this gap must be closed before launch.
  console.log("[lead] received lead, delivery integration pending:", {
    name,
    email,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
