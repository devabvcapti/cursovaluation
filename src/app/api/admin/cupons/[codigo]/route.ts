import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin-session";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

/**
 * Toggles `ativo` on a cupom by its código. Gated by `requireAdminSession()`
 * — independent of the `/admin/*` page middleware (Task 18) — before any
 * data access, same as the other admin cupons routes.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ errors: { geral: "Não autorizado." } }, { status: 401 });
  }

  const { codigo } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { ativo: "Payload inválido." } },
      { status: 400 },
    );
  }

  const { ativo } = (body ?? {}) as Record<string, unknown>;

  if (typeof ativo !== "boolean") {
    return NextResponse.json(
      { errors: { ativo: "Informe um valor booleano para ativo." } },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabaseServiceClient()
    .from("cupons")
    .update({ ativo })
    .eq("codigo", codigo)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { errors: { geral: "Não foi possível atualizar o cupom agora." } },
      { status: 502 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { errors: { geral: "Cupom não encontrado." } },
      { status: 404 },
    );
  }

  return NextResponse.json(data, { status: 200 });
}
