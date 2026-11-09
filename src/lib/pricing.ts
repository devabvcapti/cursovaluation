import { lookupAssociado } from "./associados";
import { resolveCupom } from "./cupons";
import { resolveBasePrice } from "./base-price";

export interface PriceResolution {
  isAssociado: boolean;
  cupomAplicado: string | null;
  percentualDesconto: number | null;
  valorBase: number;
  valorCobrado: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Resolves the final price for a checkout: looks up whether the CNPJ
 * belongs to an active associado and whether the coupon is valid (in
 * parallel), then applies `resolveBasePrice`'s associado/não-associado +
 * early-bird figure and the coupon discount on top.
 */
export async function resolvePrice(params: {
  cnpj?: string | null;
  cupom?: string | null;
}): Promise<PriceResolution> {
  const [isAssociado, cupom] = await Promise.all([
    lookupAssociado(params.cnpj ?? null),
    resolveCupom(params.cupom ?? null),
  ]);

  const valorBase = resolveBasePrice(isAssociado);

  const valorCobrado = cupom.applied
    ? round2(valorBase * (1 - cupom.percentualDesconto / 100))
    : valorBase;

  return {
    isAssociado,
    cupomAplicado: cupom.applied ? cupom.codigo : null,
    percentualDesconto: cupom.applied ? cupom.percentualDesconto : null,
    valorBase,
    valorCobrado,
  };
}
