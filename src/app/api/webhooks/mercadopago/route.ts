import { NextResponse } from "next/server";
import { verifyMpWebhookSignature } from "@/lib/verify-mp-webhook-signature";
import { getMpPayment } from "@/lib/mercadopago-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { incrementCupomUso } from "@/lib/cupons";
import { sendOrderConfirmationEmail } from "@/lib/send-order-confirmation-email";
import { sendOrderNotificationEmail } from "@/lib/send-order-notification-email";
import type { PedidoRow, PedidoStatus } from "@/lib/supabase/types";

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
 * Mercado Pago delivers webhooks at-least-once, so the same `data.id` can
 * arrive multiple times for the same payment. The idempotency guard below
 * compares the row's CURRENT status to the NEWLY MAPPED status (mapping
 * "in_process" -> "pending", since `pedidos.status` has no "in_process"
 * member — same mapping as the /api/checkout/pagamento route). If they're
 * already equal, we return 200 without touching the row, incrementing any
 * coupon, or sending any email. Side effects (coupon increment + both
 * emails) only fire on an actual transition INTO "approved", never merely
 * because the row happens to already be "approved".
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

  if (fetchError || !pedido) {
    console.warn("[webhooks/mercadopago] no pedidos row for mp_payment_id:", dataId);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const pedidoRow = pedido as PedidoRow;

  // DB-safe status: our schema has no "in_process", so an unsettled Pix
  // charge maps to "pending" — matching what /api/checkout/pagamento stores.
  const nextStatus: PedidoStatus =
    paymentResult.status === "in_process" ? "pending" : paymentResult.status;

  if (pedidoRow.status === nextStatus) {
    // Idempotency guard: nothing changed, so no update, no coupon
    // increment, no emails — this is also what makes a redelivered
    // "in_process" notification against an already-"pending" row a no-op.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await client.from("pedidos").update({ status: nextStatus }).eq("id", pedidoRow.id);

  if (nextStatus === "approved") {
    if (pedidoRow.cupom_codigo) {
      await incrementCupomUso(pedidoRow.cupom_codigo);
    }

    const [confirmation, notification] = await Promise.all([
      sendOrderConfirmationEmail(pedidoRow),
      sendOrderNotificationEmail(pedidoRow),
    ]);

    if (!confirmation.ok) {
      console.error("[webhooks/mercadopago] order confirmation email failed:", confirmation.reason);
    }
    if (!notification.ok) {
      console.error("[webhooks/mercadopago] order notification email failed:", notification.reason);
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
