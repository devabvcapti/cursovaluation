import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/supabase/require-admin-session";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { CupomRow } from "@/lib/supabase/types";
import { CupomList } from "@/components/admin/CupomList";

/**
 * Cache Components (next.config.ts) requires a request-time read like
 * `cookies()` (inside `requireAdminSession()`, below) to sit behind a
 * `<Suspense>` boundary or be exempted via `instant = false` — otherwise
 * `next build`'s prerender pass fails outright (see
 * node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md,
 * "Migrating an existing app"). This is an internal, auth-gated admin page
 * with no streaming/prefetch requirement, so blocking on the server is
 * the simplest correct choice rather than introducing a Suspense boundary.
 */
export const instant = false;

/**
 * Admin cupons page. The proxy (`src/proxy.ts`) already redirects
 * unauthenticated navigations, but this page re-checks the session itself
 * (defense in depth, same as the `/api/admin/*` routes) and then reads
 * `cupons` with the service-role client: `cupons` has RLS enabled with no
 * policies (Task 4 migration), so the anon-key/session client would silently
 * get zero rows back. Interactivity (creating/toggling cupons) lives in the
 * `CupomList` client island.
 */
export default async function CuponsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { data, error } = await getSupabaseServiceClient()
    .from("cupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10">
      <h1 className="font-heading text-xl font-bold text-brand-navy">Cupons</h1>
      {error ? (
        <p role="alert" className="mt-6 font-body text-sm text-red-600">
          Não foi possível carregar os cupons agora. Recarregue a página em instantes.
        </p>
      ) : (
        <CupomList initialCupons={(data ?? []) as CupomRow[]} />
      )}
    </main>
  );
}
