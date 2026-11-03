/**
 * Strips every non-digit character from a string. Used to normalize
 * user-entered CPF/phone values (which may include punctuation like
 * "111.444.777-35" or "(11) 99148-0203") before validation or submission.
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
