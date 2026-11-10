"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, CreditCard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const CARD_CLASSES = "rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8";

type StatusTone = "success" | "info" | "warning" | "error";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  success: "text-brand-green",
  info: "text-sky-300",
  warning: "text-amber-300",
  error: "text-red-300",
};

/** A dark card matching `CheckoutForm`'s styling, for a single status message with its icon. */
function StatusCard({
  icon: Icon,
  tone,
  role,
  children,
}: {
  icon: LucideIcon;
  tone: StatusTone;
  role: "status" | "alert";
  children: ReactNode;
}) {
  return (
    <div className={cn(CARD_CLASSES, "flex items-start gap-3")}>
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", STATUS_TONE_CLASSES[tone])} aria-hidden="true" />
      <p role={role} className="font-body text-sm text-white/80">
        {children}
      </p>
    </div>
  );
}

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

// Raw Mercado Pago status, as relayed by /api/checkout/pagamento. A real,
// freshly created Pix charge comes back "pending" (status_detail
// "pending_waiting_transfer"); "in_process" is also treated as unsettled.
type PagamentoResponse = {
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled";
  pix?: PixPayload;
};

type StepStatus =
  | "idle"
  | "submitting"
  | "approved"
  | "pix_waiting"
  | "pix_timeout"
  | "under_review"
  | "rejected"
  | "error";

const POLL_INTERVAL_MS = 3000;
// Give up after ~8 minutes of polling a Pix that hasn't settled (abandoned or
// slow payment) instead of polling forever. The webhook still records a late
// payment and the buyer still gets the confirmation email.
const MAX_POLL_ATTEMPTS = 160;

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
 * - `"approved"` shows a confirmation message and unmounts the Brick.
 * - `"pending"` or `"in_process"` with a `pix` payload renders the Pix QR
 *   code, unmounts the Brick (no second charge while a Pix is outstanding),
 *   and polls `GET /api/checkout/pedido/:id` (Task 12) every few seconds
 *   until the pedido settles, then shows the final outcome. Polling gives up
 *   after `MAX_POLL_ATTEMPTS` with a "try again later" message, and always
 *   stops on unmount.
 * - `"rejected"` shows a retry message while leaving the Brick mounted, so
 *   the buyer can immediately try another card without losing their place.
 * - A submission while another is in flight (or after approval / while a
 *   Pix is pending) is ignored.
 */
export function PaymentStep({ pedidoId, valorCobrado, email }: PaymentStepProps) {
  const [status, setStatus] = useState<StepStatus>("idle");
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);
  // Synchronous guard (state updates are async) against a second real
  // submission: set on submit, released only when retrying is legitimate.
  const submitLockRef = useRef(false);

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
    pollAttemptsRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;
      const attempt = pollAttemptsRef.current;
      let settled: string | null = null;

      try {
        const response = await fetch(`/api/checkout/pedido/${pedidoId}`);
        if (response.ok) {
          const body = (await response.json()) as { status: string };
          if (body.status !== "pending" && body.status !== "in_process") {
            settled = body.status;
          }
        }
      } catch {
        // Transient network error: counts as an attempt, try again next tick.
      }

      if (pollRef.current === null) {
        return; // stopped (unmount / already settled) while awaiting
      }

      if (settled !== null) {
        stopPolling();
        if (settled === "approved") {
          setStatus("approved");
        } else {
          // Pix expired/cancelled/rejected: allow a fresh attempt.
          submitLockRef.current = false;
          setPix(null);
          setStatus("rejected");
        }
        return;
      }

      if (attempt >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStatus("pix_timeout");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit(data: PaymentSubmitData) {
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
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
        submitLockRef.current = false;
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

      if ((body.status === "pending" || body.status === "in_process") && body.pix) {
        setPix(body.pix);
        setStatus("pix_waiting");
        startPolling();
        return;
      }

      if (body.status === "pending" || body.status === "in_process") {
        // Unsettled without a Pix payload (e.g. a card held for review): not
        // a decline, and offering the Brick again would risk a double charge.
        setPix(null);
        setStatus("under_review");
        return;
      }

      submitLockRef.current = false;
      setPix(null);
      setStatus("rejected");
    } catch {
      submitLockRef.current = false;
      setStatus("error");
      setErrorMessage("Não foi possível processar o pagamento agora. Tente novamente.");
    }
  }

  // The Brick is only offered while a (re)try is legitimate: never after
  // approval, and never while a Pix for this pedido is outstanding.
  const showBrick =
    status !== "approved" &&
    status !== "pix_waiting" &&
    status !== "pix_timeout" &&
    status !== "under_review";

  function handleError(error: BrickError) {
    console.error("[PaymentStep] Payment Brick error:", error);
    setStatus("error");
    setErrorMessage("Ocorreu um erro ao carregar o formulário de pagamento. Tente novamente.");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {showBrick ? (
        <div className={CARD_CLASSES}>
          <h2 className="mb-6 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-[0.08em] text-white">
            <CreditCard className="h-4 w-4 text-brand-green" aria-hidden="true" />
            Pagamento
          </h2>
          <Payment
            initialization={{ amount: valorCobrado, payer: { email } }}
            customization={{
              paymentMethods: { creditCard: "all", bankTransfer: "all" },
              visual: { style: { theme: "dark" } },
            }}
            onSubmit={handleSubmit}
            onError={handleError}
          />
        </div>
      ) : null}

      {status === "approved" ? (
        <StatusCard icon={CheckCircle2} tone="success" role="status">
          Pagamento aprovado! Você receberá um e-mail de confirmação em instantes.
        </StatusCard>
      ) : null}

      {(status === "pix_waiting" || status === "pix_timeout") && pix ? (
        <div className={CARD_CLASSES}>
          {status === "pix_waiting" ? (
            <p role="status" className="flex items-start gap-3 font-body text-sm text-white/80">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-300" aria-hidden="true" />
              Pagamento via Pix em processamento. Escaneie o QR code abaixo para concluir.
            </p>
          ) : (
            <p role="alert" className="flex items-start gap-3 font-body text-sm text-amber-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              Ainda não recebemos a confirmação do pagamento. Tente novamente mais tarde — se você
              já pagou o Pix, a confirmação chegará por e-mail.
            </p>
          )}
          <div className="mt-5 flex justify-center">
            <div className="rounded-xl bg-white p-4">
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR code para pagamento via Pix"
                className="h-48 w-48"
              />
            </div>
          </div>
        </div>
      ) : null}

      {status === "under_review" ? (
        <StatusCard icon={Clock} tone="info" role="status">
          Seu pagamento está em análise pelo Mercado Pago. Você receberá a confirmação por e-mail
          assim que ele for aprovado.
        </StatusCard>
      ) : null}

      {status === "rejected" ? (
        <StatusCard icon={XCircle} tone="error" role="alert">
          Pagamento recusado. Verifique os dados e tente novamente com outro cartão ou forma de
          pagamento.
        </StatusCard>
      ) : null}

      {status === "error" && errorMessage ? (
        <StatusCard icon={AlertTriangle} tone="error" role="alert">
          {errorMessage}
        </StatusCard>
      ) : null}
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
