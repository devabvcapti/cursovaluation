import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

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
    .from("pedidos")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error || !pedido) {
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
