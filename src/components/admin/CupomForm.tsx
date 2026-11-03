"use client";

import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import type { CupomRow } from "@/lib/supabase/types";

export interface CupomFormProps {
  /** Called after the cupom is created by the server (201 response). */
  onCreated: (row: CupomRow) => void;
  className?: string;
}

type FieldErrors = Partial<Record<"codigo" | "percentualDesconto", string>>;

type SubmitStatus = "idle" | "submitting" | "error";

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

const EMPTY_FORM = {
  codigo: "",
  percentualDesconto: "",
  validoDe: "",
  validoAte: "",
  limiteUso: "",
};

/**
 * Admin form to create a cupom. Client-side validation mirrors the server's
 * exact bounds (non-blank código, `0 < percentualDesconto <= 100` — see
 * `src/app/api/admin/cupons/route.ts`'s `POST`) as a UX convenience; the
 * server re-validates regardless, so this is not the trust boundary. On a
 * `201` response, hands the created row to `onCreated` and clears the form.
 */
export function CupomForm({ onCreated, className }: CupomFormProps) {
  const uid = useId();
  const codigoId = `${uid}-cupom-codigo`;
  const percentualId = `${uid}-cupom-percentual`;
  const validoDeId = `${uid}-cupom-valido-de`;
  const validoAteId = `${uid}-cupom-valido-ate`;
  const limiteUsoId = `${uid}-cupom-limite-uso`;
  const codigoErrorId = `${uid}-cupom-codigo-error`;
  const percentualErrorId = `${uid}-cupom-percentual-error`;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const isServerError = status === "error" && Object.keys(errors).length === 0;

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!form.codigo.trim()) {
      nextErrors.codigo = "Informe o código do cupom.";
    }

    const percentualDesconto = form.percentualDesconto.trim() === "" ? NaN : Number(form.percentualDesconto);
    if (!Number.isFinite(percentualDesconto) || percentualDesconto <= 0 || percentualDesconto > 100) {
      nextErrors.percentualDesconto = "Informe um percentual de desconto entre 1 e 100.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus("error");
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/admin/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: form.codigo,
          percentualDesconto: Number(form.percentualDesconto),
          validoDe: form.validoDe.trim() === "" ? undefined : form.validoDe,
          validoAte: form.validoAte.trim() === "" ? undefined : form.validoAte,
          limiteUso: form.limiteUso.trim() === "" ? undefined : Number(form.limiteUso),
        }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const row = (await response.json()) as CupomRow;
      onCreated(row);
      setForm(EMPTY_FORM);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={cn("w-full max-w-md", className)}>
      <div>
        <label htmlFor={codigoId} className={LABEL_CLASSES}>
          Código
        </label>
        <input
          id={codigoId}
          name="codigo"
          type="text"
          autoComplete="off"
          value={form.codigo}
          onChange={(event) => updateField("codigo", event.target.value)}
          className={cn(FIELD_CLASSES, errors.codigo ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.codigo)}
          aria-describedby={errors.codigo ? codigoErrorId : undefined}
        />
        {errors.codigo ? (
          <p id={codigoErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.codigo}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={percentualId} className={LABEL_CLASSES}>
          Percentual de desconto (%)
        </label>
        <input
          id={percentualId}
          name="percentualDesconto"
          type="number"
          min={1}
          max={100}
          autoComplete="off"
          value={form.percentualDesconto}
          onChange={(event) => updateField("percentualDesconto", event.target.value)}
          className={cn(
            FIELD_CLASSES,
            errors.percentualDesconto ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES,
          )}
          aria-invalid={Boolean(errors.percentualDesconto)}
          aria-describedby={errors.percentualDesconto ? percentualErrorId : undefined}
        />
        {errors.percentualDesconto ? (
          <p id={percentualErrorId} className={ERROR_TEXT_CLASSES}>
            {errors.percentualDesconto}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={validoDeId} className={LABEL_CLASSES}>
          Válido de (opcional)
        </label>
        <input
          id={validoDeId}
          name="validoDe"
          type="date"
          value={form.validoDe}
          onChange={(event) => updateField("validoDe", event.target.value)}
          className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
        />
      </div>

      <div className="mt-5">
        <label htmlFor={validoAteId} className={LABEL_CLASSES}>
          Válido até (opcional)
        </label>
        <input
          id={validoAteId}
          name="validoAte"
          type="date"
          value={form.validoAte}
          onChange={(event) => updateField("validoAte", event.target.value)}
          className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
        />
      </div>

      <div className="mt-5">
        <label htmlFor={limiteUsoId} className={LABEL_CLASSES}>
          Limite de uso (opcional)
        </label>
        <input
          id={limiteUsoId}
          name="limiteUso"
          type="number"
          min={1}
          autoComplete="off"
          value={form.limiteUso}
          onChange={(event) => updateField("limiteUso", event.target.value)}
          className={cn(FIELD_CLASSES, FIELD_BORDER_CLASSES)}
        />
      </div>

      <button type="submit" disabled={status === "submitting"} className={SUBMIT_BUTTON_CLASSES}>
        Criar cupom
      </button>

      {isServerError ? (
        <p className="mt-3 font-body text-sm text-red-600">
          Não foi possível criar o cupom agora. Tente novamente.
        </p>
      ) : null}
    </form>
  );
}
