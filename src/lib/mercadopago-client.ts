import { MercadoPagoConfig, Payment } from "mercadopago";

/**
 * Mercado Pago payment statuses we act on. `"pending"` is what a freshly
 * created Pix charge actually comes back with (`status_detail:
 * "pending_waiting_transfer"`); `"in_process"` is MP's "under review" state
 * (e.g. a card in manual fraud review). Both mean "not settled yet".
 */
export type MpPaymentStatus = "approved" | "pending" | "in_process" | "rejected" | "cancelled";

export interface MpPaymentResult {
  ok: true;
  mpPaymentId: string;
  status: MpPaymentStatus;
  pix?: { qrCode: string; qrCodeBase64: string };
}

export interface CreatePaymentInput {
  pedidoId: string;
  transactionAmount: number;
  payer: { email: string; firstName: string; identificationNumber: string };
  formData: Record<string, unknown>; // the Payment Brick's onSubmit formData (browser-controlled)
}

/**
 * The only Payment Brick formData fields we forward to Mercado Pago: the
 * payment-method mechanics (card token, method, installments, issuer). The
 * Brick's formData also carries `transaction_amount`/`payer`, but that object
 * originates in the browser, so anything amount- or identity-related is
 * always taken from the server's own typed parameters instead.
 */
const FORWARDED_FORM_DATA_FIELDS = ["token", "payment_method_id", "installments", "issuer_id"] as const;

function pickPaymentMethodFields(formData: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const field of FORWARDED_FORM_DATA_FIELDS) {
    if (formData[field] !== undefined && formData[field] !== null) {
      picked[field] = formData[field];
    }
  }
  return picked;
}

function buildPaymentClient(): Payment | null {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  const config = new MercadoPagoConfig({ accessToken });
  return new Payment(config);
}

export async function createMpPayment(
  input: CreatePaymentInput,
): Promise<MpPaymentResult | { ok: false; reason: string }> {
  const payment = buildPaymentClient();
  if (!payment) {
    return { ok: false, reason: "MERCADOPAGO_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await payment.create({
      body: {
        // Allow-listed Brick fields first, authoritative fields last, so even
        // if the allow-list ever grew a conflicting key, ours still win.
        ...pickPaymentMethodFields(input.formData ?? {}),
        transaction_amount: input.transactionAmount,
        external_reference: input.pedidoId,
        payer: {
          email: input.payer.email,
          first_name: input.payer.firstName,
          identification: { type: "CPF", number: input.payer.identificationNumber },
        },
      },
    });

    const result: MpPaymentResult = {
      ok: true,
      mpPaymentId: String(response.id),
      status: response.status as MpPaymentStatus,
    };

    const transactionData = response.point_of_interaction?.transaction_data;
    if (transactionData) {
      result.pix = {
        qrCode: transactionData.qr_code ?? "",
        qrCodeBase64: transactionData.qr_code_base64 ?? "",
      };
    }

    return result;
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function getMpPayment(
  mpPaymentId: string,
): Promise<
  | { ok: true; status: MpPaymentStatus; externalReference: string | null }
  | { ok: false; reason: string }
> {
  const payment = buildPaymentClient();
  if (!payment) {
    return { ok: false, reason: "MERCADOPAGO_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await payment.get({ id: mpPaymentId });
    return {
      ok: true,
      status: response.status as MpPaymentStatus,
      externalReference: response.external_reference ? String(response.external_reference) : null,
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
