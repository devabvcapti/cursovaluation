export interface LeadInput {
  name: string;
  email: string;
}

export type LeadValidationResult =
  | { valid: true }
  | { valid: false; errors: Partial<Record<"name" | "email", string>> };

// Deliberately permissive: catches the common "missing @" / "missing domain"
// typos the form needs to flag without trying to be a full RFC 5322 parser.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a lead-capture payload (name + email). Used both client-side
 * (inline field errors in `LeadCaptureForm`) and server-side (the
 * `POST /api/lead` route re-runs it so an invalid payload is rejected even
 * if a caller bypasses the form).
 */
export function validateLead(data: LeadInput): LeadValidationResult {
  const errors: Partial<Record<"name" | "email", string>> = {};

  if (!data.name || data.name.trim() === "") {
    errors.name = "Campo obrigatório.";
  }

  if (!data.email || data.email.trim() === "") {
    // Deliberately doesn't repeat the literal word "e-mail" here: the field's
    // own <label> already reads "E-mail", and `LeadCaptureForm`'s tests query
    // the DOM by that text — a second element containing the same substring
    // would make that query ambiguous (multiple matches).
    errors.email = "Campo obrigatório.";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Formato inválido.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
