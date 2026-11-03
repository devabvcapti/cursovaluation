import { courseContent } from "@/content/curso";
import { lookupAssociado } from "./associados";
import { resolveCupom } from "./cupons";

export interface PriceResolution {
  isAssociado: boolean;
  cupomAplicado: string | null;
  valorBase: number;
  valorCobrado: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Resolves the final price for a checkout: looks up whether the CNPJ
 * belongs to an active associado and whether the coupon is valid (in
 * parallel), picks the non-associado or associado figure depending on the
 * early-bird window, and applies the coupon discount on top.
 *
 * The associado figure is only used when it is a configured, finite number
 * — while `courseContent.investment.associadoPrice`/`associadoEarlyBirdPrice`
 * are still `placeholder(...)` strings, this falls back to the
 * non-associado price instead of charging NaN or R$0.
 */
export async function resolvePrice(params: {
  cnpj?: string | null;
  cupom?: string | null;
}): Promise<PriceResolution> {
  const [isAssociado, cupom] = await Promise.all([
    lookupAssociado(params.cnpj ?? null),
    resolveCupom(params.cupom ?? null),
  ]);

  const { investment } = courseContent;
  const isEarlyBird = new Date() < new Date(investment.earlyBirdDeadlineISO);

  const naoAssociadoValor = Number(isEarlyBird ? investment.earlyBirdPrice : investment.price);

  let valorBase = naoAssociadoValor;

  if (isAssociado) {
    const associadoValor = Number(
      isEarlyBird ? investment.associadoEarlyBirdPrice : investment.associadoPrice
    );

    if (Number.isFinite(associadoValor)) {
      valorBase = associadoValor;
    } else {
      console.warn(
        "[pricing] associado price not configured yet, falling back to non-associado price"
      );
    }
  }

  const valorCobrado = cupom.applied
    ? round2(valorBase * (1 - cupom.percentualDesconto / 100))
    : valorBase;

  return {
    isAssociado,
    cupomAplicado: cupom.applied ? cupom.codigo : null,
    valorBase,
    valorCobrado,
  };
}
