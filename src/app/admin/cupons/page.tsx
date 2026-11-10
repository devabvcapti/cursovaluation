import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin-session";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { TABLE_CUPONS } from "@/lib/supabase/table-names";
import { CURSO_SLUG } from "@/lib/curso-slug";
import type { CupomRow } from "@/lib/supabase/types";
import { CupomList } from "@/components/admin/CupomList";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

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
 * `curso_aprendacomquemfaz_cupons` with the service-role client: that table
 * has RLS enabled with no policies (Task 4 migration), so the
 * anon-key/session client would silently get zero rows back. Scoped to
 * `CURSO_SLUG` since this shared table can hold other courses' cupons too.
 * Interactivity (creating/toggling cupons) lives in the `CupomList` client
 * island.
 */
export default async function CuponsPage() {
  // Request-time only: without this, `next build` prerenders the page, and
  // any session-check failure at build time (e.g. Supabase env vars absent
  // from the build environment) gets baked in as a static 307 to
  // /admin/login — and the service-role read must never run at build either.
  await connection();

  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { data, error } = await getSupabaseServiceClient()
    .from(TABLE_CUPONS)
    .select("*")
    .eq("curso_slug", CURSO_SLUG)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-4xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Cupons de Desconto
          </h1>
          <p className="mt-4 font-body text-base leading-relaxed text-brand-navy/80">
            Crie e gerencie os cupons de desconto do curso Modelagem Financeira e Valuation.
          </p>

          {error ? (
            <p role="alert" className="mt-6 font-body text-sm text-red-600">
              Não foi possível carregar os cupons agora. Recarregue a página em instantes.
            </p>
          ) : (
            <div className="mt-10">
              <CupomList initialCupons={(data ?? []) as CupomRow[]} />
            </div>
          )}
        </div>
      </Section>
      <Footer />
    </>
  );
}
