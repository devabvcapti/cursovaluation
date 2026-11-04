import type { MpPaymentStatus } from "@/lib/mercadopago-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { TABLE_PEDIDOS } from "@/lib/supabase/table-names";
import { incrementCupomUso } from "@/lib/cupons";
import { sendOrderConfirmationEmail } from "@/lib/send-order-confirmation-email";
import { sendOrderNotificationEmail } from "@/lib/send-order-notification-email";
import type { PedidoRow, PedidoStatus } from "@/lib/supabase/types";

/**
 * Maps a raw Mercado Pago payment status to our `pedidos.status` value. Our
 * schema has no "in_process" member, and MP's "pending" (what a fresh Pix
 * charge returns) already equals ours, so both unsettled states collapse to
 * "pending". Anything we don't model (e.g. "refunded", "charged_back") maps
 * to `null`, meaning "don't touch the row".
 */
export function mapMpStatusToPedidoStatus(rawStatus: MpPaymentStatus | string): PedidoStatus | null {
  switch (rawStatus) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}

function logEmailOutcome(
  label: string,
  outcome: PromiseSettledResult<{ ok: true } | { ok: false; reason: string }>,
): void {
  if (outcome.status === "rejected") {
    console.error(`[apply-payment-status] ${label} email threw:`, outcome.reason);
  } else if (!outcome.value.ok) {
    console.error(`[apply-payment-status] ${label} email failed:`, outcome.value.reason);
  }
}

export interface ApplyPedidoStatusResult {
  /** True only when THIS call moved the row into "approved" (side effects fired). */
  transitioned: boolean;
  /**
   * The status the row is known to hold after this call, or `null` when it's
   * unknown (the conditional write errored or lost a race to another writer).
   */
  finalStatus: PedidoStatus | null;
}

/**
 * The single place a Mercado Pago payment status is written to a pedido —
 * used by both `/api/checkout/pagamento` (synchronous result, e.g. a card
 * approved instantly) and the Mercado Pago webhook (asynchronous result,
 * e.g. a Pix paid later). Whichever of the two gets there first performs the
 * transition and fires the side effects; the other sees no change.
 *
 * - The write is conditioned on the row still holding the status we read
 *   (`.eq("status", pedido.status)`), and the affected-row count is checked:
 *   zero rows means a concurrent writer already moved it (lost race), so we
 *   skip side effects. A write error also skips side effects (and is logged)
 *   so we never email / increment a coupon against an unconfirmed DB state.
 * - An "approved" row is never moved to another status: once money is in,
 *   a late/out-of-order notification must not downgrade it.
 * - `extraFields` (e.g. `mp_payment_id`, `payment_method`) are written in the
 *   same conditional update. If the status is unchanged and there are no
 *   extra fields, nothing is written at all (idempotent redelivery).
 * - Only on a genuine transition INTO "approved": `incrementCupomUso` (when
 *   the pedido used a cupom) and both order emails. Failures there are logged,
 *   never thrown — the payment itself already succeeded.
 */
export async function applyPedidoStatus(
  pedido: PedidoRow,
  rawStatus: MpPaymentStatus,
  extraFields: Partial<Pick<PedidoRow, "mp_payment_id" | "payment_method">> = {},
): Promise<ApplyPedidoStatusResult> {
  const nextStatus = mapMpStatusToPedidoStatus(rawStatus);

  if (nextStatus === null) {
    console.warn("[apply-payment-status] ignoring unmodelled Mercado Pago status:", rawStatus, pedido.id);
    return { transitioned: false, finalStatus: pedido.status };
  }

  if (pedido.status === "approved" && nextStatus !== "approved") {
    console.warn(
      "[apply-payment-status] refusing to move an approved pedido to",
      nextStatus,
      pedido.id,
    );
    return { transitioned: false, finalStatus: "approved" };
  }

  const hasExtraFields = Object.keys(extraFields).length > 0;
  if (pedido.status === nextStatus && !hasExtraFields) {
    // Idempotent no-op: nothing changed, so no write, no side effects.
    return { transitioned: false, finalStatus: nextStatus };
  }

  const { data: updatedRows, error: updateError } = await getSupabaseServiceClient()
    .from(TABLE_PEDIDOS)
    .update({ status: nextStatus, ...extraFields })
    .eq("id", pedido.id)
    .eq("status", pedido.status)
    .select("id");

  if (updateError) {
    console.error("[apply-payment-status] failed to update pedido status:", updateError);
    return { transitioned: false, finalStatus: null };
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Lost the race: another writer moved the row between our read and write.
    return { transitioned: false, finalStatus: null };
  }

  const transitioned = nextStatus === "approved" && pedido.status !== "approved";

  if (transitioned) {
    if (pedido.cupom_codigo) {
      await incrementCupomUso(pedido.cupom_codigo);
    }

    // allSettled: a thrown error (not just an `{ ok: false }` result) from
    // either sender must not surface to the caller — the charge already
    // went through, so the buyer must still see "approved".
    const [confirmation, notification] = await Promise.allSettled([
      sendOrderConfirmationEmail(pedido),
      sendOrderNotificationEmail(pedido),
    ]);

    logEmailOutcome("order confirmation", confirmation);
    logEmailOutcome("order notification", notification);
  }

  return { transitioned, finalStatus: nextStatus };
}
