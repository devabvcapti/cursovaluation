"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

export interface PaymentStepProps {
  pedidoId: string;
  valorCobrado: number;
  email: string;
}

// Derived from the real `@mercadopago/sdk-react@1.0.7` Payment component's
// declared prop types (node_modules/@mercadopago/sdk-react/esm/bricks/payment/type.d.ts)
// instead of being hand-typed, so this stays correct if the SDK's brick
// surface changes. See this file's bottom comment for the one place the
// installed package's real API differs from the task brief's assumption.
type PaymentOnSubmit = ComponentProps<typeof Payment>["onSubmit"];
type PaymentSubmitData = Parameters<PaymentOnSubmit>[0];
type PaymentOnError = NonNullable<ComponentProps<typeof Payment>["onError"]>;
type BrickError = Parameters<PaymentOnError>[0];

interface PixPayload {
  qrCode: string;
  qrCodeBase64: string;
}

type PagamentoResponse = {
  status: "approved" | "in_process" | "rejected";
  pix?: PixPayload;
};

type StepStatus = "idle" | "submitting" | "approved" | "in_process" | "rejected" | "error";

const POLL_INTERVAL_MS = 3000;

// `initMercadoPago` is documented as a one-time setup call (it configures a
// module-level singleton inside the SDK) — it must run exactly once, not on
// every render/mount of this component, so it's called here at module scope
// rather than inside the component body or an effect.
initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, { locale: "pt-BR" });

/**
 * Checkout step 2: renders Mercado Pago's embedded Payment Brick (cards +
 * Pix/bank transfer) and forwards its `onSubmit` formData to
 * `POST /api/checkout/pagamento` (Task 10).
 *
 * - `"approved"` shows a confirmation message.
 * - `"in_process"` with a `pix` payload renders the Pix QR code and polls
 *   `GET /api/checkout/pedido/:id` (Task 12) every few seconds until the
 *   pedido settles (status no longer `"pending"`/`"in_process"`), then shows
 *   the final outcome. Polling always stops on unmount.
 * - `"rejected"` shows a retry message while leaving the Brick mounted, so
 *   the buyer can immediately try another card without losing their place.
 */
export function PaymentStep({ pedidoId, valorCobrado, email }: PaymentStepProps) {
  const [status, setStatus] = useState<StepStatus>("idle");
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Always clear any running poll when the component unmounts.
  useEffect(() => stopPolling, []);

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/checkout/pedido/${pedidoId}`);
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as { status: string };
        if (body.status === "pending" || body.status === "in_process") {
          return;
        }
        stopPolling();
        setStatus(body.status === "approved" ? "approved" : "rejected");
      } catch {
        // Transient network error: leave the interval running and try again
        // on the next tick rather than surfacing an error mid-poll.
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit(data: PaymentSubmitData) {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          formData: data.formData,
          paymentMethodId: data.formData.payment_method_id,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        setErrorMessage("Não foi possível processar o pagamento agora. Tente novamente.");
        return;
      }

      const body = (await response.json()) as PagamentoResponse;

      if (body.status === "approved") {
        setPix(null);
        setStatus("approved");
        return;
      }

      if (body.status === "in_process" && body.pix) {
        setPix(body.pix);
        setStatus("in_process");
        startPolling();
        return;
      }

      setPix(null);
      setStatus("rejected");
    } catch {
      setStatus("error");
      setErrorMessage("Não foi possível processar o pagamento agora. Tente novamente.");
    }
  }

  function handleError(error: BrickError) {
    console.error("[PaymentStep] Payment Brick error:", error);
    setStatus("error");
    setErrorMessage("Ocorreu um erro ao carregar o formulário de pagamento. Tente novamente.");
  }

  return (
    <div>
      <Payment
        initialization={{ amount: valorCobrado, payer: { email } }}
        customization={{ paymentMethods: { creditCard: "all", bankTransfer: "all" } }}
        onSubmit={handleSubmit}
        onError={handleError}
      />

      {status === "approved" ? (
        <p role="status">Pagamento aprovado! Você receberá um e-mail de confirmação em instantes.</p>
      ) : null}

      {status === "in_process" && pix ? (
        <div>
          <p role="status">
            Pagamento via Pix em processamento. Escaneie o QR code abaixo para concluir.
          </p>
          <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR code para pagamento via Pix" />
        </div>
      ) : null}

      {status === "rejected" ? (
        <p role="alert">
          Pagamento recusado. Verifique os dados e tente novamente com outro cartão ou forma de
          pagamento.
        </p>
      ) : null}

      {status === "error" && errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </div>
  );
}

// --- Real-SDK-vs-brief discrepancy note (Task 16) ---
// The task brief assumed `onSubmit: (args: { formData }) => Promise<void>`.
// The real installed `@mercadopago/sdk-react@1.0.7` types
// (esm/bricks/payment/type.d.ts) declare it as
// `onSubmit: (param: IPaymentFormData, param2?: IAdditionalCardFormData | null) => Promise<unknown>`,
// where `IPaymentFormData` is `{ paymentType, selectedPaymentMethod, formData, additionalData? }`
// — i.e. the callback's first argument has a `formData` property plus a
// couple of extra top-level fields we don't need, and takes an optional
// second argument we also don't need. Destructuring only `data.formData`
// (via the `PaymentSubmitData` type derived from the real component above)
// is compatible with both the real Brick and the brief's simplified test
// mock, so no behavior had to change — just a wider/stricter type than the
// brief wrote out. `initMercadoPago`, `Payment`'s `initialization`/
// `customization` shape, and the `pt-BR` locale all matched the brief's
// assumption exactly against the real `.d.ts` files.
