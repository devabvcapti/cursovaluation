import { onlyDigits } from "./digits";
import { isValidCpf } from "./cpf";

export interface CheckoutInput {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cnpj?: string;
  cupom?: string;
  empresa?: string;
  cargo?: string;
}

export type CheckoutValidationResult =
  | { valid: true }
  | { valid: false; errors: Partial<Record<"nome" | "email" | "cpf" | "telefone", string>> };

export type CheckoutStep1Input = Pick<CheckoutInput, "nome" | "email">;

export type CheckoutStep1ValidationResult =
  | { valid: true }
  | { valid: false; errors: Partial<Record<"nome" | "email", string>> };

// Deliberately permissive: same pattern as `validate-lead.ts`'s EMAIL_PATTERN,
// reused here rather than redefined so both forms treat email the same way.
// Exported so `CheckoutForm` can gate its email-based associado preview on
// the same definition of "looks like an email" used for validation.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates just the checkout form's first screen (nome + e-mail) — used to
 * gate advancing to the second screen (empresa/cargo/cpf/telefone/cupom)
 * before those fields exist yet. `validateCheckout` below builds on this
 * same check rather than duplicating it, so a value valid here stays valid
 * once the full payload is validated again before submission.
 */
export function validateCheckoutStep1(data: CheckoutStep1Input): CheckoutStep1ValidationResult {
  const errors: Partial<Record<"nome" | "email", string>> = {};

  if (!data.nome || data.nome.trim() === "") {
    errors.nome = "Campo obrigatório.";
  }

  if (!data.email || data.email.trim() === "") {
    errors.email = "Campo obrigatório.";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Formato inválido.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validates a full checkout payload (nome/email/cpf/telefone). `cnpj`,
 * `cupom`, `empresa` and `cargo` are intentionally left unvalidated here —
 * `cnpj`/`cupom` are checked downstream by `lookupAssociado`/`resolveCupom`
 * (where an unrecognized value degrades gracefully instead of failing
 * validation), and `empresa`/`cargo` are optional free text with nothing to
 * validate.
 */
export function validateCheckout(data: CheckoutInput): CheckoutValidationResult {
  const step1 = validateCheckoutStep1(data);
  const errors: Partial<Record<"nome" | "email" | "cpf" | "telefone", string>> = step1.valid
    ? {}
    : { ...step1.errors };

  if (!data.cpf || data.cpf.trim() === "") {
    errors.cpf = "Campo obrigatório.";
  } else if (!isValidCpf(onlyDigits(data.cpf))) {
    errors.cpf = "CPF inválido.";
  }

  if (!data.telefone || data.telefone.trim() === "") {
    errors.telefone = "Campo obrigatório.";
  } else {
    const telefoneDigits = onlyDigits(data.telefone).length;
    if (telefoneDigits !== 10 && telefoneDigits !== 11) {
      errors.telefone = "Telefone inválido.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
