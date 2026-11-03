import { NextResponse } from "next/server";
import { verifyMpWebhookSignature } from "@/lib/verify-mp-webhook-signature";
import { getMpPayment } from "@/lib/mercadopago-client";
import { applyPedidoStatus } from "@/lib/apply-payment-status";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { PedidoRow } from "@/lib/supabase/types";

/**
 * Mercado Pago webhook — notifies us of payment status changes.
 *
 * Mercado Pago retries any non-2xx response, so this route always returns
 * `200` once the signature has been verified, even when something downstream
 * (an unknown payment, a failed Mercado Pago lookup, a missing pedidos row)
 * means there's nothing useful to do — a 500 here would just cause noisy,
 * tight-looped retries. The one deliberate exception is signature
 * verification: an invalid signature returns `401` so Mercado Pago treats it
 * as a rejection, not a transient failure to retry.
 *
 * The status write itself, its idempotency/race-safety (conditional update
 * on the status we read + affected-row check), and the side effects that
 * fire only on a genuine transition into "approved" (cupom increment + both
 * emails) all live in `applyPedidoStatus` — shared with
 * `/api/checkout/pagamento`, so whichever of the two sees the approval first
 * performs it exactly once.
 *
 * Row lookup: first by `mp_payment_id`. If nothing matches, fall back to the
 * payment's `external_reference` (our pedido id) — this covers a webhook that
 * beats pagamento's own write, and a payment whose `mp_payment_id` was
 * overwritten by a later attempt on the same pedido (e.g. the buyer generated
 * a Pix, then tried again, then paid the first Pix). A fallback match only
 * ever applies an "approved" status — a stale non-approved notification for a
 * superseded payment must not overwrite the status of the current attempt —
 * and records this payment's id on the row.
 */
export async function POST(request: Request) {
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { data } = (body ?? {}) as { data?: { id?: unknown } };
  const dataId = typeof data?.id === "string" ? data.id : String(data?.id ?? "");

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const signatureValid = verifyMpWebhookSignature({
    xSignature,
    xRequestId,
    dataId,
    secret,
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const paymentResult = await getMpPayment(dataId);
  if (!paymentResult.ok) {
    console.error("[webhooks/mercadopago] getMpPayment failed:", paymentResult.reason);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const client = getSupabaseServiceClient();
  const { data: pedido, error: fetchError } = await client
    .from("pedidos")
    .select("*")
    .eq("mp_payment_id", dataId)
    .maybeSingle();

  if (fetchError) {
    console.error("[webhooks/mercadopago] failed to look up pedido by mp_payment_id:", fetchError);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (pedido) {
    await applyPedidoStatus(pedido as PedidoRow, paymentResult.status);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Fallback: no row carries this mp_payment_id — match by external_reference.
  const externalReference = paymentResult.externalReference;
  if (!externalReference) {
    console.warn("[webhooks/mercadopago] no pedidos row for mp_payment_id:", dataId);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { data: fallbackPedido, error: fallbackError } = await client
    .from("pedidos")
    .select("*")
    .eq("id", externalReference)
    .maybeSingle();

  if (fallbackError || !fallbackPedido) {
    console.warn(
      "[webhooks/mercadopago] no pedidos row for mp_payment_id or external_reference:",
      dataId,
      externalReference,
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (paymentResult.status !== "approved") {
    console.warn(
      "[webhooks/mercadopago] ignoring non-approved status for a payment not recorded on its pedido:",
      dataId,
      paymentResult.status,
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const fallbackRow = fallbackPedido as PedidoRow;

  if (fallbackRow.status === "approved") {
    // The pedido was already paid by a DIFFERENT Mercado Pago payment, and now
    // this one was approved too — a real double payment that needs a manual
    // refund. Leave the row (and its recorded payment id) alone and flag it.
    console.error(
      "[webhooks/mercadopago] possible double payment: pedido already approved, extra approved payment:",
      fallbackRow.id,
      dataId,
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await applyPedidoStatus(fallbackRow, paymentResult.status, {
    mp_payment_id: dataId,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
