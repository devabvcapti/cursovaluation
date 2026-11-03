create table associados (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null unique,
  razao_social text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  percentual_desconto numeric not null,
  ativo boolean not null default true,
  valido_de timestamptz,
  valido_ate timestamptz,
  limite_uso integer,
  usos_atuais integer not null default 0,
  criado_por text not null,
  created_at timestamptz not null default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  mp_payment_id text,
  nome text not null,
  email text not null,
  cpf text not null,
  telefone text not null,
  cnpj_informado text,
  is_associado boolean not null,
  cupom_codigo text,
  valor_base numeric not null,
  valor_cobrado numeric not null,
  status text not null default 'pending',
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- All access goes through the service-role key from server-only code
-- (see src/lib/supabase/service-client.ts); no anon/public policies are
-- defined, so Row Level Security denies all client-side access by default.
alter table associados enable row level security;
alter table cupons enable row level security;
alter table pedidos enable row level security;
