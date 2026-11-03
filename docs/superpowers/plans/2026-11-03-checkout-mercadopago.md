# Checkout Mercado Pago (Venda Direta) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the external Glueup sign-up link with a direct, embedded checkout (Mercado Pago Payment Brick) at `/inscricao`, with associado/não-associado pricing resolved from a Supabase CNPJ list, percentage coupons managed through an authenticated `/admin/cupons` area, and Resend confirmation emails on approved payment.

**Architecture:** A Next.js App Router feature slice: new `src/lib/*` modules for pricing/validation/Mercado Pago/Supabase access, four new `/api/checkout/*` routes plus one `/api/webhooks/mercadopago` route, a two-step `/inscricao` page (buyer form → embedded Payment Brick), and a Supabase-Auth-gated `/admin/cupons` CRUD area. All money math and side effects (DB writes, email, Mercado Pago calls) live in server-only code; the client only ever sees the final price and the Brick's own UI.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript (existing), Vitest + Testing Library (existing), `mercadopago` (official Node SDK v2) + `@mercadopago/sdk-react` (Payment Brick), `@supabase/supabase-js` + `@supabase/ssr`, Resend (existing).

**Spec:** [docs/superpowers/specs/2026-11-03-checkout-mercadopago-design.md](../specs/2026-11-03-checkout-mercadopago-design.md) — the plan argues from this spec; read both before implementing any task.

## Prerequisites (outside this plan, must exist before end-to-end testing)

These are account/infra steps for the user, not code tasks. Automated tests mock every external SDK, so Tasks 1–20 do not require these to exist to pass `npm test` — only the manual sandbox walkthrough in Task 17 needs them live:

- A Supabase project provisioned, with its URL, anon key, and service-role key available.
- A Mercado Pago application with sandbox (test) credentials: access token and public key; a configured webhook pointing at `<site>/api/webhooks/mercadopago` with its signing secret.
- At least one Supabase Auth user created (email/password) for ABVCAP staff, to log into `/admin/cupons`.
- The `associados` table populated from the CNPJ CSV (manual upload via the Supabase dashboard).

## Global Constraints

- Money amounts are JS `number` in whole BRL reais (e.g. `10000` = R$10.000,00) — matches the existing `formatInvestment`/`courseContent.investment` convention. No cents, no currency-string parsing beyond `Number(...)`.
- Every new side-effecting function (email send, external API call) returns `{ ok: true; ... } | { ok: false; reason: string }`, matching `send-lead-notification.ts`/`send-ementa-email.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` and `MERCADOPAGO_ACCESS_TOKEN` are server-only — never imported from a `"use client"` file.
- Path alias `@/*` → `./src/*` (`tsconfig.json`).
- Tests: Vitest with `environment: "jsdom"`, `globals: false` (explicit `describe/it/expect/vi` imports), external SDKs/network calls always mocked via `vi.mock(...)` — never call real Resend/Supabase/Mercado Pago in automated tests. Run a single file with `npx vitest run <path>`.
- New UI follows existing conventions: `cn()` from `@/lib/cn`, Tailwind utility classes, brand tokens `--color-brand-navy` (#112468) / `--color-brand-green` (#80c842) from `globals.css`.
- CNPJ and cupom are always optional checkout inputs; invalid/missing/not-found values degrade to the full (não-associado) price and never block submission.
- The server recomputes price at every step (preview, pedido creation, pagamento); a client-sent price is never trusted.

## Review Focus

- Associado price fields (`investment.associadoPrice`/`associadoEarlyBirdPrice`) are still `placeholder(...)` (no real number yet) — a CNPJ match must fall back to não-associado pricing instead of charging `NaN` or `R$0`. Covered in Task 6.
- The Mercado Pago webhook can redeliver the same `mp_payment_id` (at-least-once delivery) — reprocessing it must not double-send the confirmation email or double-increment a cupom's `usos_atuais`. Covered in Task 11.
- A cupom that was valid during the live price preview (Task 8) can expire, hit its `limite_uso`, or be deactivated by the time the buyer submits — `POST /api/checkout/pedido` (Task 9) must re-validate it independently rather than trusting the client's earlier preview response.
- The early-bird boundary (`earlyBirdDeadlineISO: "2026-12-20"`) must resolve consistently at the exact cutover instant — covered with an explicit before/at/after test in Task 6.
- `/api/admin/cupons` (Task 19) must reject an unauthenticated request with 401 and never create a cupom without a resolved `criado_por` — an unattributed cupom is a data-integrity bug, not a soft failure.

---

## Task 1: Dependencies and environment variables

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: the npm packages `mercadopago`, `@mercadopago/sdk-react`, `@supabase/supabase-js`, `@supabase/ssr` available to every later task.

- [ ] **Step 1: Install the new dependencies**

Run: `npm install mercadopago @mercadopago/sdk-react @supabase/supabase-js @supabase/ssr`

- [ ] **Step 2: Add the new environment variables to `.env.example`**

Append, each with a one-line comment matching the existing style (see current `RESEND_API_KEY`/`LEAD_NOTIFICATION_EMAIL` entries):

```
# Mercado Pago (https://www.mercadopago.com.br/developers) — checkout at /inscricao.
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Supabase (https://supabase.com) — associados/cupons/pedidos storage and /admin auth.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Absolute site URL, used to build absolute links in outgoing emails (e.g. /inscricao).
NEXT_PUBLIC_SITE_URL=https://curso-valuation.vercel.app
```

- [ ] **Step 3: Verify nothing broke**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add mercadopago and supabase dependencies"
```

---

## Task 2: Pricing content fields and internal checkout route

**Files:**
- Modify: `src/content/curso.ts`
- Modify: `src/content/curso.test.ts`
- Modify: `src/lib/send-ementa-email.ts`
- Modify: `src/lib/send-ementa-email.test.ts`

**Interfaces:**
- Produces: `courseContent.investment.associadoPrice: string`, `courseContent.investment.associadoEarlyBirdPrice: string`, `courseContent.investment.earlyBirdDeadlineISO: string`, and `courseContent.hero.checkoutUrl === courseContent.investment.checkoutUrl === "/inscricao"`. Later pricing/frontend tasks read these fields; `Button`-consuming components (Task 12) read the same `checkoutUrl` values unchanged.

- [ ] **Step 1: Update `CourseContent`'s `investment` type in `src/content/curso.ts`**

Add to the `investment` interface block: `associadoPrice: string`, `associadoEarlyBirdPrice: string`, `earlyBirdDeadlineISO: string`.

- [ ] **Step 2: Update the `investment` data object**

```ts
investment: {
  price: "10000",
  earlyBirdPrice: "9000",
  earlyBirdDeadline: "20 de dezembro de 2026",
  earlyBirdDeadlineISO: "2026-12-20",
  associadoPrice: placeholder("PREÇO ASSOCIADO"),
  associadoEarlyBirdPrice: placeholder("PREÇO ASSOCIADO EARLY BIRD"),
  seatsLimit: "Cerca de 20 vagas",
  nextCohortDate: "16 de fevereiro de 2027",
  workloadHours: "39h em sala + 23h em casa",
  checkoutUrl: "/inscricao",
},
```

Also change `hero.checkoutUrl` from the Glueup URL to `"/inscricao"`.

- [ ] **Step 3: Update `src/content/curso.test.ts`'s checkout-URL assertions**

Replace the existing `"has a real (non-placeholder) checkout URL..."` test body:

```ts
it("points the checkout URL at the internal /inscricao route", () => {
  expect(courseContent.investment.checkoutUrl).toBe("/inscricao");
  expect(courseContent.hero.checkoutUrl).toBe("/inscricao");
});

it("marks the associado price fields as pending", () => {
  expect(isPlaceholder(courseContent.investment.associadoPrice)).toBe(true);
  expect(isPlaceholder(courseContent.investment.associadoEarlyBirdPrice)).toBe(true);
});

it("has a machine-readable early-bird deadline matching the display date", () => {
  expect(courseContent.investment.earlyBirdDeadlineISO).toBe("2026-12-20");
});
```

- [ ] **Step 4: Run the content tests**

Run: `npx vitest run src/content/curso.test.ts`
Expected: PASS.

- [ ] **Step 5: Fix the now-broken absolute link in the ementa email**

`src/lib/send-ementa-email.ts`'s `buildEmailBody` currently interpolates `hero.checkoutUrl` directly into `` `Garanta sua vaga: ${hero.checkoutUrl}` ``; with `checkoutUrl` now `"/inscricao"` that line would render a bare relative path inside an email. Add a module-level constant:

```ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://curso-valuation.vercel.app";
```

and change that line to:

```ts
`Garanta sua vaga: ${SITE_URL}${hero.checkoutUrl}`,
```

- [ ] **Step 6: Add a test pinning the absolute link**

In `src/lib/send-ementa-email.test.ts`, add:

```ts
it("builds the checkout link as an absolute URL", async () => {
  sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
  const { sendEmentaEmail } = await import("./send-ementa-email");
  await sendEmentaEmail({ name: "Ana", email: "ana@example.com" });
  const call = sendMock.mock.calls[0][0];
  expect(call.text).toMatch(/https?:\/\/.*\/inscricao/);
});
```

- [ ] **Step 7: Run it, verify pass**

Run: `npx vitest run src/lib/send-ementa-email.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/content/curso.ts src/content/curso.test.ts src/lib/send-ementa-email.ts src/lib/send-ementa-email.test.ts
git commit -m "feat: add associado pricing fields and point checkout at /inscricao"
```

---

## Task 3: CPF validation and checkout payload validation

**Files:**
- Create: `src/lib/digits.ts`
- Create: `src/lib/digits.test.ts`
- Create: `src/lib/cpf.ts`
- Create: `src/lib/cpf.test.ts`
- Create: `src/lib/validate-checkout.ts`
- Create: `src/lib/validate-checkout.test.ts`

**Interfaces:**
- Produces: `onlyDigits(value: string): string`; `isValidCpf(value: string): boolean`; `CheckoutInput` (`{ nome: string; email: string; cpf: string; telefone: string; cnpj?: string; cupom?: string }`), `CheckoutValidationResult` (`{ valid: true } | { valid: false; errors: Partial<Record<"nome"|"email"|"cpf"|"telefone", string>> }`), `validateCheckout(data: CheckoutInput): CheckoutValidationResult`.
- Consumes: none (pure, no I/O).

- [ ] **Step 1: Write `digits.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { onlyDigits } from "./digits";

describe("onlyDigits", () => {
  it("strips everything but digits", () => {
    expect(onlyDigits("111.444.777-35")).toBe("11144477735");
    expect(onlyDigits("(11) 99148-0203")).toBe("11991480203");
  });
});
```

- [ ] **Step 2: Run it, verify it fails** (module doesn't exist)

- [ ] **Step 3: Implement `onlyDigits(value: string): string` in `src/lib/digits.ts`**

`value.replace(/\D/g, "")`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `cpf.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isValidCpf } from "./cpf";

describe("isValidCpf", () => {
  it("accepts a CPF with valid check digits, with or without punctuation", () => {
    expect(isValidCpf("11144477735")).toBe(true);
    expect(isValidCpf("111.444.777-35")).toBe(true);
  });
  it("rejects a CPF with wrong check digits", () => {
    expect(isValidCpf("12345678900")).toBe(false);
  });
  it("rejects all-repeated-digit sequences", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });
  it("rejects anything that isn't 11 digits", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});
```

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `isValidCpf(value: string): boolean` in `src/lib/cpf.ts`**

Normalize with `onlyDigits`. Reject if length ≠ 11 or all 11 digits are identical. Otherwise compute the standard CPF two-check-digit algorithm: first check digit from the first 9 digits with weights `10..2`, `mod 11`, remainder `<2 ⇒ 0` else `11 - remainder`, compared against digit 10; second check digit from the first 10 digits (including the just-validated digit 10) with weights `11..2`, same remainder rule, compared against digit 11.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Write `validate-checkout.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { validateCheckout } from "./validate-checkout";

const VALID = {
  nome: "Ana",
  email: "ana@example.com",
  cpf: "11144477735",
  telefone: "11991480203",
};

describe("validateCheckout", () => {
  it("accepts a fully valid payload with no cnpj/cupom", () => {
    expect(validateCheckout(VALID)).toEqual({ valid: true });
  });
  it("accepts a valid payload with cnpj and cupom present", () => {
    expect(validateCheckout({ ...VALID, cnpj: "11222333000181", cupom: "BLACKFRIDAY10" })).toEqual({
      valid: true,
    });
  });
  it("flags missing required fields", () => {
    const result = validateCheckout({ nome: "", email: "", cpf: "", telefone: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.nome).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.cpf).toBeDefined();
      expect(result.errors.telefone).toBeDefined();
    }
  });
  it("flags an invalid email format", () => {
    const result = validateCheckout({ ...VALID, email: "not-an-email" });
    expect(result.valid).toBe(false);
  });
  it("flags a CPF that fails the checksum", () => {
    const result = validateCheckout({ ...VALID, cpf: "12345678900" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.cpf).toBeDefined();
  });
  it("flags a telefone with too few digits", () => {
    const result = validateCheckout({ ...VALID, telefone: "123" });
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 10: Run it, verify it fails**

- [ ] **Step 11: Implement `validate-checkout.ts`**

Reuse the same permissive email regex as `validate-lead.ts` (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). `nome`/`email` required-non-blank like `validateLead`. `cpf` required, and must satisfy `isValidCpf` once passed through `onlyDigits`. `telefone` required; valid when `onlyDigits(telefone).length` is 10 or 11. `cnpj`/`cupom` are never validated here (optional, checked downstream by `lookupAssociado`/`resolveCupom` — an unrecognized value there degrades gracefully rather than failing validation).

- [ ] **Step 12: Run it, verify it passes**

- [ ] **Step 13: Commit**

```bash
git add src/lib/digits.ts src/lib/digits.test.ts src/lib/cpf.ts src/lib/cpf.test.ts src/lib/validate-checkout.ts src/lib/validate-checkout.test.ts
git commit -m "feat: add CPF validation and checkout payload validation"
```

---

## Task 4: Supabase schema and client factories

**Files:**
- Create: `supabase/migrations/0001_checkout.sql`
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/service-client.ts`
- Create: `src/lib/supabase/server-client.ts`
- Create: `src/lib/supabase/browser-client.ts`
- Create: `src/lib/supabase/service-client.test.ts`

**Interfaces:**
- Produces: `AssociadoRow`, `CupomRow`, `PedidoRow`, `PedidoStatus = "pending" | "approved" | "rejected" | "cancelled"`, `PaymentMethod = "credit_card" | "pix"` (all in `types.ts`); `getSupabaseServiceClient(): SupabaseClient` (server-only, service-role key, bypasses RLS); `getSupabaseServerClient(): Promise<SupabaseClient>` (cookie-bound, anon key + session, for `/admin`); `getSupabaseBrowserClient(): SupabaseClient` (anon key, client components).
- Consumes: env vars from Task 1 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

- [ ] **Step 1: Write the SQL migration** in `supabase/migrations/0001_checkout.sql`

```sql
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
```

Note in a PR/handoff comment that applying this file to the real Supabase project (via the Supabase SQL editor or CLI) is a manual prerequisite step, not something `npm test` exercises.

- [ ] **Step 2: Define row types** in `src/lib/supabase/types.ts`

```ts
export type PedidoStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PaymentMethod = "credit_card" | "pix";

export interface AssociadoRow {
  id: string;
  cnpj: string;
  razao_social: string | null;
  ativo: boolean;
  created_at: string;
}

export interface CupomRow {
  id: string;
  codigo: string;
  percentual_desconto: number;
  ativo: boolean;
  valido_de: string | null;
  valido_ate: string | null;
  limite_uso: number | null;
  usos_atuais: number;
  criado_por: string;
  created_at: string;
}

export interface PedidoRow {
  id: string;
  mp_payment_id: string | null;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cnpj_informado: string | null;
  is_associado: boolean;
  cupom_codigo: string | null;
  valor_base: number;
  valor_cobrado: number;
  status: PedidoStatus;
  payment_method: PaymentMethod | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Write `service-client.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createClientMock = vi.fn().mockReturnValue({ fromMarker: "service" });

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

describe("getSupabaseServiceClient", () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    createClientMock.mockClear();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  afterEach(() => {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("throws when the required env vars are missing", async () => {
    delete process.env.SUPABASE_URL;
    const { getSupabaseServiceClient } = await import("./service-client");
    expect(() => getSupabaseServiceClient()).toThrow();
  });

  it("creates a client with the service-role key", async () => {
    const { getSupabaseServiceClient } = await import("./service-client");
    getSupabaseServiceClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.anything(),
    );
  });
});
```

- [ ] **Step 4: Run it, verify it fails**

- [ ] **Step 5: Implement `getSupabaseServiceClient(): SupabaseClient` in `service-client.ts`**

Read `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; throw a descriptive `Error` if either is unset; otherwise `createClient(url, key, { auth: { persistSession: false } })`.

- [ ] **Step 6: Run it, verify it passes**

- [ ] **Step 7: Implement `getSupabaseServerClient(): Promise<SupabaseClient>` in `server-client.ts`**

Using `@supabase/ssr`'s `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll, setAll } })`, backed by `await cookies()` from `next/headers` (`getAll` reads `cookieStore.getAll()`; `setAll` writes each cookie via `cookieStore.set(name, value, options)`, wrapped in `try/catch` since Server Components may call this read-only — the middleware from Task 18 is what actually refreshes the session cookie). No automated test for this one (it depends on `next/headers`' request-scoped cookie store, which only exists inside a real request) — it is exercised indirectly by Task 19/20's route tests via mocking.

- [ ] **Step 8: Implement `getSupabaseBrowserClient(): SupabaseClient` in `browser-client.ts`**

`createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` from `@supabase/ssr`.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/0001_checkout.sql src/lib/supabase/
git commit -m "feat: add Supabase schema and client factories for checkout"
```

---

## Task 5: Associados lookup and cupom resolution

**Files:**
- Create: `src/lib/associados.ts`
- Create: `src/lib/associados.test.ts`
- Create: `src/lib/cupons.ts`
- Create: `src/lib/cupons.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServiceClient` (Task 4), `onlyDigits` (Task 3).
- Produces: `lookupAssociado(cnpj: string | null): Promise<boolean>`; `CupomResolution = { applied: false } | { applied: true; codigo: string; percentualDesconto: number }`, `resolveCupom(codigo: string | null): Promise<CupomResolution>`, `incrementCupomUso(codigo: string): Promise<void>`. Consumed by `src/lib/pricing.ts` (Task 6) and the webhook route (Task 11).

- [ ] **Step 1: Write `associados.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const eqChain = { eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock };
const serviceClientMock = {
  from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(eqChain) }),
};

vi.mock("./supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

describe("lookupAssociado", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("returns false for a null/blank cnpj without querying Supabase", async () => {
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado(null)).toBe(false);
    expect(await lookupAssociado("")).toBe(false);
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("returns true when an active associado row matches the normalized cnpj", async () => {
    maybeSingleMock.mockResolvedValue({ data: { ativo: true }, error: null });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("11.222.333/0001-81")).toBe(true);
  });

  it("returns false when no row matches", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("00000000000000")).toBe(false);
  });

  it("returns false (never throws) on a Supabase error", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "network error" } });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("11222333000181")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `lookupAssociado(cnpj: string | null): Promise<boolean>` in `associados.ts`**

Normalize with `onlyDigits`; return `false` immediately for an empty result (no query). Otherwise query `associados` for `cnpj = <normalized>` and `ativo = true` via `.select("ativo").eq("cnpj", normalized).eq("ativo", true).maybeSingle()`; return `true` only when `data` is non-null and `error` is null.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `cupons.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn() });
const serviceClientMock = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock }),
    update: updateMock,
  }),
};

vi.mock("./supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

const NOW = new Date("2026-11-03T12:00:00Z");

describe("resolveCupom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    maybeSingleMock.mockReset();
  });

  it("returns applied:false for a null/blank code without querying Supabase", async () => {
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom(null)).toEqual({ applied: false });
    expect(await resolveCupom("")).toEqual({ applied: false });
  });

  it("applies an active, in-window, under-limit coupon", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        codigo: "BLACKFRIDAY10",
        percentual_desconto: 10,
        ativo: true,
        valido_de: "2026-10-01T00:00:00Z",
        valido_ate: "2026-12-01T00:00:00Z",
        limite_uso: 100,
        usos_atuais: 5,
      },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("blackfriday10")).toEqual({
      applied: true,
      codigo: "BLACKFRIDAY10",
      percentualDesconto: 10,
    });
  });

  it("rejects an inactive coupon", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: false, valido_de: null, valido_ate: null, limite_uso: null, usos_atuais: 0 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("rejects a coupon past its valido_ate", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: true, valido_de: null, valido_ate: "2026-01-01T00:00:00Z", limite_uso: null, usos_atuais: 0 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("rejects a coupon that reached its limite_uso", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: true, valido_de: null, valido_ate: null, limite_uso: 5, usos_atuais: 5 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("returns applied:false when no coupon matches the code", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("DOES-NOT-EXIST")).toEqual({ applied: false });
  });
});
```

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `cupons.ts`**

`resolveCupom(codigoRaw)`: return `{ applied: false }` immediately if blank. Otherwise uppercase-trim the code, query `cupons` by `.select("codigo, percentual_desconto, ativo, valido_de, valido_ate, limite_uso, usos_atuais").eq("codigo", normalized).maybeSingle()`. Return `{ applied: false }` if no row, Supabase error, `ativo === false`, `valido_de` is set and in the future, `valido_ate` is set and in the past, or `limite_uso` is set and `usos_atuais >= limite_uso`. Otherwise `{ applied: true, codigo: row.codigo, percentualDesconto: row.percentual_desconto }`.

`incrementCupomUso(codigo: string): Promise<void>`: fetch current `usos_atuais` for `codigo`, then `update({ usos_atuais: current + 1 }).eq("codigo", codigo)`. Swallow/log errors — called from the webhook handler (Task 11), where a failed increment must not block the confirmation email.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Commit**

```bash
git add src/lib/associados.ts src/lib/associados.test.ts src/lib/cupons.ts src/lib/cupons.test.ts
git commit -m "feat: add associado lookup and coupon resolution"
```

---

## Task 6: Price resolution

**Files:**
- Create: `src/lib/pricing.ts`
- Create: `src/lib/pricing.test.ts`

**Interfaces:**
- Consumes: `lookupAssociado`, `resolveCupom` (Task 5); `courseContent.investment` (Task 2).
- Produces: `PriceResolution = { isAssociado: boolean; cupomAplicado: string | null; valorBase: number; valorCobrado: number }`, `resolvePrice(params: { cnpj?: string | null; cupom?: string | null }): Promise<PriceResolution>`. Consumed by Tasks 8, 9.

- [ ] **Step 1: Write `pricing.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const lookupAssociadoMock = vi.fn();
const resolveCupomMock = vi.fn();

vi.mock("./associados", () => ({ lookupAssociado: lookupAssociadoMock }));
vi.mock("./cupons", () => ({ resolveCupom: resolveCupomMock }));

describe("resolvePrice", () => {
  beforeEach(() => {
    lookupAssociadoMock.mockReset();
    resolveCupomMock.mockReset();
    resolveCupomMock.mockResolvedValue({ applied: false });
    vi.useFakeTimers();
  });

  it("charges full price before the early-bird deadline for a non-associado, no coupon", async () => {
    vi.setSystemTime(new Date("2026-12-19T23:59:59Z"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result).toEqual({ isAssociado: false, cupomAplicado: null, valorBase: 9000, valorCobrado: 9000 });
  });

  it("charges the non-early-bird full price exactly at the deadline instant and after", async () => {
    vi.setSystemTime(new Date("2026-12-20T00:00:00Z"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result.valorBase).toBe(10000);
  });

  it("falls back to non-associado pricing while the associado price is still a placeholder", async () => {
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
    lookupAssociadoMock.mockResolvedValue(true);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: "11222333000181", cupom: null });
    expect(result.isAssociado).toBe(true);
    expect(result.valorBase).toBe(9000); // non-associado early-bird price, not NaN
  });

  it("applies a resolved coupon's percentage on top of the base price", async () => {
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
    lookupAssociadoMock.mockResolvedValue(false);
    resolveCupomMock.mockResolvedValue({ applied: true, codigo: "PROMO10", percentualDesconto: 10 });
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: "promo10" });
    expect(result).toEqual({
      isAssociado: false,
      cupomAplicado: "PROMO10",
      valorBase: 9000,
      valorCobrado: 8100,
    });
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `resolvePrice` in `pricing.ts`**

```ts
export interface PriceResolution {
  isAssociado: boolean;
  cupomAplicado: string | null;
  valorBase: number;
  valorCobrado: number;
}

export async function resolvePrice(params: { cnpj?: string | null; cupom?: string | null }): Promise<PriceResolution>
```

Body: call `lookupAssociado(params.cnpj ?? null)` and `resolveCupom(params.cupom ?? null)` (can run in parallel via `Promise.all`). Determine `isEarlyBird = new Date() < new Date(courseContent.investment.earlyBirdDeadlineISO)` (strictly-before, so the deadline instant itself is already "not early-bird" — matches the test above). Pick the non-associado figure first: `Number(isEarlyBird ? investment.earlyBirdPrice : investment.price)`. If `isAssociado`, try the associado figure (`Number(isEarlyBird ? investment.associadoEarlyBirdPrice : investment.associadoPrice)`); use it only when it is a finite number (`Number.isFinite`) — otherwise keep the non-associado figure and `console.warn("[pricing] associado price not configured yet, falling back to non-associado price")`. That chosen number is `valorBase`. Apply the coupon: `valorCobrado = cupom.applied ? round2(valorBase * (1 - cupom.percentualDesconto / 100)) : valorBase`, where `round2(n) = Math.round(n * 100) / 100`. Return `{ isAssociado, cupomAplicado: cupom.applied ? cupom.codigo : null, valorBase, valorCobrado }`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing.ts src/lib/pricing.test.ts
git commit -m "feat: add price resolution combining associado and coupon discounts"
```

---

## Task 7: Mercado Pago payments client wrapper

**Files:**
- Create: `src/lib/mercadopago-client.ts`
- Create: `src/lib/mercadopago-client.test.ts`

**Interfaces:**
- Produces:
```ts
export type MpPaymentStatus = "approved" | "in_process" | "rejected" | "cancelled";
export interface MpPaymentResult {
  ok: true;
  mpPaymentId: string;
  status: MpPaymentStatus;
  pix?: { qrCode: string; qrCodeBase64: string };
}
export interface CreatePaymentInput {
  pedidoId: string;
  transactionAmount: number;
  payer: { email: string; firstName: string; identificationNumber: string };
  formData: Record<string, unknown>; // the Payment Brick's onSubmit formData, forwarded as-is
}
export async function createMpPayment(input: CreatePaymentInput): Promise<MpPaymentResult | { ok: false; reason: string }>
export async function getMpPayment(mpPaymentId: string): Promise<{ ok: true; status: MpPaymentStatus } | { ok: false; reason: string }>
```
- Consumed by: Task 10 (`createMpPayment`) and Task 11's webhook route (`getMpPayment`). `MpPaymentStatus` is Mercado Pago's own vocabulary (what the Brick/webhook need to render Pix-pending UI correctly); it is wider than `PedidoStatus` (Task 4), which has no `"in_process"` — Tasks 10 and 11 map `"in_process"` to our own `"pending"` before writing to the `pedidos` row, and return the raw `MpPaymentStatus` to the caller untouched.

- [ ] **Step 1: Write `mercadopago-client.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createMock = vi.fn();
const getMock = vi.fn();

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn().mockImplementation(() => ({ create: createMock, get: getMock })),
}));

describe("createMpPayment", () => {
  const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  beforeEach(() => {
    createMock.mockReset();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  });
  afterEach(() => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = originalToken;
  });

  const INPUT = {
    pedidoId: "pedido-1",
    transactionAmount: 9000,
    payer: { email: "ana@example.com", firstName: "Ana", identificationNumber: "11144477735" },
    formData: { token: "tok", payment_method_id: "visa", installments: 1 },
  };

  it("fails without throwing when MERCADOPAGO_ACCESS_TOKEN is missing", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result.ok).toBe(false);
  });

  it("creates a payment with external_reference set to the pedidoId", async () => {
    createMock.mockResolvedValue({ id: 123, status: "approved" });
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({ ok: true, mpPaymentId: "123", status: "approved" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ external_reference: "pedido-1", transaction_amount: 9000 }),
      }),
    );
  });

  it("includes pix QR data when the payment response carries point_of_interaction", async () => {
    createMock.mockResolvedValue({
      id: 456,
      status: "in_process",
      point_of_interaction: { transaction_data: { qr_code: "000...", qr_code_base64: "iVBORw0K..." } },
    });
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({
      ok: true,
      mpPaymentId: "456",
      status: "in_process",
      pix: { qrCode: "000...", qrCodeBase64: "iVBORw0K..." },
    });
  });

  it("returns ok:false when the SDK throws", async () => {
    createMock.mockRejectedValue(new Error("mp down"));
    const { createMpPayment } = await import("./mercadopago-client");
    const result = await createMpPayment(INPUT);
    expect(result).toEqual({ ok: false, reason: "mp down" });
  });
});

describe("getMpPayment", () => {
  beforeEach(() => {
    getMock.mockReset();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  });

  it("fetches a payment by id and maps its status", async () => {
    getMock.mockResolvedValue({ id: 123, status: "approved" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({ ok: true, status: "approved" });
  });

  it("passes through a cancelled status (e.g. an expired Pix charge)", async () => {
    getMock.mockResolvedValue({ id: 123, status: "cancelled" });
    const { getMpPayment } = await import("./mercadopago-client");
    expect(await getMpPayment("123")).toEqual({ ok: true, status: "cancelled" });
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `mercadopago-client.ts`**

Build the `MercadoPagoConfig`/`Payment` instances inside each function (not at module load) so the mocked `MERCADOPAGO_ACCESS_TOKEN` check in the first test runs before any SDK call. `createMpPayment`: return `{ ok: false, reason: "MERCADOPAGO_ACCESS_TOKEN is not configured" }` if the env var is unset; otherwise call `payment.create({ body: { transaction_amount: input.transactionAmount, external_reference: input.pedidoId, payer: { email: input.payer.email, first_name: input.payer.firstName, identification: { type: "CPF", number: input.payer.identificationNumber } }, ...input.formData } })` inside a `try/catch`, mapping a thrown error to `{ ok: false, reason: error.message }`. On success, map `response.status` (Mercado Pago only ever returns `approved`/`in_process`/`rejected` as the synchronous result of `POST /v1/payments`) and, when `response.point_of_interaction?.transaction_data` is present, include `pix: { qrCode: ...qr_code, qrCodeBase64: ...qr_code_base64 }`. `getMpPayment`: same config guard, `payment.get({ id: mpPaymentId })`, map `response.status`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/lib/mercadopago-client.ts src/lib/mercadopago-client.test.ts
git commit -m "feat: add Mercado Pago payments API client wrapper"
```

---

## Task 8: Order confirmation and notification emails

**Files:**
- Create: `src/lib/send-order-confirmation-email.ts`
- Create: `src/lib/send-order-confirmation-email.test.ts`
- Create: `src/lib/send-order-notification-email.ts`
- Create: `src/lib/send-order-notification-email.test.ts`

**Interfaces:**
- Consumes: `PedidoRow` (Task 4).
- Produces: `sendOrderConfirmationEmail(pedido: PedidoRow): Promise<{ ok: true } | { ok: false; reason: string }>`, `sendOrderNotificationEmail(pedido: PedidoRow): Promise<{ ok: true } | { ok: false; reason: string }>`. Consumed by the webhook route (Task 11).

- [ ] **Step 1: Write `send-order-confirmation-email.test.ts`** (mirror the structure of `send-lead-notification.test.ts`: mock `resend`, assert `ok:false` when `RESEND_API_KEY` is missing, assert the recipient is `pedido.email`, assert `ok:false` passthrough on a Resend error)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `send-order-confirmation-email.ts`**

`FROM_ADDRESS = "ABVCAP <contato@resend.abvcap.com.br>"`. Subject: `"Matrícula confirmada — Curso de Valuation ABVCAP"`. Body includes `pedido.nome`, `formatInvestment(String(pedido.valor_cobrado))`, and `courseContent.investment.nextCohortDate`. Same `{ ok }`/error-mapping shape as `sendEmentaEmail`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `send-order-notification-email.test.ts`** (mirror `send-lead-notification.test.ts`: recipient defaults to `ti@abvcap.com.br` / overridable via `LEAD_NOTIFICATION_EMAIL`, same as the existing lead notification)

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `send-order-notification-email.ts`**

Reuse `getRecipient()`'s `LEAD_NOTIFICATION_EMAIL`-or-`ti@abvcap.com.br` pattern from `send-lead-notification.ts`. Subject: `"Nova matrícula paga — Curso Valuation ABVCAP"`. Body: `nome`, `email`, `cpf`, `telefone`, `is_associado`, `cupom_codigo`, `valor_cobrado`, `payment_method`.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Commit**

```bash
git add src/lib/send-order-confirmation-email.ts src/lib/send-order-confirmation-email.test.ts src/lib/send-order-notification-email.ts src/lib/send-order-notification-email.test.ts
git commit -m "feat: add order confirmation and internal notification emails"
```

---

## Task 9: Checkout API routes — price preview and pedido creation

**Files:**
- Create: `src/app/api/checkout/preco/route.ts`
- Create: `src/app/api/checkout/preco/route.test.ts`
- Create: `src/app/api/checkout/pedido/route.ts`
- Create: `src/app/api/checkout/pedido/route.test.ts`

**Interfaces:**
- Consumes: `resolvePrice` (Task 6), `validateCheckout` (Task 3), `getSupabaseServiceClient` (Task 4).
- Produces: `POST /api/checkout/preco` → `200 { isAssociado, valorBase, valorCobrado, cupomAplicado }` from body `{ cnpj?: string; cupom?: string }`. `POST /api/checkout/pedido` → `200 { pedidoId: string, valorCobrado: number }` from a full `CheckoutInput` body, or `400 { errors }` on validation failure. Consumed by Task 15 (`CheckoutForm`) and Task 10 (`pagamento` route reads the created `pedidos` row by id).

- [ ] **Step 1: Write `preco/route.test.ts`** (pattern after `api/lead/route.test.ts`: mock `@/lib/pricing`, assert the route calls `resolvePrice` with the parsed body and returns its result as JSON with `status: 200`; assert a non-object/invalid JSON body still returns 200 by treating missing fields as `null`, since this is a non-blocking preview)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `preco/route.ts`**

Parse the JSON body defensively (same `try { await request.json() } catch { body = {} }` pattern as `api/lead/route.ts`). Extract `cnpj`/`cupom` as strings-or-undefined. Call `resolvePrice({ cnpj, cupom })`. Return `NextResponse.json(result, { status: 200 })`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `pedido/route.test.ts`** (mock `@/lib/validate-checkout`, `@/lib/pricing`, and `@/lib/supabase/service-client`; assert: invalid payload → 400 with no Supabase call; valid payload → calls `resolvePrice` with the submitted `cnpj`/`cupom` (re-validating server-side, never trusting a client-sent price), inserts one row into `pedidos` with `status: "pending"` and the freshly resolved `valor_base`/`valor_cobrado`, and returns `200 { pedidoId, valorCobrado }`)

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `pedido/route.ts`**

Parse body, run `validateCheckout`; on failure return `400 { errors }`. On success, call `resolvePrice({ cnpj: body.cnpj, cupom: body.cupom })`, then insert into `pedidos` via `getSupabaseServiceClient().from("pedidos").insert({ nome, email, cpf, telefone, cnpj_informado: body.cnpj ?? null, is_associado: price.isAssociado, cupom_codigo: price.cupomAplicado, valor_base: price.valorBase, valor_cobrado: price.valorCobrado, status: "pending" }).select("id").single()`. On a Supabase error, return `502 { errors: { nome: "Não foi possível iniciar o pagamento agora." } }` (mirrors the existing `/api/lead` 502 pattern). On success, return `200 { pedidoId: data.id, valorCobrado: price.valorCobrado }`.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Commit**

```bash
git add src/app/api/checkout/preco src/app/api/checkout/pedido/route.ts src/app/api/checkout/pedido/route.test.ts
git commit -m "feat: add checkout price-preview and pedido-creation API routes"
```

---

## Task 10: Checkout API route — pagamento

**Files:**
- Create: `src/app/api/checkout/pagamento/route.ts`
- Create: `src/app/api/checkout/pagamento/route.test.ts`

**Interfaces:**
- Consumes: `createMpPayment` (Task 7), `getSupabaseServiceClient` (Task 4), `PedidoRow` (Task 4).
- Produces: `POST /api/checkout/pagamento` from body `{ pedidoId: string; formData: Record<string, unknown>; paymentMethodId: string }` → `200 { status: "approved"|"in_process"|"rejected", pix?: { qrCode, qrCodeBase64 } }`, or `404` if `pedidoId` doesn't match a row, or `502` if Mercado Pago call fails. Consumed by Task 16 (`PaymentStep`).

- [ ] **Step 1: Write `pagamento/route.test.ts`** (mock `@/lib/mercadopago-client` and `@/lib/supabase/service-client`; cases: unknown `pedidoId` → 404, no MP call; known pedido → fetches the row for `nome`/`email`/`cpf`, calls `createMpPayment` with `transactionAmount: pedido.valor_cobrado` and the forwarded `formData`, updates the `pedidos` row with `mp_payment_id`, `payment_method` derived from `paymentMethodId` (`"pix"` ⇒ `"pix"`, anything else ⇒ `"credit_card"`), and returns `200` with the **raw** Mercado Pago status and, when present, the `pix` field; assert that when `createMpPayment` resolves `status: "in_process"`, the row is updated with `status: "pending"` (our schema has no `"in_process"`) while the JSON response still reports `"in_process"`; a `createMpPayment` failure returns `502` and leaves the pedido's status untouched)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `pagamento/route.ts`**

Fetch the pedido by `id` from `pedidos`; `404` if missing. Call `createMpPayment({ pedidoId, transactionAmount: pedido.valor_cobrado, payer: { email: pedido.email, firstName: pedido.nome.split(" ")[0], identificationNumber: pedido.cpf }, formData: body.formData })`. On `{ ok: false }`, return `502 { errors: { nome: "Não foi possível processar o pagamento agora." } }`. On success, map `const pedidoStatus = result.status === "in_process" ? "pending" : result.status;` (our `PedidoStatus`, Task 4, has no `"in_process"` — an unsettled Pix is still just "pending" from our side), then `update({ mp_payment_id: result.mpPaymentId, status: pedidoStatus, payment_method: body.paymentMethodId === "pix" ? "pix" : "credit_card" }).eq("id", pedidoId)`. Return `200 { status: result.status, pix: result.pix }` — the **unmapped** `result.status`, since the frontend (Task 16) needs to distinguish `"in_process"` to show the Pix-waiting UI.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/pagamento
git commit -m "feat: add checkout pagamento API route"
```

---

## Task 11: Mercado Pago webhook

**Files:**
- Create: `src/lib/verify-mp-webhook-signature.ts`
- Create: `src/lib/verify-mp-webhook-signature.test.ts`
- Create: `src/app/api/webhooks/mercadopago/route.ts`
- Create: `src/app/api/webhooks/mercadopago/route.test.ts`

**Interfaces:**
- Consumes: `getMpPayment` (Task 7), `getSupabaseServiceClient` (Task 4), `sendOrderConfirmationEmail`/`sendOrderNotificationEmail` (Task 8), `incrementCupomUso` (Task 5).
- Produces: `verifyMpWebhookSignature(params: { xSignature: string; xRequestId: string; dataId: string; secret: string }): boolean`; `POST /api/webhooks/mercadopago` always returns `200` to Mercado Pago (per its retry contract — a non-2xx triggers redelivery, which is fine, but an unverified-signature request should be rejected with `401` specifically, not retried as if transient).

- [ ] **Step 1: Write `verify-mp-webhook-signature.test.ts`**

```ts
import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyMpWebhookSignature } from "./verify-mp-webhook-signature";

function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

describe("verifyMpWebhookSignature", () => {
  it("accepts a correctly computed signature", () => {
    const ts = "1700000000";
    const v1 = sign("whsec", "123", "req-1", ts);
    expect(
      verifyMpWebhookSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(
      verifyMpWebhookSignature({ xSignature: "ts=1700000000,v1=deadbeef", xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(false);
  });

  it("rejects a malformed x-signature header", () => {
    expect(
      verifyMpWebhookSignature({ xSignature: "garbage", xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `verify-mp-webhook-signature.ts`**

Parse `xSignature` (format `ts=<unix>,v1=<hex>`) into `ts`/`v1` via a simple split on `,` then `=`; return `false` if either part is missing. Build the manifest string `` `id:${dataId};request-id:${xRequestId};ts:${ts};` `` and compute `createHmac("sha256", secret).update(manifest).digest("hex")` (from `node:crypto`); return whether it matches `v1` (use `timingSafeEqual` on same-length buffers; fall back to `false` on a length mismatch rather than throwing).

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `mercadopago/route.test.ts`** (mock `@/lib/verify-mp-webhook-signature`, `@/lib/mercadopago-client`, `@/lib/supabase/service-client`, `@/lib/cupons`, `@/lib/send-order-confirmation-email`, `@/lib/send-order-notification-email`)

Cases:
- Invalid signature → `401`, no Supabase/email calls.
- Valid signature, `getMpPayment` reports `"approved"`, matching `pedidos` row currently `"pending"` → updates `status` to `"approved"`, calls `incrementCupomUso` only when the row's `cupom_codigo` is non-null, sends both emails, returns `200`.
- Same payload processed twice (row already `"approved"`) → updates nothing further, does **not** call either email function or `incrementCupomUso` a second time, still returns `200`. (Review Focus: idempotency.)
- `getMpPayment` reports `"rejected"` → updates `status` to `"rejected"`, sends no emails, returns `200`.
- `getMpPayment` reports `"in_process"` on a row already `"pending"` → updates nothing (already `"pending"` under our mapping) and sends no emails, still returns `200`. (Confirms the `in_process`→`pending` mapping doesn't cause a spurious "status changed" update loop.)
- `getMpPayment` reports `"cancelled"` (e.g. an expired Pix charge) on a row currently `"pending"` → updates `status` to `"cancelled"`, sends no emails, returns `200`.
- No `pedidos` row matches the payment's `external_reference`/`mp_payment_id` → returns `200` anyway (nothing to retry) and logs a warning.

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `mercadopago/route.ts`**

Read `x-signature`/`x-request-id` headers and the body's `data.id` (Mercado Pago's webhook payload shape: `{ action, data: { id } }`). Call `verifyMpWebhookSignature` with `MERCADOPAGO_WEBHOOK_SECRET`; on failure, return `401`. Otherwise call `getMpPayment(data.id)`; on failure, return `200` (log and let Mercado Pago retry naturally — do not 500, which would also trigger a retry but noisily). Find the `pedidos` row by `mp_payment_id = data.id`; if none, log and return `200`. Map the fetched `MpPaymentStatus` to our `PedidoStatus` the same way as Task 10 (`"in_process" → "pending"`, everything else passes through unchanged) — call this `nextStatus`. If the row's `status` already equals `nextStatus`, return `200` without side effects (idempotency guard — this is also what makes the `in_process` case above a no-op, since it maps to the same `"pending"` the row is already in). Otherwise update `status` to `nextStatus`; when `nextStatus` is `"approved"`, additionally: call `incrementCupomUso(row.cupom_codigo)` if set, then `Promise.all([sendOrderConfirmationEmail(row), sendOrderNotificationEmail(row)])`, logging (not throwing on) either failing — matches the existing `/api/lead` pattern of logging a notification failure without failing the request. Always return `200` once signature verification passed.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Commit**

```bash
git add src/lib/verify-mp-webhook-signature.ts src/lib/verify-mp-webhook-signature.test.ts src/app/api/webhooks/mercadopago
git commit -m "feat: add Mercado Pago webhook handler with idempotent status updates"
```

---

## Task 12: Pedido status polling route

**Files:**
- Create: `src/app/api/checkout/pedido/[id]/route.ts`
- Create: `src/app/api/checkout/pedido/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServiceClient` (Task 4).
- Produces: `GET /api/checkout/pedido/:id` → `200 { status: PedidoStatus }` or `404`. Consumed by Task 16's Pix-polling UI.

- [ ] **Step 1: Write the route test** (mock `@/lib/supabase/service-client`; known id → `200 { status: row.status }`; unknown id → `404`)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement the route**

`GET(request, { params })` (Next.js 16 App Router dynamic route handler signature — `params` is a `Promise<{ id: string }>`, so `const { id } = await params;`). Query `pedidos` for `status` by `id`; `404` if not found, else `200 { status }`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/checkout/pedido/[id]"
git commit -m "feat: add pedido status polling route"
```

---

## Task 13: Button internal-link support

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Button.test.tsx`

**Interfaces:**
- Produces: `Button` keeps its exact existing props (`href`, `variant`, `children`, `className`); an `href` starting with `"/"` now renders via `next/link`'s `Link` (no `target`/`rel`), everything else keeps the current `<a target="_blank" rel="noopener noreferrer">` behavior. No call site's JSX changes — only `courseContent`'s `checkoutUrl` values (already updated in Task 2) change what gets rendered.

- [ ] **Step 1: Add a failing test to `Button.test.tsx`**

```ts
it("navigates in-place for an internal href, without opening a new tab", () => {
  render(<Button href="/inscricao" variant="primary">Quero me matricular</Button>);
  const link = screen.getByRole("link", { name: "Quero me matricular" });
  expect(link).toHaveAttribute("href", "/inscricao");
  expect(link).not.toHaveAttribute("target");
  expect(link).not.toHaveAttribute("rel");
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement the branch in `Button.tsx`**

Import `Link` from `"next/link"`. When `safeHref.startsWith("/")`, return `<Link href={safeHref} className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)}>{children}</Link>`; otherwise keep the existing `<a target="_blank" rel="noopener noreferrer">` branch unchanged. Update the component doc comment, which currently asserts "there is no in-app checkout" — that's no longer true.

- [ ] **Step 4: Run the full Button test file, verify all pass**

Run: `npx vitest run src/components/ui/Button.test.tsx`

- [ ] **Step 5: Run the full test suite** to confirm `Hero.test.tsx`/`Header.test.tsx` (which already assert `href` equals `courseContent.hero.checkoutUrl`, now `"/inscricao"`) still pass unchanged

Run: `npm test`
Expected: PASS — no other file needs edits, since those tests already read the href generically from `courseContent`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Button.test.tsx
git commit -m "feat: route internal Button hrefs through next/link"
```

---

## Task 14: FAQ refund-policy copy

**Files:**
- Modify: `src/content/curso.ts`
- Modify: `src/content/curso.test.ts`

**Interfaces:** none (content-only).

- [ ] **Step 1: Replace the refund-policy FAQ answer** in `curso.ts`

Current text references "a política comercial da plataforma de matrícula". Replace with:

```
"O cancelamento pode ser solicitado em até 7 dias corridos após a confirmação do pagamento, com reembolso integral, conforme o direito de arrependimento previsto no Código de Defesa do Consumidor para compras realizadas fora do estabelecimento comercial. Após esse prazo, consulte a equipe da ABVCAP pelo WhatsApp disponível neste site."
```

- [ ] **Step 2: Update `curso.test.ts`'s FAQ-objections assertion if needed**

The existing `/reembolso|cancelamento/` regex check against the **question** text is unaffected (only the answer changed); re-run to confirm.

- [ ] **Step 3: Run the content tests**

Run: `npx vitest run src/content/curso.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/content/curso.ts src/content/curso.test.ts
git commit -m "content: update refund policy FAQ answer for direct checkout"
```

---

## Task 15: CheckoutForm (step 1)

**Files:**
- Create: `src/components/checkout/CheckoutForm.tsx`
- Create: `src/components/checkout/CheckoutForm.test.tsx`

**Interfaces:**
- Consumes: `validateCheckout` (Task 3, client-side convenience check, mirroring `LeadCaptureForm`'s use of `validateLead`), `POST /api/checkout/preco` and `POST /api/checkout/pedido` (Task 9, via `fetch`).
- Produces:
```ts
export interface CheckoutFormProps {
  onPedidoCreated: (pedido: { pedidoId: string; valorCobrado: number; email: string }) => void;
}
export function CheckoutForm(props: CheckoutFormProps): JSX.Element
```
`email` is the form's own submitted value, echoed back so the parent doesn't need to duplicate form state. Consumed by Task 17's `/inscricao` page.

- [ ] **Step 1: Write `CheckoutForm.test.tsx`** (pattern after `LeadCaptureForm.test.tsx`; mock `global.fetch`)

Cases:
- Renders fields: nome, e-mail, CPF, telefone, CNPJ (opcional), cupom (opcional).
- Typing a CNPJ triggers a debounced `POST /api/checkout/preco` call and displays the returned `valorCobrado` (formatted via `formatInvestment`).
- Submitting with invalid data (e.g. empty nome) shows inline errors and never calls `POST /api/checkout/pedido`.
- Submitting valid data calls `POST /api/checkout/pedido` with the form's values and, on a `200` response, calls `onPedidoCreated({ pedidoId, valorCobrado, email })`, where `email` is the form's own submitted value and `pedidoId`/`valorCobrado` come from the response body.
- A non-OK response from `/api/checkout/pedido` shows a generic retry error and does not call `onPedidoCreated`.

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `CheckoutForm.tsx`**

Follow `LeadCaptureForm.tsx`'s exact structural conventions: `useId()`-based field ids, `FIELD_CLASSES`/`LABEL_CLASSES`/`ERROR_TEXT_CLASSES` constants (same values), controlled inputs, `validateCheckout` run on submit before any network call. Debounce the price-preview call (CNPJ/cupom `onChange`, ~400ms, e.g. via a `useEffect` + `setTimeout`/clearTimeout) against `/api/checkout/preco`; render the live price (`formatInvestment(String(preview.valorCobrado))`) plus a small note when `preview.isAssociado` is true. On submit, POST the full payload to `/api/checkout/pedido`; call `props.onPedidoCreated({ pedidoId: body.pedidoId, valorCobrado: body.valorCobrado })` on success.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/checkout/CheckoutForm.tsx src/components/checkout/CheckoutForm.test.tsx
git commit -m "feat: add checkout step 1 form with live price preview"
```

---

## Task 16: PaymentStep (step 2, Payment Brick)

**Files:**
- Create: `src/components/checkout/PaymentStep.tsx`
- Create: `src/components/checkout/PaymentStep.test.tsx`

**Interfaces:**
- Consumes: `@mercadopago/sdk-react`'s `initMercadoPago`/`Payment`; `POST /api/checkout/pagamento`, `GET /api/checkout/pedido/:id` (Task 10, 12, via `fetch`).
- Produces:
```ts
export interface PaymentStepProps {
  pedidoId: string;
  valorCobrado: number;
  email: string;
}
export function PaymentStep(props: PaymentStepProps): JSX.Element
```
Consumed by Task 17.

- [ ] **Step 1: Write `PaymentStep.test.tsx`**

Mock `@mercadopago/sdk-react`'s `Payment` component as a stub that exposes its `onSubmit` prop via a test button (standard pattern for testing Brick wrappers — the real Brick is an iframe we don't render in jsdom):

```ts
vi.mock("@mercadopago/sdk-react", () => ({
  initMercadoPago: vi.fn(),
  Payment: (props: { onSubmit: (args: { formData: Record<string, unknown> }) => Promise<void> }) => (
    <button onClick={() => props.onSubmit({ formData: { token: "tok", payment_method_id: "visa" } })}>
      submit-brick
    </button>
  ),
}));
```

Cases:
- Renders the mocked Brick.
- Clicking the stub submit calls `POST /api/checkout/pagamento` with `{ pedidoId, formData, paymentMethodId: "visa" }`; a `200 { status: "approved" }` response shows an approved message.
- A `200 { status: "in_process", pix: { qrCode, qrCodeBase64 } }` response renders the QR image (`<img src="data:image/png;base64,...">`) and starts polling `GET /api/checkout/pedido/:id` (assert `fetch` was called with that URL at least once after advancing fake timers).
- A `200 { status: "rejected" }` response shows a decline message with no QR code.

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `PaymentStep.tsx`**

`"use client"`. Call `initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, { locale: "pt-BR" })` once (module-level, matching the SDK's documented one-time-init contract). Render `<Payment initialization={{ amount: props.valorCobrado, payer: { email: props.email } }} customization={{ paymentMethods: { creditCard: "all", bankTransfer: "all" } }} onSubmit={handleSubmit} onError={handleError} />`. `handleSubmit` POSTs `{ pedidoId: props.pedidoId, formData, paymentMethodId: formData.payment_method_id }` to `/api/checkout/pagamento`; on `status === "approved"` show a confirmation message; on `"in_process"` with a `pix` field, render the QR and start a `setInterval` polling `/api/checkout/pedido/${pedidoId}` every few seconds until `status !== "pending"`/`"in_process"`, clearing the interval on unmount; on `"rejected"` show a retry message (the Brick itself stays mounted so the buyer can pick another card).

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/checkout/PaymentStep.tsx src/components/checkout/PaymentStep.test.tsx
git commit -m "feat: add embedded Mercado Pago Payment Brick step"
```

---

## Task 17: `/inscricao` page

**Files:**
- Create: `src/app/inscricao/page.tsx`
- Create: `src/app/inscricao/page.test.tsx`

**Interfaces:**
- Consumes: `CheckoutForm` (Task 15), `PaymentStep` (Task 16).

- [ ] **Step 1: Write `page.test.tsx`**

Mock `CheckoutForm` and `PaymentStep` as simple stubs (assert composition, not their internals, which already have their own tests). Cases:
- Renders `CheckoutForm` initially, not `PaymentStep`.
- After `CheckoutForm`'s stub calls `onPedidoCreated`, `PaymentStep` renders instead, receiving the passed `pedidoId`/`valorCobrado`/`email`.

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `page.tsx`**

`"use client"`. `useState` holding `pedido: { pedidoId: string; valorCobrado: number; email: string } | null`. Render `<Header />` + a `<Section>` wrapping either `<CheckoutForm onPedidoCreated={setPedido} />` or, once set, `<PaymentStep pedidoId={pedido.pedidoId} valorCobrado={pedido.valorCobrado} email={pedido.email} />`, then `<Footer />`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/app/inscricao
git commit -m "feat: add /inscricao checkout page"
```

---

## Task 18: Admin auth middleware and login page

**Files:**
- Create: `src/middleware.ts`
- Create: `src/middleware.test.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/page.test.tsx`

**Interfaces:**
- Consumes: `getSupabaseBrowserClient` (Task 4), `@supabase/ssr`'s `createServerClient`.
- Produces: unauthenticated requests to any `/admin/*` route except `/admin/login` redirect to `/admin/login`.

- [ ] **Step 1: Write `middleware.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue({ auth: { getUser: getUserMock } }),
}));

describe("middleware", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("redirects an unauthenticated request for /admin/cupons to /admin/login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { middleware } = await import("./middleware");
    const response = await middleware(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets an authenticated request through", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "ti@abvcap.com.br" } } });
    const { middleware } = await import("./middleware");
    const response = await middleware(new NextRequest(new URL("http://localhost/admin/cupons")));
    expect(response.status).toBe(200);
  });

  it("never redirects /admin/login itself, even unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { middleware } = await import("./middleware");
    const response = await middleware(new NextRequest(new URL("http://localhost/admin/login")));
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `src/middleware.ts`**

Standard `@supabase/ssr` Next.js middleware recipe: build a mutable `response = NextResponse.next({ request })`, construct `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } })`, call `const { data: { user } } = await supabase.auth.getUser()`. If `request.nextUrl.pathname` starts with `/admin` and is not `/admin/login`, and `user` is null, redirect (`NextResponse.redirect`) to `/admin/login`. Export `export const config = { matcher: ["/admin/:path*"] }`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `admin/login/page.test.tsx`** (mock `getSupabaseBrowserClient`; submitting valid credentials calls `supabase.auth.signInWithPassword({ email, password })` and, on success, navigates to `/admin/cupons` via `next/navigation`'s `useRouter().push`; a failed sign-in shows an inline error and does not navigate)

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `admin/login/page.tsx`**

`"use client"`. Simple email/password form styled like `LeadCaptureForm` (reuse the same field-class constants pattern). On submit, `const supabase = getSupabaseBrowserClient(); const { error } = await supabase.auth.signInWithPassword({ email, password });`; on success `router.push("/admin/cupons")`; on error, show `error.message`.

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Commit**

```bash
git add src/middleware.ts src/middleware.test.ts src/app/admin/login
git commit -m "feat: add Supabase Auth middleware and admin login page"
```

---

## Task 19: Admin cupons API routes

**Files:**
- Create: `src/lib/supabase/require-admin-session.ts`
- Create: `src/lib/supabase/require-admin-session.test.ts`
- Create: `src/app/api/admin/cupons/route.ts`
- Create: `src/app/api/admin/cupons/route.test.ts`
- Create: `src/app/api/admin/cupons/[codigo]/route.ts`
- Create: `src/app/api/admin/cupons/[codigo]/route.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServerClient` (Task 4).
- Produces: `requireAdminSession(): Promise<{ email: string } | null>`; `GET /api/admin/cupons` → `200 CupomRow[]` (401 if unauthenticated); `POST /api/admin/cupons` with `{ codigo, percentualDesconto, validoDe?, validoAte?, limiteUso? }` → `201 CupomRow` with `criado_por` set from the session (401 if unauthenticated, 400 on invalid body); `PATCH /api/admin/cupons/:codigo` with `{ ativo: boolean }` → `200 CupomRow` (401 if unauthenticated, 404 if no such code).

- [ ] **Step 1: Write `require-admin-session.test.ts`** (mock `@/lib/supabase/server-client`; returns `{ email }` when `auth.getUser()` resolves a user; returns `null` when it resolves no user or throws)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `require-admin-session.ts`**

```ts
export async function requireAdminSession(): Promise<{ email: string } | null>
```
`const supabase = await getSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); return user?.email ? { email: user.email } : null;` wrapped so any thrown error also yields `null`.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Write `admin/cupons/route.test.ts`** (mock `@/lib/supabase/require-admin-session` and `@/lib/supabase/service-client`)

Cases:
- `GET` without a session → `401`, no Supabase query.
- `GET` with a session → `200` with the listed rows.
- `POST` without a session → `401`, no insert.
- `POST` with a session and valid body → inserts with `criado_por` set to the session's email, `usos_atuais: 0`, `ativo: true`; returns `201` with the inserted row.
- `POST` with a missing `codigo` or non-numeric `percentualDesconto` → `400`, no insert.

- [ ] **Step 6: Run it, verify it fails**

- [ ] **Step 7: Implement `admin/cupons/route.ts`**

`GET`: `requireAdminSession()`; `401` if null; else `getSupabaseServiceClient().from("cupons").select("*").order("created_at", { ascending: false })`, return `200` with the rows. `POST`: same guard; validate `codigo` (non-blank string) and `percentualDesconto` (finite number between 0 and 100) inline — `400` with field errors otherwise; insert `{ codigo: codigo.trim().toUpperCase(), percentual_desconto: percentualDesconto, ativo: true, valido_de: validoDe ?? null, valido_ate: validoAte ?? null, limite_uso: limiteUso ?? null, usos_atuais: 0, criado_por: session.email }`; return `201` with the inserted row (`.select().single()`).

- [ ] **Step 8: Run it, verify it passes**

- [ ] **Step 9: Write `admin/cupons/[codigo]/route.test.ts`** (same session-guard cases as above for `PATCH`, plus: unknown `codigo` → `404`; known `codigo` → updates `ativo` and returns the updated row)

- [ ] **Step 10: Run it, verify it fails**

- [ ] **Step 11: Implement `admin/cupons/[codigo]/route.ts`**

`PATCH(request, { params })`, `const { codigo } = await params;`. Guard via `requireAdminSession()`. Update `cupons.set({ ativo: body.ativo }).eq("codigo", codigo).select().maybeSingle()`; `404` if no row matched, else `200` with the updated row.

- [ ] **Step 12: Run it, verify it passes**

- [ ] **Step 13: Commit**

```bash
git add src/lib/supabase/require-admin-session.ts src/lib/supabase/require-admin-session.test.ts src/app/api/admin
git commit -m "feat: add admin cupons API routes with session-guarded writes"
```

---

## Task 20: Admin cupons page UI

**Files:**
- Create: `src/app/admin/cupons/page.tsx`
- Create: `src/components/admin/CupomForm.tsx`
- Create: `src/components/admin/CupomForm.test.tsx`

**Interfaces:**
- Consumes: `GET`/`POST /api/admin/cupons`, `PATCH /api/admin/cupons/:codigo` (Task 19, via `fetch`).

- [ ] **Step 1: Write `CupomForm.test.tsx`** (mock `global.fetch`; submitting a valid `{ codigo, percentualDesconto }` POSTs to `/api/admin/cupons` and, on `201`, calls an `onCreated` prop with the new row; an invalid percentual (e.g. `150`) shows an inline error and never calls `fetch`; a `400` response from the server shows a generic error)

- [ ] **Step 2: Run it, verify it fails**

- [ ] **Step 3: Implement `CupomForm.tsx`**

`"use client"`. Fields: código, percentual de desconto, válido de/até (optional date inputs), limite de uso (optional number). Client-side guard mirrors the server's: non-blank código, `0 < percentualDesconto <= 100`. On submit, `POST /api/admin/cupons`; on `201`, call `props.onCreated(row)` and clear the form.

- [ ] **Step 4: Run it, verify it passes**

- [ ] **Step 5: Implement `src/app/admin/cupons/page.tsx`**

Server component (middleware already guarantees an authenticated session reaches here): fetch `cupons` directly via `getSupabaseServerClient()` (no need to go through the `GET` API route from inside a Server Component), render a table (código, percentual, ativo, usos_atuais / limite_uso, criado_por) plus a client island `<CupomList>` — a small `"use client"` wrapper rendering `<CupomForm onCreated={...}>` above the table and a per-row "ativar/desativar" button calling `PATCH /api/admin/cupons/:codigo`, updating local state on success. No dedicated test for this page beyond `CupomForm`'s own test and the API route tests from Task 19 — composing already-tested pieces, consistent with how `/inscricao`'s own page test (Task 17) only checks composition, not re-deriving each child's behavior.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, visit `/admin/login`, sign in with a real Supabase Auth test user (prerequisite, see top of plan), confirm redirect to `/admin/cupons`, create a cupom, confirm it appears with the signed-in email as `criado_por`.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/cupons src/components/admin
git commit -m "feat: add admin cupons management page"
```

---

## Final verification (after all tasks)

- [ ] Run the full test suite: `npm test` — expect all green.
- [ ] Run `npm run lint` and `npm run build` — expect both clean (the `build` step also catches any App Router route-typing mismatch across the new `/api/checkout/*`, `/api/admin/*`, `/inscricao`, and `/admin/*` routes).
- [ ] Manual sandbox walkthrough (needs the Prerequisites section's live credentials): complete `/inscricao` once with a Mercado Pago test card (approved), once with a declined test card, and once with test Pix; confirm the webhook flips `pedidos.status` and both emails arrive; confirm a cupom created in `/admin/cupons` discounts the preview price and its `usos_atuais` increments after an approved payment.
