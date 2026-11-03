import { NextResponse } from "next/server";
import { createMpPayment } from "@/lib/mercadopago-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { PedidoRow } from "@/lib/supabase/types";

/**
 * Charges a previously-created pedido via Mercado Pago. The frontend
 * (Task 16's Payment Brick) submits its onSubmit formData here, which is
 * forwarded to `createMpPayment` as-is.
 *
 * Status handling is intentionally two-faced: our `pedidos.status` column
 * only allows "pending" | "approved" | "rejected" | "cancelled" — there is
 * no "in_process" member — so a Pix charge that comes back "in_process" is
 * stored as "pending". The JSON response returned to the caller, however,
 * always reports the RAW Mercado Pago status, because the frontend needs to
 * see "in_process" specifically to know to render the Pix QR/waiting UI.
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

  const result = await createMpPayment({
    pedidoId,
    transactionAmount: pedidoRow.valor_cobrado,
    payer: {
      email: pedidoRow.email,
      firstName: pedidoRow.nome.split(" ")[0],
      identificationNumber: pedidoRow.cpf,
    },
    formData: (formData ?? {}) as Record<string, unknown>,
  });

  if (!result.ok) {
    return NextResponse.json(
      { errors: { nome: "Não foi possível processar o pagamento agora." } },
      { status: 502 },
    );
  }

  // DB-safe status: our schema has no "in_process", so an unsettled Pix
  // charge is still just "pending" from our side.
  const pedidoStatus = result.status === "in_process" ? "pending" : result.status;

  await client
    .from("pedidos")
    .update({
      mp_payment_id: result.mpPaymentId,
      status: pedidoStatus,
      payment_method: paymentMethodId === "pix" ? "pix" : "credit_card",
    })
    .eq("id", pedidoId);

  // Raw, unmapped status — the frontend distinguishes "in_process" from
  // "approved" to decide whether to show the Pix-waiting UI.
  return NextResponse.json(
    { status: result.status, pix: result.pix },
    { status: 200 },
  );
}
