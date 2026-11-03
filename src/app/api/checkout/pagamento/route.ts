import { NextResponse } from "next/server";
import { createMpPayment } from "@/lib/mercadopago-client";
import { applyPedidoStatus } from "@/lib/apply-payment-status";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { PedidoRow } from "@/lib/supabase/types";

/**
 * Charges a previously-created pedido via Mercado Pago. The frontend
 * (Task 16's Payment Brick) submits its onSubmit formData here;
 * `createMpPayment` forwards only its payment-method fields (token, method,
 * installments, issuer) — amount, payer and external_reference always come
 * from the pedido row, never from the browser.
 *
 * The resulting status is written through `applyPedidoStatus` — the same
 * helper the Mercado Pago webhook uses — so a card approved synchronously
 * here fires the confirmation/notification emails and the cupom increment
 * right away, and a later webhook for the same payment is a no-op.
 *
 * The JSON response reports the RAW Mercado Pago status (e.g. "pending" or
 * "in_process" for an unpaid Pix), because the frontend switches on it to
 * render the Pix QR/waiting UI; the DB stores the mapped `PedidoStatus`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { nome: "Payload inválido." } },
      { status: 400 },
    );
  }

  const { pedidoId, formData, paymentMethodId } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json(
      { errors: { nome: "Pedido não encontrado." } },
      { status: 404 },
    );
  }

  const client = getSupabaseServiceClient();

  const { data: pedido, error: fetchError } = await client
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .maybeSingle();

  if (fetchError || !pedido) {
    return NextResponse.json(
      { errors: { nome: "Pedido não encontrado." } },
      { status: 404 },
    );
  }

  const pedidoRow = pedido as PedidoRow;

  // Double-payment guard: an already-paid pedido is never charged again.
  // Responding "approved" lets the frontend simply show the confirmation.
  if (pedidoRow.status === "approved") {
    return NextResponse.json({ status: "approved" }, { status: 200 });
  }

  const result = await createMpPayment({
    pedidoId,
    transactionAmount: pedidoRow.valor_cobrado,
    payer: {
      email: pedidoRow.email,
      firstName: pedidoRow.nome.split(" ")[0],
      identificationNumber: pedidoRow.cpf,
    },
    formData:
      formData && typeof formData === "object" ? (formData as Record<string, unknown>) : {},
  });

  if (!result.ok) {
    return NextResponse.json(
      { errors: { nome: "Não foi possível processar o pagamento agora." } },
      { status: 502 },
    );
  }

  const applied = await applyPedidoStatus(pedidoRow, result.status, {
    mp_payment_id: result.mpPaymentId,
    payment_method: paymentMethodId === "pix" ? "pix" : "credit_card",
  });

  if (applied.finalStatus === null) {
    // The charge went through at Mercado Pago but our conditional write
    // failed or lost a race (e.g. the webhook got there first). The webhook
    // still reconciles the row (it falls back to external_reference), so we
    // log and still report the real payment outcome to the buyer.
    console.error(
      "[checkout/pagamento] pedido status write not confirmed for",
      pedidoId,
      "mp payment",
      result.mpPaymentId,
    );
  }

  return NextResponse.json(
    { status: result.status, pix: result.pix },
    { status: 200 },
  );
}
