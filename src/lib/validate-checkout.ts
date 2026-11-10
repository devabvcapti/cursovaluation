import { onlyDigits } from "./digits";
import { isValidCpf } from "./cpf";

export interface CheckoutInput {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cnpj?: string;
  cupom?: string;
}

export type CheckoutValidationResult =
  | { valid: true }
  | { valid: false; errors: Partial<Record<"nome" | "email" | "cpf" | "telefone", string>> };

// Deliberately permissive: same pattern as `validate-lead.ts`'s EMAIL_PATTERN,
// reused here rather than redefined so both forms treat email the same way.
// Exported so `CheckoutForm` can gate its email-based associado preview on
// the same definition of "looks like an email" used for validation.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a checkout payload (nome/email/cpf/telefone). `cnpj` and `cupom`
 * are intentionally left unvalidated here — they're optional and checked
 * downstream by `lookupAssociado`/`resolveCupom`, where an unrecognized
 * value degrades gracefully instead of failing validation.
 */
export function validateCheckout(data: CheckoutInput): CheckoutValidationResult {
  const errors: Partial<Record<"nome" | "email" | "cpf" | "telefone", string>> = {};

  if (!data.nome || data.nome.trim() === "") {
    errors.nome = "Campo obrigatório.";
  }

  if (!data.email || data.email.trim() === "") {
    errors.email = "Campo obrigatório.";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Formato inválido.";
  }

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
