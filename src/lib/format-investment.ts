import { isPlaceholder } from "@/lib/placeholder";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Formats an investment value for display. Placeholder values pass through
 * unchanged so they stay visibly bracketed as pending; they are never
 * formatted as if they were real money. Non-numeric input is also returned
 * as-is rather than rendered as "R$ NaN".
 */
export function formatInvestment(value: string): string {
  if (isPlaceholder(value)) {
    return value;
  }
  const amount = Number(value);
  if (value.trim() === "" || Number.isNaN(amount)) {
    return value;
  }
  // Intl separates the symbol from the amount with a no-break space (U+00A0).
  return BRL.format(amount).replace(/\u00a0/g, " ");
}
