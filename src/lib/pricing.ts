import { lookupAssociado, lookupAssociadoPorEmail } from "./associados";
import { resolveCupom } from "./cupons";
import { resolveBasePrice } from "./base-price";

export interface PriceResolution {
  isAssociado: boolean;
  /** Member's company name, only when matched via email (see `lookupAssociadoPorEmail`) — null for a CNPJ-only match. */
  empresaAssociada: string | null;
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
 * belongs to an active associado, whether the email matches the GlueUp
 * member export, and whether the coupon is valid (all in parallel), then
 * applies `resolveBasePrice`'s associado/não-associado + early-bird figure
 * and the coupon discount on top. A member via either CNPJ or email gets
 * the associado price; `empresaAssociada` is only populated for an email
 * match, since that's the only lookup that carries a company name.
 */
export async function resolvePrice(params: {
  cnpj?: string | null;
  email?: string | null;
  cupom?: string | null;
}): Promise<PriceResolution> {
  const [isAssociadoCnpj, associadoEmail, cupom] = await Promise.all([
    lookupAssociado(params.cnpj ?? null),
    lookupAssociadoPorEmail(params.email ?? null),
    resolveCupom(params.cupom ?? null),
  ]);

  const isAssociado = isAssociadoCnpj || associadoEmail.isAssociado;
  const valorBase = resolveBasePrice(isAssociado);

  const valorCobrado = cupom.applied
    ? round2(valorBase * (1 - cupom.percentualDesconto / 100))
    : valorBase;

  return {
    isAssociado,
    empresaAssociada: associadoEmail.isAssociado ? associadoEmail.empresa : null,
    cupomAplicado: cupom.applied ? cupom.codigo : null,
    percentualDesconto: cupom.applied ? cupom.percentualDesconto : null,
    valorBase,
    valorCobrado,
  };
}
