import { MercadoPagoConfig, Payment } from "mercadopago";

export type MpPaymentStatus = "approved" | "in_process" | "rejected" | "cancelled";

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
  formData: Record<string, unknown>; // the Payment Brick's onSubmit formData, forwarded as-is
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
        transaction_amount: input.transactionAmount,
        external_reference: input.pedidoId,
        payer: {
          email: input.payer.email,
          first_name: input.payer.firstName,
          identification: { type: "CPF", number: input.payer.identificationNumber },
        },
        ...input.formData,
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
): Promise<{ ok: true; status: MpPaymentStatus } | { ok: false; reason: string }> {
  const payment = buildPaymentClient();
  if (!payment) {
    return { ok: false, reason: "MERCADOPAGO_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await payment.get({ id: mpPaymentId });
    return { ok: true, status: response.status as MpPaymentStatus };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
