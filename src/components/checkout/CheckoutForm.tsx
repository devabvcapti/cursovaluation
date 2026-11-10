"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { EMAIL_PATTERN, validateCheckout, type CheckoutInput } from "@/lib/validate-checkout";
import { formatInvestment } from "@/lib/format-investment";
import { resolveBasePrice } from "@/lib/base-price";
import { cn } from "@/lib/cn";

export interface CheckoutFormProps {
  /** Called after the pedido is accepted by the server (200 response). */
  onPedidoCreated: (pedido: { pedidoId: string; valorCobrado: number; email: string }) => void;
  className?: string;
}

type FieldErrors = Partial<Record<"nome" | "email" | "cpf" | "telefone", string>>;

type SubmitStatus = "idle" | "submitting" | "error";

interface PricePreview {
  isAssociado: boolean;
  empresaAssociada?: string | null;
  cupomAplicado: string | null;
  percentualDesconto: number | null;
  valorBase: number;
  valorCobrado: number;
}

const PRICE_PREVIEW_DEBOUNCE_MS = 400;

const FIELD_CLASSES = cn(
  "mt-1 block w-full rounded-sm border px-4 py-2.5",
  "font-body text-base text-brand-navy placeholder:text-brand-navy/40",
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const FIELD_BORDER_CLASSES = "border-brand-navy/20 bg-white";
const FIELD_ERROR_BORDER_CLASSES = "border-red-600";

const LABEL_CLASSES = "font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy";

const ERROR_TEXT_CLASSES = "mt-1 font-body text-sm text-red-600";

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-2 inline-flex min-h-11 items-center justify-center rounded-md px-8 py-3.5",
  "bg-brand-green text-brand-navy border-2 border-brand-green",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

/**
 * Checkout step 1: collects nome/email/cpf/telefone (required) plus an
 * optional cupom, validates with `validateCheckout` before ever touching the
 * network (the server re-runs the same validation — see
 * `src/app/api/checkout/pedido/route.ts` — so this is a UX convenience, not
 * the trust boundary), and posts to `/api/checkout/pedido` only when the
 * payload is valid. There's no manual "Sou associado ABVCAP" toggle or CNPJ
 * field — membership is detected automatically from the email field: once it
 * looks like a complete address, it's checked (debounced) against the
 * GlueUp member-email export via `/api/checkout/preco`, and a match shows
 * "Membro ABVCAP — empresa" and switches the price to the associado value
 * with no action needed from the student. The cupom field drives that same
 * preview.
 *
 * The price itself is always visible, even before anything is typed: it
 * starts at the non-associado value (computed client-side via
 * `resolveBasePrice`, so it doesn't wait on a network round-trip) and only
 * the server-confirmed preview (email match and/or cupom) can raise it,
 * once resolved — alongside the discount percentage when a cupom applied.
 */
export function CheckoutForm({ onPedidoCreated, className }: CheckoutFormProps) {
  const uid = useId();
  const nomeId = `${uid}-checkout-nome`;
  const emailId = `${uid}-checkout-email`;
  const cpfId = `${uid}-checkout-cpf`;
  const telefoneId = `${uid}-checkout-telefone`;
  const cupomId = `${uid}-checkout-cupom`;
  const nomeErrorId = `${uid}-checkout-nome-error`;
  const emailErrorId = `${uid}-checkout-email-error`;
  const cpfErrorId = `${uid}-checkout-cpf-error`;
  const telefoneErrorId = `${uid}-checkout-telefone-error`;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cupom, setCupom] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [preview, setPreview] = useState<PricePreview | null>(null);
  // The cupom/email pair `preview` was actually fetched for. Rendering gates
  // on this matching the *current* `queryKey` (not just on `preview` being
  // non-null) so a resolved preview from an earlier, now-superseded
  // cupom/email pair can never be shown as if it were current — see the
  // `queryKey` comment below for why this matters.
  const [previewQueryKey, setPreviewQueryKey] = useState<string | null>(null);

  // True only for a genuine network/server failure after client validation
  // passed (errors were cleared right before the fetch attempt). A client
  // validation failure sets `errors` alongside `status === "error"`, so that
  // case is excluded here and keeps showing its own inline field errors.
  const isServerError = status === "error" && Object.keys(errors).length === 0;

  const trimmedCupom = cupom.trim();
  const trimmedEmail = email.trim();
  // Gates the email-based associado check on "looks like a complete email"
  // (not just non-blank) so this doesn't fire a preview request on every
  // keystroke of a still half-typed address.
  const isPlausibleEmail = EMAIL_PATTERN.test(trimmedEmail);
  const hasPreviewQuery = trimmedCupom !== "" || isPlausibleEmail;
  // Identifies "what cupom/email combination is the user currently asking
  // about", recomputed every render (no debounce). Comparing
  // `previewQueryKey` to this current value is what hides a stale preview
  // the instant the user edits cupom/email again, even though the *fetch*
  // for the new combination is still debounced and hasn't resolved yet
  // (reproduction: resolve a preview for email A, clear the field, start
  // typing email B — on B's very first keystroke this key changes, so A's
  // resolved price stops matching and is hidden immediately, instead of
  // flashing until B's fetch lands).
  const queryKey = `${trimmedCupom}::${isPlausibleEmail ? trimmedEmail.toLowerCase() : ""}`;

  // Debounced price preview: recomputed from cupom/email, so it never fires
  // on mount while both are still blank/incomplete (nothing has changed yet).
  useEffect(() => {
    if (!hasPreviewQuery) {
      return;
    }

    const fetchedForKey = queryKey;

    const timer = setTimeout(() => {
      fetch("/api/checkout/preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isPlausibleEmail ? email : undefined,
          cupom: trimmedCupom === "" ? undefined : cupom,
        }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: PricePreview | null) => {
          if (body) {
            setPreview(body);
            setPreviewQueryKey(fetchedForKey);
          }
        })
        .catch(() => {
          // Preview is a non-blocking convenience; a failure here doesn't
          // block the form, it just leaves the last known preview in place.
        });
    }, PRICE_PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [cupom, email, hasPreviewQuery, isPlausibleEmail, queryKey, trimmedCupom]);

  const showPreview = preview !== null && previewQueryKey === queryKey;
  const confirmedPreview = showPreview ? preview : null;

  // Instant, client-computed non-associado reference price, shown before any
  // server round-trip resolves. Once a server-confirmed preview is available
  // (email match and/or cupom resolved), it takes over as the authoritative
  // displayed value instead — that's the only way this can go up to the
  // associado price, since there's no manual toggle.
  //
  // Computed in an effect (not directly during render) because it reads the
  // current date (via `resolveBasePrice`'s early-bird check), and Next's
  // Cache Components prerendering rejects a Client Component reading
  // `new Date()` during the static render pass — this keeps that read
  // client/runtime-only, same as the [defer] fix it suggests.
  const [instantValor, setInstantValor] = useState<number | null>(null);
  useEffect(() => {
    setInstantValor(resolveBasePrice(false));
  }, []);

  const displayedValor = confirmedPreview ? confirmedPreview.valorCobrado : instantValor;
  const displayedPercentualDesconto = confirmedPreview?.cupomAplicado
    ? confirmedPreview.percentualDesconto
    : null;
  // A cupom was typed and the server resolved a preview for it, but that
  // preview came back without a discount applied — distinct from "still
  // typing"/"not resolved yet" (confirmedPreview null) or "no cupom typed".
  const cupomInvalido = confirmedPreview !== null && trimmedCupom !== "" && !confirmedPreview.cupomAplicado;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const checkoutInput: CheckoutInput = { nome, email, cpf, telefone, cupom };
    const result = validateCheckout(checkoutInput);
    if (!result.valid) {
      setErrors(result.errors);
      setStatus("error");
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/checkout/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, cpf, telefone, cupom }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const body = (await response.json()) as { pedidoId: string; valorCobrado: number };
      onPedidoCreated({ pedidoId: body.pedidoId, valorCobrado: body.valorCobrado, email });
    } catch {
      setStatus("error");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={cn("w-full max-w-md", className)}>
      <div>
        <label htmlFor={nomeId} className={LABEL_CLASSES}>
          Nome
        </label>
        <input
          id={nomeId}
          name="nome"
          type="text"
          autoComplete="name"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          className={cn(FIELD_CLASSES, errors.nome ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.nome)}
          aria-describedby={errors.nome ? nomeErrorId : undefined}
        />
        {errors.nome ? (
          <p id={nomeErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.nome}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={emailId} className={LABEL_CLASSES}>
          E-mail
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={cn(FIELD_CLASSES, errors.email ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? emailErrorId : undefined}
        />
        {errors.email ? (
          <p id={emailErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.email}
          </p>
        ) : null}
        {showPreview && preview?.empresaAssociada ? (
          <p className="mt-2 font-body text-sm text-brand-green">
            ✓ Membro ABVCAP — {preview.empresaAssociada}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={cpfId} className={LABEL_CLASSES}>
          CPF
        </label>
        <input
          id={cpfId}
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cpf}
          onChange={(event) => setCpf(event.target.value)}
          className={cn(FIELD_CLASSES, errors.cpf ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.cpf)}
          aria-describedby={errors.cpf ? cpfErrorId : undefined}
        />
        {errors.cpf ? (
          <p id={cpfErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.cpf}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={telefoneId} className={LABEL_CLASSES}>
          Telefone
        </label>
        <input
          id={telefoneId}
          name="telefone"
          type="tel"
          autoComplete="tel"
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          className={cn(FIELD_CLASSES, errors.telefone ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.telefone)}
          aria-describedby={errors.telefone ? telefoneErrorId : undefined}
        />
        {errors.telefone ? (
          <p id={telefoneErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.telefone}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={cupomId} className={LABEL_CLASSES}>
          Cupom (opcional)
        </label>
        <input
          id={cupomId}
          name="cupom"
          type="text"
          autoComplete="off"
          value={cupom}
          onChange={(event) => setCupom(event.target.value)}
          className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
        />
      </div>

      <div className="mt-5">
        {displayedValor !== null ? (
          <p className="font-body text-base font-semibold text-brand-navy">
            Valor: {formatInvestment(String(displayedValor))}
            {displayedPercentualDesconto !== null
              ? ` (${displayedPercentualDesconto}% de desconto aplicado)`
              : ""}
          </p>
        ) : null}
        {cupomInvalido ? (
          <p className="mt-2 font-body text-sm text-amber-600">
            Cupom inválido ou expirado — seguindo sem desconto.
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={status === "submitting"} className={SUBMIT_BUTTON_CLASSES}>
        Continuar para pagamento
      </button>

      {isServerError ? (
        <p className="mt-3 font-body text-sm text-red-600">
          Não foi possível enviar seus dados agora. Tente novamente.
        </p>
      ) : null}
    </form>
  );
}
