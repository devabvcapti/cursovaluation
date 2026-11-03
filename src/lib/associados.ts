import { onlyDigits } from "./digits";
import { getSupabaseServiceClient } from "./supabase/service-client";

/**
 * Looks up whether the given CNPJ belongs to an active ("ativo") associado.
 * Returns false for a blank/null CNPJ (no query performed) and false on any
 * Supabase error or no-match — this check must never block a purchase.
 */
export async function lookupAssociado(cnpj: string | null): Promise<boolean> {
  const normalized = onlyDigits(cnpj ?? "");

  if (!normalized) {
    return false;
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from("associados")
    .select("ativo")
    .eq("cnpj", normalized)
    .eq("ativo", true)
    .maybeSingle();

  return Boolean(data) && error === null;
}
