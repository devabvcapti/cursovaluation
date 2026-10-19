"use client";

import { useState, type FormEvent } from "react";
import { validateLead } from "@/lib/validate-lead";
import { courseContent } from "@/content/curso";
import { cn } from "@/lib/cn";

export interface LeadCaptureFormProps {
  /** Called after the lead is accepted by the server (2xx response). */
  onSuccess?: () => void;
  className?: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

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
  "mt-2 inline-flex min-h-11 items-center justify-center px-8 py-3.5",
  "bg-brand-green text-brand-navy border-2 border-brand-green",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

/**
 * Secondary-CTA lead capture: collects name + email, validates with
 * `validateLead` before ever touching the network, and posts to
 * `/api/lead` only when the payload is valid. The server re-runs the same
 * validation (see `src/app/api/lead/route.ts`), so this is a UX
 * convenience, not the trust boundary.
 */
export function LeadCaptureForm({ onSuccess, className }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "email", string>>>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = validateLead({ name, email });
    if (!result.valid) {
      setErrors(result.errors);
      setStatus("error");
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={cn("w-full max-w-md", className)}>
      <div>
        <label htmlFor="lead-name" className={LABEL_CLASSES}>
          Nome
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={cn(FIELD_CLASSES, errors.name ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "lead-name-error" : undefined}
        />
        {errors.name ? (
          <p id="lead-name-error" className={ERROR_TEXT_CLASSES}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="lead-email" className={LABEL_CLASSES}>
          E-mail
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={cn(FIELD_CLASSES, errors.email ? FIELD_ERROR_BORDER_CLASSES : FIELD_BORDER_CLASSES)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "lead-email-error" : undefined}
        />
        {errors.email ? (
          <p id="lead-email-error" className={ERROR_TEXT_CLASSES}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={status === "submitting"} className={SUBMIT_BUTTON_CLASSES}>
        {courseContent.hero.syllabusCtaLabel}
      </button>

      {status === "success" ? (
        <p className="mt-3 font-body text-sm text-brand-navy">Recebemos seus dados. Em breve enviaremos a ementa.</p>
      ) : null}
    </form>
  );
}
