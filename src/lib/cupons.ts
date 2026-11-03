import { getSupabaseServiceClient } from "./supabase/service-client";

export type CupomResolution =
  | { applied: false }
  | { applied: true; codigo: string; percentualDesconto: number };

/**
 * Resolves a coupon code to its discount, if valid. Returns
 * { applied: false } for a blank/null code (no query performed), for an
 * unknown code, or for any coupon that is inactive, outside its
 * valido_de/valido_ate window, at/over its limite_uso, or hit a Supabase
 * error — coupon issues must never block a purchase.
 */
export async function resolveCupom(codigo: string | null): Promise<CupomResolution> {
  const normalized = (codigo ?? "").trim().toUpperCase();

  if (!normalized) {
    return { applied: false };
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from("cupons")
    .select("codigo, percentual_desconto, ativo, valido_de, valido_ate, limite_uso, usos_atuais")
    .eq("codigo", normalized)
    .maybeSingle();

  if (error || !data) {
    return { applied: false };
  }

  if (data.ativo === false) {
    return { applied: false };
  }

  const now = Date.now();

  if (data.valido_de && new Date(data.valido_de).getTime() > now) {
    return { applied: false };
  }

  if (data.valido_ate && new Date(data.valido_ate).getTime() < now) {
    return { applied: false };
  }

  if (data.limite_uso != null && data.usos_atuais >= data.limite_uso) {
    return { applied: false };
  }

  return {
    applied: true,
    codigo: data.codigo,
    percentualDesconto: data.percentual_desconto,
  };
}

/**
 * Increments a coupon's usage counter after a confirmed purchase. Fetches
 * the current count and writes current + 1 (never blindly sets to 1).
 * Errors are swallowed/logged — called from the webhook handler, where a
 * failed increment must not block the confirmation email.
 */
export async function incrementCupomUso(codigo: string): Promise<void> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("cupons")
      .select("usos_atuais")
      .eq("codigo", codigo)
      .maybeSingle();

    if (error || !data) {
      console.error("incrementCupomUso: failed to fetch cupom", codigo, error);
      return;
    }

    const { error: updateError } = await client
      .from("cupons")
      .update({ usos_atuais: data.usos_atuais + 1 })
      .eq("codigo", codigo);

    if (updateError) {
      console.error("incrementCupomUso: failed to update cupom", codigo, updateError);
    }
  } catch (err) {
    console.error("incrementCupomUso: unexpected error", codigo, err);
  }
}
