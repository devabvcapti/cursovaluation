import { onlyDigits } from "./digits";
import { getSupabaseServiceClient } from "./supabase/service-client";
import { TABLE_ASSOCIADOS, TABLE_ASSOCIADOS_EMAIL } from "./supabase/table-names";

export interface AssociadoEmailLookup {
  isAssociado: boolean;
  empresa: string | null;
}

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
    .from(TABLE_ASSOCIADOS)
    .select("ativo")
    .eq("cnpj", normalized)
    .eq("ativo", true)
    .maybeSingle();

  return Boolean(data) && error === null;
}

/**
 * Looks up whether the given email belongs to a member in the GlueUp email
 * export (`TABLE_ASSOCIADOS_EMAIL`) — a DEV-only alternative to
 * `lookupAssociado` for members whose company CNPJ isn't on file. Returns
 * `{ isAssociado: false, empresa: null }` for a blank/null email (no query
 * performed) and on any Supabase error or no-match — this check must never
 * block a purchase.
 */
export async function lookupAssociadoPorEmail(email: string | null): Promise<AssociadoEmailLookup> {
  const normalized = (email ?? "").trim().toLowerCase();

  if (!normalized) {
    return { isAssociado: false, empresa: null };
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from(TABLE_ASSOCIADOS_EMAIL)
    .select("empresa")
    .eq("email", normalized)
    .maybeSingle();

  if (error || !data) {
    return { isAssociado: false, empresa: null };
  }

  return { isAssociado: true, empresa: data.empresa ?? null };
}
