import { NextResponse } from "next/server";
import { validateCheckoutStep1 } from "@/lib/validate-checkout";
import { sendLeadNotification } from "@/lib/send-lead-notification";

/**
 * Partial-lead capture for the checkout form's first screen (nome + e-mail),
 * called the moment the visitor advances to the second screen — so a
 * nome/e-mail is on record with the admissions team even if they abandon
 * before finishing cpf/telefone/pagamento. Unlike `POST /api/lead` (the
 * "Baixar ementa" CTA), this never sends the ementa PDF: the visitor is
 * already mid-checkout, not asking for course material.
 *
 * `CheckoutForm` calls this fire-and-forget — a failure here is logged
 * server-side but never blocks the visitor from reaching the second screen.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errors: { nome: "Payload inválido." } }, { status: 400 });
  }

  const { nome: rawNome, email: rawEmail } = (body ?? {}) as { nome?: unknown; email?: unknown };
  const nome = typeof rawNome === "string" ? rawNome : "";
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const result = validateCheckoutStep1({ nome, email });

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const notification = await sendLeadNotification({ name: nome, email, origem: "checkout" });

  if (!notification.ok) {
    console.error("[checkout/lead] admissions notification failed:", notification.reason);
    return NextResponse.json(
      { errors: { nome: "Não foi possível registrar o lead agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
