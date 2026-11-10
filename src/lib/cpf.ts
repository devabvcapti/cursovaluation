import { onlyDigits } from "./digits";

function computeCheckDigit(digits: string, weightStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * (weightStart - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Validates a CPF (Brazilian individual taxpayer ID) using the standard
 * two-check-digit algorithm. Accepts punctuated or unpunctuated input
 * (normalized internally via `onlyDigits`).
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = computeCheckDigit(digits.slice(0, 9), 10);
  if (firstCheckDigit !== Number(digits[9])) {
    return false;
  }

  const secondCheckDigit = computeCheckDigit(digits.slice(0, 10), 11);
  if (secondCheckDigit !== Number(digits[10])) {
    return false;
  }

  return true;
}

/**
 * Formats a (possibly partial, possibly already-punctuated) CPF as the
 * user types: "###.###.###-##". Strips any non-digit characters first (so
 * re-formatting an already-masked value, e.g. after a backspace, never
 * doubles up punctuation) and ignores anything past the 11th digit.
 */
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  let formatted = digits.slice(0, 3);
  if (digits.length > 3) formatted += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;

  return formatted;
}
