-- DEV experiment: an email-based associado lookup, alongside (not replacing)
-- curso_aprendacomquemfaz_associados' CNPJ-based one. GlueUp (ABVCAP's
-- membership platform) exports member contacts with email + empresa but no
-- CNPJ, so this table lets the checkout recognize a member by the email
-- they register with instead of requiring them to know/type their company's
-- CNPJ. Company-wide fact, not tied to any one course — same scoping choice
-- as curso_aprendacomquemfaz_associados (see 0002's comment).

create table curso_aprendacomquemfaz_associados_email (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  empresa text,
  created_at timestamptz not null default now()
);

alter table curso_aprendacomquemfaz_associados_email enable row level security;
