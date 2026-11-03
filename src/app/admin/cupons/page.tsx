import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CupomRow } from "@/lib/supabase/types";
import { CupomList } from "@/components/admin/CupomList";

/**
 * Cache Components (next.config.ts) requires a request-time read like
 * `cookies()` (inside `getSupabaseServerClient()`, below) to sit behind a
 * `<Suspense>` boundary or be exempted via `instant = false` — otherwise
 * `next build`'s prerender pass fails outright (see
 * node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md,
 * "Migrating an existing app"). This is an internal, auth-gated admin page
 * with no streaming/prefetch requirement, so blocking on the server is
 * the simplest correct choice rather than introducing a Suspense boundary.
 */
export const instant = false;

/**
 * Admin cupons page. Middleware (Task 18's `src/middleware.ts`) already
 * guarantees an authenticated session reaches here, so this Server
 * Component just reads `cupons` directly via `getSupabaseServerClient()` —
 * no need to self-fetch the `GET /api/admin/cupons` route handler from a
 * Server Component. Interactivity (creating/toggling cupons) lives in the
 * `CupomList` client island.
 */
export default async function CuponsPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("cupons")
    .select("*")
    .order("created_at", { ascending: false });

  const cupons = (data ?? []) as CupomRow[];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10">
      <h1 className="font-heading text-xl font-bold text-brand-navy">Cupons</h1>
      <CupomList initialCupons={cupons} />
    </main>
  );
}
