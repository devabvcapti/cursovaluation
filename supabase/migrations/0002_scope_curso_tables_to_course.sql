-- This Supabase project (abvcap-congress-2025) is shared with ABVCAP's
-- events/congress systems, which already have their own unrelated tables
-- (e.g. coupon_categories, a simple coupon->category classification used by
-- the event-registration import — not a discount system, and structurally
-- nothing like this course's cupons). Renaming to a prefixed, course-program
-- name avoids any future ambiguity between the two, without touching
-- anything the events side owns.
--
-- associados (the ABVCAP member CNPJ list) is a company-wide fact, not tied
-- to any one course, so it is renamed but NOT scoped by curso_slug.
-- pedidos/cupons ARE course-specific, so a curso_slug column is added to
-- both, so a future course can reuse these same tables without its
-- orders/coupons mixing with this one's ("valuation").

alter table associados rename to curso_aprendacomquemfaz_associados;
alter table cupons rename to curso_aprendacomquemfaz_cupons;
alter table pedidos rename to curso_aprendacomquemfaz_pedidos;

alter table curso_aprendacomquemfaz_cupons add column curso_slug text not null default 'valuation';
alter table curso_aprendacomquemfaz_pedidos add column curso_slug text not null default 'valuation';

-- codigo was globally unique; now unique per course, so e.g. "BLACKFRIDAY10"
-- can exist independently for two different courses.
alter table curso_aprendacomquemfaz_cupons drop constraint cupons_codigo_key;
alter table curso_aprendacomquemfaz_cupons add constraint curso_aprendacomquemfaz_cupons_curso_slug_codigo_key unique (curso_slug, codigo);
