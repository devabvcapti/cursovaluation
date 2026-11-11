/**
 * Only these accounts may manage `/admin/cupons`, regardless of whether
 * Supabase Auth lets them sign in. Decided 2026-11-04: 7 ABVCAP staff
 * accounts; a shared Supabase project with other ABVCAP systems means other
 * accounts (e.g. an external events-production domain) can authenticate
 * successfully but must still be denied admin access here.
 */
const ADMIN_EMAIL_ALLOWLIST = new Set([
  "ti@abvcap.com.br",
  "rlima@abvcap.com.br",
  "mbarea@abvcap.com.br",
  "admin@abvcap.com.br",
  "afernandes@abvcap.com.br",
  "rlujan@abvcap.com.br",
  "eventos@abvcap.com.br",
]);

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && ADMIN_EMAIL_ALLOWLIST.has(email.trim().toLowerCase());
}
