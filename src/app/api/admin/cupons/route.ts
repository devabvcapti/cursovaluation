import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin-session";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

/**
 * Lists all cupons for the admin area. Gated by `requireAdminSession()` —
 * independent of the `/admin/*` page middleware (Task 18), since that
 * middleware does not stop a direct HTTP request to this route. Uses the
 * service-role client because no anon-key RLS policy is defined for
 * `cupons` (Task 4); the session check above is the only auth gate.
 */
export async function GET(_request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ errors: { geral: "Não autorizado." } }, { status: 401 });
  }

  const { data, error } = await getSupabaseServiceClient()
    .from("cupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { errors: { geral: "Não foi possível listar os cupons agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: 200 });
}

/**
 * Creates a cupom. `criado_por` is always set from the verified session —
 * never from the request body, even if the body supplies its own value —
 * so a cupom can always be traced to the admin who actually created it.
 */
export async function POST(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ errors: { geral: "Não autorizado." } }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { codigo: "Payload inválido." } },
      { status: 400 },
    );
  }

  const {
    codigo: rawCodigo,
    percentualDesconto: rawPercentualDesconto,
    validoDe: rawValidoDe,
    validoAte: rawValidoAte,
    limiteUso: rawLimiteUso,
  } = (body ?? {}) as Record<string, unknown>;

  const errors: Record<string, string> = {};

  const codigo = typeof rawCodigo === "string" ? rawCodigo.trim() : "";
  if (!codigo) {
    errors.codigo = "Informe o código do cupom.";
  }

  const percentualDesconto =
    typeof rawPercentualDesconto === "number" ? rawPercentualDesconto : NaN;
  if (
    !Number.isFinite(percentualDesconto) ||
    percentualDesconto <= 0 ||
    percentualDesconto > 100
  ) {
    errors.percentualDesconto = "Informe um percentual de desconto entre 1 e 100.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const validoDe = typeof rawValidoDe === "string" ? rawValidoDe : null;
  const validoAte = typeof rawValidoAte === "string" ? rawValidoAte : null;
  const limiteUso = typeof rawLimiteUso === "number" ? rawLimiteUso : null;

  const { data, error } = await getSupabaseServiceClient()
    .from("cupons")
    .insert({
      codigo: codigo.toUpperCase(),
      percentual_desconto: percentualDesconto,
      ativo: true,
      valido_de: validoDe,
      valido_ate: validoAte,
      limite_uso: limiteUso,
      usos_atuais: 0,
      criado_por: session.email,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { errors: { geral: "Não foi possível criar o cupom agora." } },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
