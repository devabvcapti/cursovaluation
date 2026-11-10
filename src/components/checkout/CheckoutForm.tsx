"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  CreditCard,
  Phone,
  Tag,
  GraduationCap,
  ShieldCheck,
  Check,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import {
  EMAIL_PATTERN,
  validateCheckout,
  validateCheckoutStep1,
  type CheckoutInput,
} from "@/lib/validate-checkout";
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

type Step = "identificacao" | "dados";

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
  "mt-1.5 block w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4",
  "font-body text-base text-white placeholder:text-white/30",
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const FIELD_BORDER_CLASSES = "border-white/15";
const FIELD_ERROR_BORDER_CLASSES = "border-red-400";

const FIELD_ICON_CLASSES = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40";

const LABEL_CLASSES = "font-body text-xs font-semibold uppercase tracking-[0.08em] text-white/60";

const ERROR_TEXT_CLASSES = "mt-1 font-body text-sm text-red-300";

const STEP_EYEBROW_CLASSES = "mb-6 font-body text-xs font-semibold uppercase tracking-[0.08em] text-white/40";

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md px-8 py-3.5",
  "bg-brand-green text-brand-navy border-2 border-brand-green",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const CARD_CLASSES = "rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8";

/** Wraps an input with its left-aligned lucide icon, used by every text field below. */
function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={FIELD_ICON_CLASSES} aria-hidden="true" />;
}

/**
 * Checkout, split across two screens so a visitor who drops off mid-form
 * still leaves a usable lead behind:
 *
 * 1. "identificacao" — Nome + E-mail (+ the "Sou associado ABVCAP" display
 *    toggle and the Termos/Privacidade checkbox). This is also where
 *    membership is actually verified: once the e-mail looks like a complete
 *    address, it's checked (debounced) against the GlueUp member-email
 *    export via `/api/checkout/preco`, and a match shows "Membro ABVCAP —
 *    empresa" and switches the displayed price to the associado value with
 *    no action needed from the student. Advancing past this screen
 *    (`handleStep1Submit`) fires a fire-and-forget `POST /api/checkout/lead`
 *    with just nome/email, so the admissions team has the lead on record
 *    even if the visitor never reaches the second screen — a failure there
 *    is logged server-side and never blocks navigation.
 * 2. "dados" — Empresa/Cargo (optional) + CPF/Telefone (required) + an
 *    optional cupom, validated with `validateCheckout` before ever touching
 *    the network (the server re-runs the same validation — see
 *    `src/app/api/checkout/pedido/route.ts` — so this is a UX convenience,
 *    not the trust boundary) and posted to `/api/checkout/pedido` only when
 *    the full payload is valid.
 *
 * The "Sou associado ABVCAP" button is a display-only toggle: it instantly
 * swaps the shown reference price between the non-associado and associado
 * values (both computed client-side, see `instantValor`/
 * `instantValorAssociado` below) so a visitor gets a sense of the member
 * price before typing anything. It is never sent to the server and never
 * changes what's actually charged — the e-mail (and/or cupom) lookup is the
 * only real validator, and its server-confirmed preview always overrides
 * this toggle's guess once it resolves. If that visitor claimed to be a
 * member but their e-mail doesn't match the export, they're pointed to
 * diretoriodemembros@abvcap.com.br instead of silently being charged the
 * non-associado price.
 *
 * The price itself is always visible on both screens, even before anything
 * is typed: it starts at the non-associado value (computed client-side via
 * `resolveBasePrice`, so it doesn't wait on a network round-trip) and only
 * the server-confirmed preview (email match and/or cupom) can raise it,
 * once resolved — alongside the discount percentage when a cupom applied.
 */
export function CheckoutForm({ onPedidoCreated, className }: CheckoutFormProps) {
  const uid = useId();
  const nomeId = `${uid}-checkout-nome`;
  const emailId = `${uid}-checkout-email`;
  const empresaId = `${uid}-checkout-empresa`;
  const cargoId = `${uid}-checkout-cargo`;
  const cpfId = `${uid}-checkout-cpf`;
  const telefoneId = `${uid}-checkout-telefone`;
  const cupomId = `${uid}-checkout-cupom`;
  const nomeErrorId = `${uid}-checkout-nome-error`;
  const emailErrorId = `${uid}-checkout-email-error`;
  const cpfErrorId = `${uid}-checkout-cpf-error`;
  const telefoneErrorId = `${uid}-checkout-telefone-error`;
  const termosId = `${uid}-checkout-termos`;
  const termosErrorId = `${uid}-checkout-termos-error`;

  const [step, setStep] = useState<Step>("identificacao");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cupom, setCupom] = useState("");
  // Purely a display toggle: it only switches which client-computed
  // reference price is shown before the real e-mail-based lookup resolves.
  // It is never sent to the server and never affects what's actually
  // charged — see the `instantValorAssociado`/`simulatedValor` comment below.
  const [simulaAssociado, setSimulaAssociado] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);
  // Shown only after a submit was attempted without the box checked — not on
  // every render while it's unchecked, so the error doesn't appear before
  // the user has tried to continue.
  const [termosError, setTermosError] = useState(false);

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
  // case is excluded here and keeps showing its own inline field errors —
  // same for an unchecked terms box, which shows its own `termosError`.
  const isServerError = status === "error" && Object.keys(errors).length === 0 && !termosError;

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
  // Runs regardless of which screen is shown, since email is collected on
  // screen 1 but cupom only exists on screen 2 — both drive the same
  // preview, and the resolved price stays authoritative across the step
  // change.
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

  // Instant, client-computed reference prices (non-associado and associado),
  // shown before any server round-trip resolves. Once a server-confirmed
  // preview is available (email match and/or cupom resolved), it takes over
  // as the authoritative displayed value instead — `simulaAssociado` only
  // ever affects which of these two reference prices is shown in the
  // meantime, never what's actually charged (that's decided server-side by
  // the real e-mail/cupom lookup in `resolvePrice`, regardless of this
  // toggle).
  //
  // Computed in an effect (not directly during render) because it reads the
  // current date (via `resolveBasePrice`'s early-bird check), and Next's
  // Cache Components prerendering rejects a Client Component reading
  // `new Date()` during the static render pass — this keeps that read
  // client/runtime-only, same as the [defer] fix it suggests.
  const [instantValor, setInstantValor] = useState<number | null>(null);
  const [instantValorAssociado, setInstantValorAssociado] = useState<number | null>(null);
  useEffect(() => {
    setInstantValor(resolveBasePrice(false));
    setInstantValorAssociado(resolveBasePrice(true));
  }, []);

  const simulatedValor = simulaAssociado ? instantValorAssociado : instantValor;
  const displayedValor = confirmedPreview ? confirmedPreview.valorCobrado : simulatedValor;
  // The non-associado reference price is always what "Valor do curso"
  // compares against in the summary card below — regardless of whether the
  // lower `displayedValor` comes from the display-only toggle, a real
  // e-mail/CNPJ associado match, a cupom, or any combination of those. This
  // keeps the breakdown (riscado + "Desconto X%" + Total) visually
  // consistent across both checkout screens: without it, a real
  // server-confirmed associado match (whose `valorBase` is already the
  // associado price, since `resolveBasePrice` is keyed on `isAssociado`)
  // would otherwise collapse straight to a flat Total the instant the
  // e-mail lookup resolves, even though the toggle's simulated guess showed
  // the full breakdown a moment earlier for the exact same price.
  const hasDesconto =
    instantValor !== null && displayedValor !== null && instantValor !== displayedValor;
  // Always the combined savings vs. that same non-associado reference price
  // — one line covers a cupom alone, an associado match alone (real or
  // simulated), or both together, rather than trying to split them out.
  const displayedPercentualDesconto =
    hasDesconto && instantValor !== null && displayedValor !== null
      ? Math.round(((instantValor - displayedValor) / instantValor) * 100)
      : null;
  // A cupom was typed and the server resolved a preview for it, but that
  // preview came back without a discount applied — distinct from "still
  // typing"/"not resolved yet" (confirmedPreview null) or "no cupom typed".
  const cupomInvalido = confirmedPreview !== null && trimmedCupom !== "" && !confirmedPreview.cupomAplicado;
  // The visitor claimed to be a member (the display-only toggle) and typed a
  // complete e-mail, but the server-confirmed lookup came back without a
  // match — tells them to sort it out with the Diretório de Membros instead
  // of silently charging the non-associado price.
  const emailNaoEncontradoNoDiretorio =
    simulaAssociado && isPlausibleEmail && showPreview && !preview?.empresaAssociada;

  function handleStep1Submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = validateCheckoutStep1({ nome, email });
    if (!result.valid || !aceitaTermos) {
      setErrors(result.valid ? {} : result.errors);
      setTermosError(!aceitaTermos);
      setStatus("error");
      return;
    }
    setErrors({});
    setTermosError(false);
    setStatus("idle");
    setStep("dados");

    // Fire-and-forget partial-lead notification — see the component-level
    // doc comment for why this never blocks navigation to screen 2.
    fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email }),
    }).catch(() => {});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const checkoutInput: CheckoutInput = { nome, email, cpf, telefone, cupom, empresa, cargo };
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
        body: JSON.stringify({ nome, email, cpf, telefone, cupom, empresa, cargo }),
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
    <div className={cn("grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8", className)}>
      {step === "identificacao" ? (
        <form noValidate onSubmit={handleStep1Submit} className={cn(CARD_CLASSES, "lg:col-span-3")}>
          <p className={STEP_EYEBROW_CLASSES}>Etapa 1 de 2 — Identificação</p>

          <div className="mb-6 flex flex-col items-center text-center">
            <button
              type="button"
              aria-pressed={simulaAssociado}
              onClick={() => setSimulaAssociado((value) => !value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2",
                "font-body text-sm font-semibold transition-colors",
                simulaAssociado
                  ? "border-brand-green bg-brand-green/15 text-brand-green"
                  : "border-white/20 bg-white/5 text-white/70 hover:border-white/35",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
              )}
            >
              {simulaAssociado ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              Sou associado ABVCAP
            </button>
            <p className="mt-2 font-body text-xs text-white/40">
              O valor de associado é confirmado automaticamente pelo e-mail informado abaixo.
            </p>
          </div>

          <div>
            <label htmlFor={nomeId} className={LABEL_CLASSES}>
              Nome
            </label>
            <div className="relative">
              <FieldIcon icon={User} />
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
            </div>
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
            <div className="relative">
              <FieldIcon icon={Mail} />
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
            </div>
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
            {emailNaoEncontradoNoDiretorio ? (
              <p className="mt-2 font-body text-sm text-amber-300">
                Este e-mail não consta no Diretório de Membros ABVCAP. Entre em contato com{" "}
                <a href="mailto:diretoriodemembros@abvcap.com.br" className="underline text-amber-200">
                  diretoriodemembros@abvcap.com.br
                </a>{" "}
                para verificar seu cadastro.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex items-start gap-3">
            <input
              id={termosId}
              name="aceitaTermos"
              type="checkbox"
              checked={aceitaTermos}
              onChange={(event) => {
                setAceitaTermos(event.target.checked);
                if (event.target.checked) {
                  setTermosError(false);
                }
              }}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/30 bg-white/5 accent-brand-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              aria-invalid={termosError}
              aria-describedby={termosError ? termosErrorId : undefined}
            />
            <label htmlFor={termosId} className="font-body text-sm text-white/70">
              Li e concordo com os{" "}
              <Link href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="underline text-white">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-white"
              >
                Política de Privacidade
              </Link>
              .
            </label>
          </div>
          {termosError ? (
            <p id={termosErrorId} className={ERROR_TEXT_CLASSES}>
              Você precisa concordar com os Termos de Uso e a Política de Privacidade para continuar.
            </p>
          ) : null}

          <button type="submit" className={cn(SUBMIT_BUTTON_CLASSES, "mt-5")}>
            Continuar
          </button>
        </form>
      ) : (
        <form noValidate onSubmit={handleSubmit} className={cn(CARD_CLASSES, "lg:col-span-3")}>
          <div className="mb-6 flex items-center justify-between">
            <p className={cn(STEP_EYEBROW_CLASSES, "mb-0")}>Etapa 2 de 2 — Dados para pagamento</p>
            <button
              type="button"
              onClick={() => setStep("identificacao")}
              className="inline-flex items-center gap-1 font-body text-sm text-white/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar
            </button>
          </div>

          <div>
            <label htmlFor={empresaId} className={LABEL_CLASSES}>
              Empresa (opcional)
            </label>
            <div className="relative">
              <FieldIcon icon={Building2} />
              <input
                id={empresaId}
                name="empresa"
                type="text"
                autoComplete="organization"
                value={empresa}
                onChange={(event) => setEmpresa(event.target.value)}
                className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor={cargoId} className={LABEL_CLASSES}>
              Cargo (opcional)
            </label>
            <div className="relative">
              <FieldIcon icon={Briefcase} />
              <input
                id={cargoId}
                name="cargo"
                type="text"
                autoComplete="organization-title"
                value={cargo}
                onChange={(event) => setCargo(event.target.value)}
                className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor={cpfId} className={LABEL_CLASSES}>
              CPF
            </label>
            <div className="relative">
              <FieldIcon icon={CreditCard} />
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
            </div>
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
            <div className="relative">
              <FieldIcon icon={Phone} />
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
            </div>
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
            <div className="relative">
              <FieldIcon icon={Tag} />
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
            {cupomInvalido ? (
              <p className="mt-2 font-body text-sm text-amber-300">
                Cupom inválido ou expirado — seguindo sem desconto.
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={status === "submitting"} className={cn(SUBMIT_BUTTON_CLASSES, "mt-7")}>
            Continuar para pagamento
          </button>

          {isServerError ? (
            <p className="mt-3 font-body text-sm text-red-300">
              Não foi possível enviar seus dados agora. Tente novamente.
            </p>
          ) : null}
        </form>
      )}

      <aside className={cn(CARD_CLASSES, "lg:col-span-2 lg:sticky lg:top-28")}>
        <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-[0.08em] text-white">
          <GraduationCap className="h-4 w-4 text-brand-green" aria-hidden="true" />
          Resumo da inscrição
        </h2>

        <p className="mt-4 font-body text-base font-semibold text-white">Modelagem Financeira e Valuation</p>

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
          {hasDesconto ? (
            <>
              <div className="flex items-center justify-between font-body text-sm text-white/70">
                <span>Valor do curso</span>
                <span className="line-through">{formatInvestment(String(instantValor))}</span>
              </div>
              <div className="flex items-center justify-between font-body text-sm text-brand-green">
                <span>
                  Desconto
                  {displayedPercentualDesconto !== null
                    ? ` (${displayedPercentualDesconto}% de desconto aplicado)`
                    : ""}
                </span>
                <span>
                  -{formatInvestment(String((instantValor as number) - (displayedValor as number)))}
                </span>
              </div>
            </>
          ) : null}
          {displayedValor !== null ? (
            <div className="flex items-center justify-between border-t border-white/10 pt-3 font-body text-lg font-bold text-white">
              <span>Total</span>
              <span>{formatInvestment(String(displayedValor))}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5 font-body text-sm text-white/60">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-green" aria-hidden="true" />
          <p>Pagamento processado com segurança pelo Mercado Pago.</p>
        </div>
      </aside>
    </div>
  );
}
