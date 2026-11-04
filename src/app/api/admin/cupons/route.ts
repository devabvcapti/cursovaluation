import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin-session";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { TABLE_CUPONS } from "@/lib/supabase/table-names";
import { CURSO_SLUG } from "@/lib/curso-slug";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `validoDe`/`validoAte` come from `<input type="date">` (date-only
 * "YYYY-MM-DD"). Stored as-is into a `timestamptz` column they'd mean UTC
 * midnight — 21:00 BRT the previous day. Anchor them to Brasília time
 * instead: `validoDe` = start of that day, `validoAte` = end of that day, so
 * a cupom "valid until Dec 20" works through all of Dec 20 BRT. A value that
 * already carries a time is passed through; blank/non-string becomes null.
 */
function toBrtBoundary(value: unknown, edge: "start" | "end"): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!DATE_ONLY.test(trimmed)) return trimmed;
  return edge === "start" ? `${trimmed}T00:00:00-03:00` : `${trimmed}T23:59:59.999-03:00`;
}

/**
 * Lists this course's cupons for the admin area. Gated by
 * `requireAdminSession()` — independent of the `/admin/*` page middleware
 * (Task 18), since that middleware does not stop a direct HTTP request to
 * this route. Uses the service-role client because no anon-key RLS policy is
 * defined for `curso_aprendacomquemfaz_cupons` (Task 4); the session check
 * above is the only auth gate. Scoped to `CURSO_SLUG` since this shared table
 * can hold other courses' cupons too.
 */
export async function GET(_request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ errors: { geral: "Não autorizado." } }, { status: 401 });
  }

  const { data, error } = await getSupabaseServiceClient()
    .from(TABLE_CUPONS)
    .select("*")
    .eq("curso_slug", CURSO_SLUG)
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

  const validoDe = toBrtBoundary(rawValidoDe, "start");
  const validoAte = toBrtBoundary(rawValidoAte, "end");
  const limiteUso = typeof rawLimiteUso === "number" ? rawLimiteUso : null;

  const { data, error } = await getSupabaseServiceClient()
    .from(TABLE_CUPONS)
    .insert({
      codigo: codigo.toUpperCase(),
      percentual_desconto: percentualDesconto,
      ativo: true,
      valido_de: validoDe,
      valido_ate: validoAte,
      limite_uso: limiteUso,
      usos_atuais: 0,
      criado_por: session.email,
      curso_slug: CURSO_SLUG,
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
