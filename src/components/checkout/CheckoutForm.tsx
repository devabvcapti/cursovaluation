"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { validateCheckout, type CheckoutInput } from "@/lib/validate-checkout";
import { formatInvestment } from "@/lib/format-investment";
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
  cupomAplicado: string | null;
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
 * optional cnpj/cupom, validates with `validateCheckout` before ever
 * touching the network (the server re-runs the same validation — see
 * `src/app/api/checkout/pedido/route.ts` — so this is a UX convenience, not
 * the trust boundary), and posts to `/api/checkout/pedido` only when the
 * payload is valid. The cnpj/cupom fields also drive a debounced price
 * preview against `/api/checkout/preco` so the user sees the resolved price
 * before submitting.
 */
export function CheckoutForm({ onPedidoCreated, className }: CheckoutFormProps) {
  const uid = useId();
  const nomeId = `${uid}-checkout-nome`;
  const emailId = `${uid}-checkout-email`;
  const cpfId = `${uid}-checkout-cpf`;
  const telefoneId = `${uid}-checkout-telefone`;
  const cnpjId = `${uid}-checkout-cnpj`;
  const cupomId = `${uid}-checkout-cupom`;
  const nomeErrorId = `${uid}-checkout-nome-error`;
  const emailErrorId = `${uid}-checkout-email-error`;
  const cpfErrorId = `${uid}-checkout-cpf-error`;
  const telefoneErrorId = `${uid}-checkout-telefone-error`;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cupom, setCupom] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [preview, setPreview] = useState<PricePreview | null>(null);

  // True only for a genuine network/server failure after client validation
  // passed (errors were cleared right before the fetch attempt). A client
  // validation failure sets `errors` alongside `status === "error"`, so that
  // case is excluded here and keeps showing its own inline field errors.
  const isServerError = status === "error" && Object.keys(errors).length === 0;

  const hasPreviewQuery = cnpj.trim() !== "" || cupom.trim() !== "";

  // Debounced price preview: recomputed from cnpj/cupom only, so it never
  // fires on mount while both are still blank (nothing has changed yet).
  // Clearing to blank doesn't reset `preview` synchronously here — the
  // render below gates on `hasPreviewQuery` instead, so there's no stale
  // preview flash and no setState-in-effect for the "nothing to fetch" case.
  useEffect(() => {
    if (!hasPreviewQuery) {
      return;
    }

    const timer = setTimeout(() => {
      fetch("/api/checkout/preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnpj: cnpj.trim() === "" ? undefined : cnpj,
          cupom: cupom.trim() === "" ? undefined : cupom,
        }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: PricePreview | null) => {
          if (body) {
            setPreview(body);
          }
        })
        .catch(() => {
          // Preview is a non-blocking convenience; a failure here doesn't
          // block the form, it just leaves the last known preview in place.
        });
    }, PRICE_PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [cnpj, cupom, hasPreviewQuery]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const checkoutInput: CheckoutInput = { nome, email, cpf, telefone, cnpj, cupom };
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
        body: JSON.stringify({ nome, email, cpf, telefone, cnpj, cupom }),
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
        <label htmlFor={cnpjId} className={LABEL_CLASSES}>
          CNPJ (opcional)
        </label>
        <input
          id={cnpjId}
          name="cnpj"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cnpj}
          onChange={(event) => setCnpj(event.target.value)}
          className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
        />
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

      {preview && hasPreviewQuery ? (
        <div className="mt-5">
          <p className="font-body text-base font-semibold text-brand-navy">
            Valor: {formatInvestment(String(preview.valorCobrado))}
          </p>
          {preview.isAssociado ? (
            <p className="mt-1 font-body text-sm text-brand-navy">Preço de associado aplicado.</p>
          ) : null}
        </div>
      ) : null}

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
