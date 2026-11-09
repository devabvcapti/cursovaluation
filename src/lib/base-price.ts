import { courseContent } from "@/content/curso";

/**
 * Resolves the course's base price (before any coupon) for a given
 * associado/não-associado status, honoring the early-bird window. Pure and
 * side-effect-free so it's safe to call from both server code (`pricing.ts`)
 * and client components (the checkout form's instant price preview) without
 * duplicating the early-bird logic in two places.
 *
 * Falls back to the non-associado price when the associado figures are
 * still unconfigured placeholders (not finite numbers) — see
 * `courseContent.investment.associadoPrice`/`associadoEarlyBirdPrice`.
 */
export function resolveBasePrice(isAssociado: boolean): number {
  const { investment } = courseContent;
  const isEarlyBird = new Date() < new Date(investment.earlyBirdDeadlineISO);
  const naoAssociadoValor = Number(isEarlyBird ? investment.earlyBirdPrice : investment.price);

  if (!isAssociado) {
    return naoAssociadoValor;
  }

  const associadoValor = Number(
    isEarlyBird ? investment.associadoEarlyBirdPrice : investment.associadoPrice,
  );

  return Number.isFinite(associadoValor) ? associadoValor : naoAssociadoValor;
}
