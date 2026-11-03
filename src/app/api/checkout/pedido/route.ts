import { NextResponse } from "next/server";
import { validateCheckout, type CheckoutInput } from "@/lib/validate-checkout";
import { resolvePrice } from "@/lib/pricing";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

/**
 * Creates a pending pedido from a checkout payload. Re-validates the payload
 * server-side (the client-side validation in `CheckoutForm` is a UX
 * convenience, not the trust boundary) and re-resolves the price from the
 * submitted cnpj/cupom — a client-sent price value is never trusted and
 * never reaches the database.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { nome: "Payload inválido." } },
      { status: 400 },
    );
  }

  const {
    nome: rawNome,
    email: rawEmail,
    cpf: rawCpf,
    telefone: rawTelefone,
    cnpj: rawCnpj,
    cupom: rawCupom,
  } = (body ?? {}) as Record<string, unknown>;

  const nome = typeof rawNome === "string" ? rawNome : "";
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const cpf = typeof rawCpf === "string" ? rawCpf : "";
  const telefone = typeof rawTelefone === "string" ? rawTelefone : "";
  const cnpj = typeof rawCnpj === "string" ? rawCnpj : undefined;
  const cupom = typeof rawCupom === "string" ? rawCupom : undefined;

  const checkoutInput: CheckoutInput = { nome, email, cpf, telefone, cnpj, cupom };
  const result = validateCheckout(checkoutInput);

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const price = await resolvePrice({ cnpj, cupom });

  const { data, error } = await getSupabaseServiceClient()
    .from("pedidos")
    .insert({
      nome,
      email,
      cpf,
      telefone,
      cnpj_informado: cnpj ?? null,
      is_associado: price.isAssociado,
      cupom_codigo: price.cupomAplicado,
      valor_base: price.valorBase,
      valor_cobrado: price.valorCobrado,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { errors: { nome: "Não foi possível iniciar o pagamento agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { pedidoId: data.id, valorCobrado: price.valorCobrado },
    { status: 200 },
  );
}
