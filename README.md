# Valuation — Landing Page (ABVCAP)

Sales landing page for ABVCAP's "Valuation" course, built with Next.js.

## Getting started

```bash
npm install
npm run dev     # local dev server
npm run test     # unit tests (Vitest)
npm run build    # production build
```

## Deploy checklist

Manual steps the app does not do for you — complete them before taking the
checkout live:

1. **Database schema** — apply `supabase/migrations/0001_checkout.sql` and
   `0002_scope_curso_tables_to_course.sql`, in order, to the Supabase project
   (SQL editor or `supabase db push`). The app never runs migrations itself.
   This project (`abvcap-congress-2025`) is **shared** with ABVCAP's
   events/congress systems — the checkout's tables are named
   `curso_aprendacomquemfaz_associados` / `_cupons` / `_pedidos` precisely to
   avoid colliding with that system's own tables (e.g. `coupon_categories`,
   an unrelated event-coupon classification table — never touch it from this
   app). `_cupons` and `_pedidos` additionally carry a `curso_slug` column
   (currently `"valuation"`, see `src/lib/curso-slug.ts`) so a future ABVCAP
   course can reuse the same two tables without its orders/coupons mixing
   with this course's. `associados` is intentionally NOT scoped by course —
   ABVCAP membership doesn't depend on which course is open.
2. **Microsoft SSO provider** — in the Supabase project's Auth settings,
   enable the Azure provider with ABVCAP's existing App Registration
   (Client ID/Secret/Tenant ID — never commit these). The admin area
   (`/admin`) only lets in the 7 accounts hardcoded in
   `src/lib/admin-allowlist.ts`; update that file (not Azure AD alone) if the
   list of who can manage coupons ever changes. Also disable public sign-ups
   in Supabase Auth as a second layer, since this project is shared.
3. **Mercado Pago webhook** — in the Mercado Pago developer panel, set the
   webhook URL to `<site>/api/webhooks/mercadopago` (payment events) and copy
   its signing secret into `MERCADOPAGO_WEBHOOK_SECRET`. The app never sends a
   `notification_url`; this is configured only in the panel.
4. **Associados** — populate the `curso_aprendacomquemfaz_associados` table
   (CNPJ list, digits only) via the Supabase dashboard (CSV import). There is
   no in-app feature for it.
5. **Associado prices** — replace the `placeholder(...)` values of
   `associadoPrice`/`associadoEarlyBirdPrice` in `src/content/curso.ts` with
   the real prices once decided (until then associados pay the regular price).
6. **Site URL** — set `NEXT_PUBLIC_SITE_URL` to the real production domain
   (it defaults to the Vercel preview URL, `https://curso-valuation.vercel.app`).

Environment variables used by the checkout: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
`NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `LEAD_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

## Docs

Plan and design spec for this landing page live at
`docs/superpowers/plans/2026-10-19-landing-valuation.md` and
`docs/superpowers/specs/2026-10-19-landing-valuation-design.md`.
