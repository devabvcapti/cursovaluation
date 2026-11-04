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

1. **Database schema** — apply `supabase/migrations/0001_checkout.sql` to the
   Supabase project (SQL editor or `supabase db push`). The app never runs
   migrations itself.
2. **Disable public sign-ups** — in the Supabase project's Auth settings,
   turn off sign-ups. The admin area (`/admin`) lets in any Supabase Auth
   account (there is no in-app allowlist), so staff accounts must be created
   manually in the dashboard and sign-ups must stay disabled.
3. **Mercado Pago webhook** — in the Mercado Pago developer panel, set the
   webhook URL to `<site>/api/webhooks/mercadopago` (payment events) and copy
   its signing secret into `MERCADOPAGO_WEBHOOK_SECRET`. The app never sends a
   `notification_url`; this is configured only in the panel.
4. **Associados** — populate the `associados` table (CNPJ list, digits only)
   via the Supabase dashboard (CSV import). There is no in-app feature for it.
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
