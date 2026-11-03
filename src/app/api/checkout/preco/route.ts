import { NextResponse } from "next/server";
import { resolvePrice } from "@/lib/pricing";

/**
 * Non-blocking price preview for the checkout form: recomputes the price
 * server-side from an optional cnpj/cupom so the UI can show the resolved
 * value before the pedido is actually created. A malformed/empty body is
 * treated as having no cnpj/cupom rather than failing the request.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { cnpj: rawCnpj, cupom: rawCupom } = (body ?? {}) as { cnpj?: unknown; cupom?: unknown };
  const cnpj = typeof rawCnpj === "string" ? rawCnpj : undefined;
  const cupom = typeof rawCupom === "string" ? rawCupom : undefined;

  const result = await resolvePrice({ cnpj, cupom });

  return NextResponse.json(result, { status: 200 });
}
