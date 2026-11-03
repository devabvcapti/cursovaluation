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
