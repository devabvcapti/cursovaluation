import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { TABLE_PEDIDOS } from "@/lib/supabase/table-names";

/**
 * Polled by the Pix waiting UI (Task 16) to learn whether a pedido has been
 * settled. Returns only the status field, nothing else from the row.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const client = getSupabaseServiceClient();

  const { data: pedido, error } = await client
    .from(TABLE_PEDIDOS)
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { errors: { nome: "Não foi possível consultar o pedido agora." } },
      { status: 500 },
    );
  }

  if (!pedido) {
    return NextResponse.json(
      { errors: { nome: "Pedido não encontrado." } },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { status: (pedido as { status: string }).status },
    { status: 200 },
  );
}
