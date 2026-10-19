# Landing Page Valuation ABVCAP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Valuation course sales landing page (single page, Next.js, deployed to Vercel) implementing the 13-section architecture, bold navy/green ABVCAP visual direction, and animated hero defined in the design spec.

**Architecture:** A single Next.js App Router page (`/`) composed of one component per section (`components/sections/*`), driven by a centralized, typed content file (`content/curso.ts`) so real data can replace placeholders later without touching JSX. Shared primitives (Button, Section, BandeiraShape, Accordion, AnimatedCounter) live in `components/ui/*` and carry the brand's visual and motion rules once, reused by every section.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion, Vitest + React Testing Library for component/unit tests, deploy target Vercel.

**Spec:** `docs/superpowers/specs/2026-10-19-landing-valuation-design.md`

## Global Constraints

- Brand colors: navy `#112468`, green `#80c842`, black `#000000` (exact hex values from the spec/brand guide).
- Body copy font: Museo Sans, self-hosted from `Design System/Fontes/MuseoSans/*.otf` (weights available: 300, 500, 700, 900 — no 400 "regular" file exists, use 300 for light body text and 500 where the guide calls for "regular").
- Heading font: the brand guide's "Museo" headline family has no font files in the Design System folder (only Museo Sans exists there). Per the guide's own digital fallback rule ("para internet podem ser utilizados... Montserrat ou Arial"), use Montserrat via `next/font/google` for all headings.
- The "bandeira" graphic must never render as a whole/complete shape — only a cropped diagonal fragment (angle or lateral curve), per brand guide.
- All animation (hero drift, parallax, stagger, count-up, hover microinteractions) must be skippable: when `prefers-reduced-motion: reduce` is set, components render their final static state immediately.
- Unresolved real-world data (price, dates, instructor names/photos, testimonials, checkout URL, syllabus PDF) must be wrapped with the `placeholder()` helper (Task 1) so it is visibly marked `[LIKE THIS]` in the rendered page, never silently rendered as if real.
- No embedded checkout, no CMS, no student portal, no i18n — out of scope per spec section 10.
- Primary CTA always links externally (checkout URL placeholder today); it must never have an empty `href`.
- Design/visual execution for UI primitives and section layout should consult the `frontend-design` and `ui-ux-pro-max` skills for spacing, motion easing and typographic detail; run the `web-design-guidelines` skill as a review pass after Task 16 (not part of this plan).

## Review Focus

- **Reduced motion preference ignored** — a visitor with `prefers-reduced-motion: reduce` still sees hero drift/parallax/stagger text, which can trigger discomfort. Covered in Task 6 (Hero) and Task 4 (`useReducedMotion`/`AnimatedCounter`).
- **Placeholder data silently looks real** — an editor or buyer sees a plausible-looking fake price/date and doesn't realize it's a stand-in. Covered in Task 1 (content placeholder guard) and Task 12 (`formatInvestment`).
- **Primary CTA renders with a dead/empty link** — `Button` used without a valid `href`, producing a button that does nothing. Covered in Task 2 (`Button`).
- **Lead capture form accepts garbage input** — empty name, malformed email submitted and "succeeds" silently, polluting the lead list and wasting the admissions team's time. Covered in Task 14 (`LeadCaptureForm` + `/api/lead` validation).
- **Curriculum/FAQ accordions unusable without a mouse** — keyboard-only visitors (a real share of this professional audience) can't expand modules or FAQ answers. Covered in Task 3 (`Accordion`).

---

## File Structure

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    api/lead/route.ts
  components/
    ui/
      Button.tsx
      Section.tsx
      BandeiraShape.tsx
      Accordion.tsx
      AnimatedCounter.tsx
      LeadCaptureForm.tsx
    sections/
      Header.tsx
      Hero.tsx
      AuthorityStats.tsx
      AudienceFit.tsx
      LearningOutcomes.tsx
      Curriculum.tsx
      Methodology.tsx
      Faculty.tsx
      CommunityNetwork.tsx
      SocialProof.tsx
      Investment.tsx
      FAQ.tsx
      FinalCTA.tsx
      Footer.tsx
  content/
    curso.ts
  lib/
    cn.ts
    placeholder.ts
    hooks/
      use-reduced-motion.ts
      use-count-up.ts
  fonts/
    MuseoSans/ (copied .otf files)
public/
  brand/
    abvcap-logo-color.png
    abvcap-logo-white.png
```

---

### Task 0: Project scaffold

**Files:**
- Create: Next.js project files (`package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tsconfig.json`, Tailwind setup) via `create-next-app`
- Create: `src/fonts/MuseoSans/MuseoSans-300.otf`, `MuseoSans_500.otf`, `MuseoSans_700.otf`, `MuseoSans_900.otf` (copied)
- Create: `public/brand/abvcap-logo-color.png`, `public/brand/abvcap-logo-white.png` (copied)

**Interfaces:**
- Produces: Tailwind tokens `brand-navy` (`#112468`), `brand-green` (`#80c842`), `brand-ink` (`#000000`); font CSS variables `--font-heading` (Montserrat) and `--font-body` (Museo Sans) available globally via `layout.tsx`.

- [ ] **Step 1: Scaffold the Next.js app**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`

Answer any remaining prompts with the defaults.

- [ ] **Step 2: Install Framer Motion**

Run: `npm install framer-motion`

- [ ] **Step 3: Copy brand font files**

Copy `MuseoSans-300.otf`, `MuseoSans_500.otf`, `MuseoSans_700.otf`, `MuseoSans_900.otf` from `../Design System/Fontes/MuseoSans/` into `src/fonts/MuseoSans/`.

- [ ] **Step 4: Copy brand logo files**

Copy `../Design System/logos/ABVCAP_marca_rgb (2).png` → `public/brand/abvcap-logo-color.png`.
Copy `../Design System/logos/ABVCAP BRANCO FUNDO TRANSPARENTE (3).png` → `public/brand/abvcap-logo-white.png`.

- [ ] **Step 5: Define brand tokens and fonts**

In `src/app/globals.css` (Tailwind v4 `@theme`) or `tailwind.config.ts` (whichever the scaffold produced), add color tokens `brand-navy: #112468`, `brand-green: #80c842`, `brand-ink: #000000`.

In `src/app/layout.tsx`, load Montserrat via `next/font/google` as `--font-heading`, and Museo Sans via `next/font/local` (the 4 copied `.otf` files, weights 300/500/700/900) as `--font-body`; apply both as CSS variables on `<body>`.

- [ ] **Step 6: Verify the dev server runs**

Run: `npm run dev`
Expected: `http://localhost:3000` renders without console errors (default starter content is fine at this point).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with brand fonts and tokens"
```

---

### Task 1: Content model and placeholder guard

**Files:**
- Create: `src/lib/placeholder.ts`
- Test: `src/lib/placeholder.test.ts`
- Create: `src/content/curso.ts`
- Test: `src/content/curso.test.ts`

**Interfaces:**
- Produces: `placeholder(label: string): string` (returns `` `[${label}]` ``), `isPlaceholder(value: string): boolean`.
- Produces: `courseContent: CourseContent` default export from `src/content/curso.ts`, typed as:
  ```ts
  interface CourseContent {
    hero: { eyebrow: string; headlineLines: string[]; subheadline: string; checkoutUrl: string; syllabusCtaLabel: string };
    authorityStats: { value: number; suffix: string; label: string }[];
    audienceProfiles: { title: string; pain: string }[];
    learningOutcomes: string[];
    curriculumModules: { title: string; summary: string; lessons: string[] }[];
    methodology: { title: string; body: string }[];
    faculty: { name: string; role: string; bio: string; photo: string }[];
    community: { title: string; body: string };
    testimonials: { quote: string; author: string; role: string; company: string; photo: string }[];
    investment: { price: string; earlyBirdPrice: string; earlyBirdDeadline: string; seatsLimit: string; nextCohortDate: string; workloadHours: string; checkoutUrl: string };
    faq: { question: string; answer: string }[];
  }
  ```

- [ ] **Step 1: Install test tooling**

Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`

Add a `vitest.config.ts` (jsdom environment, `@` alias matching `tsconfig.json`) and a `"test": "vitest run"` script in `package.json`.

- [ ] **Step 2: Write the failing placeholder tests**

```ts
import { describe, it, expect } from "vitest";
import { placeholder, isPlaceholder } from "./placeholder";

describe("placeholder", () => {
  it("wraps a label in brackets", () => {
    expect(placeholder("PREÇO")).toBe("[PREÇO]");
  });
  it("isPlaceholder recognizes bracketed values", () => {
    expect(isPlaceholder("[PREÇO]")).toBe(true);
  });
  it("isPlaceholder rejects real-looking values", () => {
    expect(isPlaceholder("R$ 6.000")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- placeholder`
Expected: FAIL with "Cannot find module './placeholder'"

- [ ] **Step 4: Implement `placeholder` and `isPlaceholder` in `src/lib/placeholder.ts`**

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- placeholder`
Expected: PASS (3 tests)

- [ ] **Step 6: Write the failing content placeholder-guard test**

```ts
import { describe, it, expect } from "vitest";
import { courseContent } from "./curso";
import { isPlaceholder } from "@/lib/placeholder";

describe("courseContent pending data", () => {
  it("marks price, checkout URL and next cohort date as placeholders", () => {
    expect(isPlaceholder(courseContent.investment.price)).toBe(true);
    expect(isPlaceholder(courseContent.investment.checkoutUrl)).toBe(true);
    expect(isPlaceholder(courseContent.investment.nextCohortDate)).toBe(true);
    expect(isPlaceholder(courseContent.hero.checkoutUrl)).toBe(true);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- curso`
Expected: FAIL with "Cannot find module './curso'"

- [ ] **Step 8: Implement `courseContent` in `src/content/curso.ts`**

Fill every field from spec section 6 (page copy drafted in Portuguese, institutional/premium tone, no aggressive sales language — see spec section 3 for the 4 audience profiles, 3 differentiators, and FAQ objections to cover). Wrap `investment.price`, `investment.earlyBirdPrice`, `investment.earlyBirdDeadline`, `investment.seatsLimit`, `investment.nextCohortDate`, `investment.workloadHours`, `investment.checkoutUrl`, `hero.checkoutUrl`, each `faculty[].name/role/bio/photo`, and each `testimonials[].*` with `placeholder(...)` calls using descriptive labels (e.g. `placeholder("PREÇO")`, `placeholder("NOME DO PROFESSOR")`).

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- curso`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/lib/placeholder.ts src/lib/placeholder.test.ts src/content/curso.ts src/content/curso.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add course content model with placeholder guard"
```

---

### Task 2: UI primitives — cn, Button, Section, BandeiraShape

**Files:**
- Create: `src/lib/cn.ts`
- Create: `src/components/ui/Button.tsx`
- Test: `src/components/ui/Button.test.tsx`
- Create: `src/components/ui/Section.tsx`
- Create: `src/components/ui/BandeiraShape.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` (clsx + tailwind-merge).
- Produces: `Button({ href: string; variant: "primary" | "secondary"; children: ReactNode; className?: string }): JSX.Element` — renders an `<a>`; `variant="primary"` is solid `brand-green`, `variant="secondary"` is outlined; always sets `target="_blank" rel="noopener noreferrer"`.
- Produces: `Section({ tone: "navy" | "white"; children: ReactNode; className?: string; id?: string }): JSX.Element` — full-bleed background per `tone`.
- Produces: `BandeiraShape({ tone: "green" | "navy"; corner: "top-left" | "top-right" | "bottom-left" | "bottom-right"; className?: string }): JSX.Element` — static cropped diagonal SVG fragment, `aria-hidden="true"`.

- [ ] **Step 1: Install class helpers**

Run: `npm install clsx tailwind-merge`

- [ ] **Step 2: Implement `cn` in `src/lib/cn.ts`**

- [ ] **Step 3: Write the failing Button tests**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a link with the given href", () => {
    render(<Button href="https://example.com/checkout" variant="primary">Matricule-se</Button>);
    const link = screen.getByRole("link", { name: "Matricule-se" });
    expect(link).toHaveAttribute("href", "https://example.com/checkout");
  });
  it("never renders an empty href", () => {
    render(<Button href="[URL DA PRATELEIRA]" variant="primary">Matricule-se</Button>);
    const link = screen.getByRole("link", { name: "Matricule-se" });
    expect(link.getAttribute("href")).not.toBe("");
  });
  it("opens external links safely", () => {
    render(<Button href="https://example.com" variant="secondary">Saiba mais</Button>);
    const link = screen.getByRole("link", { name: "Saiba mais" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm run test -- Button`
Expected: FAIL with "Cannot find module './Button'"

- [ ] **Step 5: Implement `Button` in `src/components/ui/Button.tsx`**

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- Button`
Expected: PASS (3 tests)

- [ ] **Step 7: Implement `Section` and `BandeiraShape`**

No test required (purely presentational); verify visually in Task 6 once composed into the Hero.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cn.ts src/components/ui/Button.tsx src/components/ui/Button.test.tsx src/components/ui/Section.tsx src/components/ui/BandeiraShape.tsx package.json package-lock.json
git commit -m "feat: add Button, Section and BandeiraShape UI primitives"
```

---

### Task 3: Accordion primitive (keyboard accessible)

**Files:**
- Create: `src/components/ui/Accordion.tsx`
- Test: `src/components/ui/Accordion.test.tsx`

**Interfaces:**
- Produces: `Accordion({ items: { id: string; trigger: ReactNode; content: ReactNode }[] }): JSX.Element` — each item renders a `<button aria-expanded> ` trigger and a content panel (`role="region"`); multiple items may be open independently; trigger responds to both click and `Enter`/`Space` key activation (native `<button>` already supports this — verify it, don't suppress default behavior).

- [ ] **Step 1: Write the failing Accordion tests**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./Accordion";

const items = [
  { id: "m1", trigger: "Módulo 1", content: "Conteúdo do módulo 1" },
  { id: "m2", trigger: "Módulo 2", content: "Conteúdo do módulo 2" },
];

describe("Accordion", () => {
  it("toggles aria-expanded and reveals content on click", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole("button", { name: "Módulo 1" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Conteúdo do módulo 1")).toBeVisible();
  });
  it("toggles via keyboard (Enter) when the trigger is focused", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole("button", { name: "Módulo 2" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
  it("allows multiple items open independently", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByRole("button", { name: "Módulo 1" }));
    await user.click(screen.getByRole("button", { name: "Módulo 2" }));
    expect(screen.getByRole("button", { name: "Módulo 1" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Módulo 2" })).toHaveAttribute("aria-expanded", "true");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- Accordion`
Expected: FAIL with "Cannot find module './Accordion'"

- [ ] **Step 3: Implement `Accordion` in `src/components/ui/Accordion.tsx`**

Use a `Set<string>` of open item ids in local state; toggle on trigger click; render triggers as native `<button>` elements (never `<div onClick>`) so keyboard activation is free.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- Accordion`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Accordion.tsx src/components/ui/Accordion.test.tsx
git commit -m "feat: add keyboard-accessible Accordion primitive"
```

---

### Task 4: Reduced-motion hook and AnimatedCounter

**Files:**
- Create: `src/lib/hooks/use-reduced-motion.ts`
- Test: `src/lib/hooks/use-reduced-motion.test.ts`
- Create: `src/components/ui/AnimatedCounter.tsx`
- Test: `src/components/ui/AnimatedCounter.test.tsx`

**Interfaces:**
- Produces: `useReducedMotion(): boolean` — true when `window.matchMedia("(prefers-reduced-motion: reduce)").matches`.
- Produces: `AnimatedCounter({ to: number; suffix?: string; durationMs?: number }): JSX.Element` — counts from 0 to `to` when in view, unless `useReducedMotion()` is true, in which case it renders `${to}${suffix}` immediately; root element carries `data-motion="reduced" | "full"` for testability.

- [ ] **Step 1: Write the failing `useReducedMotion` test**

```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";

describe("useReducedMotion", () => {
  it("returns true when the media query matches", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- use-reduced-motion`
Expected: FAIL with "Cannot find module './use-reduced-motion'"

- [ ] **Step 3: Implement `useReducedMotion` in `src/lib/hooks/use-reduced-motion.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- use-reduced-motion`
Expected: PASS

- [ ] **Step 5: Write the failing AnimatedCounter test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./AnimatedCounter";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("AnimatedCounter", () => {
  it("renders the final value immediately when reduced motion is preferred", () => {
    render(<AnimatedCounter to={20} suffix="+" />);
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("20+").closest("[data-motion]")).toHaveAttribute("data-motion", "reduced");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- AnimatedCounter`
Expected: FAIL with "Cannot find module './AnimatedCounter'"

- [ ] **Step 7: Implement `AnimatedCounter` in `src/components/ui/AnimatedCounter.tsx`**

Use Framer Motion's `useInView` + `animate` (from `framer-motion`) for the counting path; reduced-motion path renders the final text synchronously, no animation frame.

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- AnimatedCounter`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/hooks/use-reduced-motion.ts src/lib/hooks/use-reduced-motion.test.ts src/components/ui/AnimatedCounter.tsx src/components/ui/AnimatedCounter.test.tsx
git commit -m "feat: add useReducedMotion hook and AnimatedCounter"
```

---

### Task 5: Header and Footer

**Files:**
- Create: `src/components/sections/Header.tsx`
- Test: `src/components/sections/Header.test.tsx`
- Create: `src/components/sections/Footer.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `courseContent` (Task 1), `public/brand/abvcap-logo-color.png` / `abvcap-logo-white.png` (Task 0).
- Produces: `Header(): JSX.Element` — sticky top bar, color logo, anchor nav to section ids, primary `Button` using `courseContent.hero.checkoutUrl`.
- Produces: `Footer(): JSX.Element` — navy `Section`, white logo, institutional text, contact placeholders.

- [ ] **Step 1: Write the failing Header test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";
import { courseContent } from "@/content/curso";

describe("Header", () => {
  it("renders the primary CTA pointing at the checkout URL from content", () => {
    render(<Header />);
    const cta = screen.getByRole("link", { name: /matricule-se/i });
    expect(cta).toHaveAttribute("href", courseContent.hero.checkoutUrl);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Header`
Expected: FAIL with "Cannot find module './Header'"

- [ ] **Step 3: Implement `Header` in `src/components/sections/Header.tsx`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Header`
Expected: PASS

- [ ] **Step 5: Implement `Footer` in `src/components/sections/Footer.tsx`**

No dedicated test (static institutional content); verify visually once composed in Task 15.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Header.tsx src/components/sections/Header.test.tsx src/components/sections/Footer.tsx
git commit -m "feat: add Header and Footer sections"
```

---

### Task 6: Hero section (motion)

**Files:**
- Create: `src/components/sections/Hero.tsx`
- Test: `src/components/sections/Hero.test.tsx`

**Interfaces:**
- Consumes: `Section`, `BandeiraShape`, `Button` (Task 2), `useReducedMotion` (Task 4), `courseContent.hero` (Task 1).
- Produces: `Hero(): JSX.Element` — root element carries `data-motion="reduced" | "full"`; navy `Section` with animated `BandeiraShape` (continuous drift via Framer Motion `animate`, parallax via `useScroll`/`useTransform`), headline rendered line-by-line with stagger entrance, primary CTA (`courseContent.hero.checkoutUrl`) and secondary CTA (opens `LeadCaptureForm` from Task 14 — wire this prop as a no-op callback for now, fully wired in Task 14).

- [ ] **Step 1: Write the failing Hero reduced-motion test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("Hero", () => {
  it("renders statically (data-motion=reduced) and shows the full headline immediately", () => {
    render(<Hero />);
    const root = screen.getByTestId("hero-root");
    expect(root).toHaveAttribute("data-motion", "reduced");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Hero`
Expected: FAIL with "Cannot find module './Hero'"

- [ ] **Step 3: Implement `Hero` in `src/components/sections/Hero.tsx`**

Consult the `frontend-design` and `ui-ux-pro-max` skills for the exact stagger/parallax motion values (easing, duration, translate distances) — the spec fixes *what* moves (bandeira drift, parallax depth, line-by-line headline, CTA hover glow) but not the precise easing curves. When `useReducedMotion()` is true, skip all `animate`/`whileInView` props and render the final layout directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Hero`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.tsx src/components/sections/Hero.test.tsx
git commit -m "feat: add animated Hero section with reduced-motion fallback"
```

---

### Task 7: AuthorityStats section

**Files:**
- Create: `src/components/sections/AuthorityStats.tsx`
- Test: `src/components/sections/AuthorityStats.test.tsx`

**Interfaces:**
- Consumes: `AnimatedCounter` (Task 4), `courseContent.authorityStats` (Task 1).
- Produces: `AuthorityStats(): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthorityStats } from "./AuthorityStats";
import { courseContent } from "@/content/curso";

describe("AuthorityStats", () => {
  it("renders one stat per entry in content", () => {
    render(<AuthorityStats />);
    expect(screen.getAllByTestId("authority-stat")).toHaveLength(courseContent.authorityStats.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AuthorityStats`
Expected: FAIL with "Cannot find module './AuthorityStats'"

- [ ] **Step 3: Implement `AuthorityStats`, mapping `courseContent.authorityStats` to `AnimatedCounter` instances, each wrapped in an element with `data-testid="authority-stat"`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AuthorityStats`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/AuthorityStats.tsx src/components/sections/AuthorityStats.test.tsx
git commit -m "feat: add AuthorityStats section"
```

---

### Task 8: AudienceFit and LearningOutcomes sections

**Files:**
- Create: `src/components/sections/AudienceFit.tsx`
- Test: `src/components/sections/AudienceFit.test.tsx`
- Create: `src/components/sections/LearningOutcomes.tsx`
- Test: `src/components/sections/LearningOutcomes.test.tsx`

**Interfaces:**
- Consumes: `courseContent.audienceProfiles`, `courseContent.learningOutcomes` (Task 1).
- Produces: `AudienceFit(): JSX.Element`, `LearningOutcomes(): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

```tsx
// AudienceFit.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudienceFit } from "./AudienceFit";
import { courseContent } from "@/content/curso";

describe("AudienceFit", () => {
  it("renders one card per audience profile", () => {
    render(<AudienceFit />);
    expect(screen.getAllByTestId("audience-profile")).toHaveLength(courseContent.audienceProfiles.length);
  });
});
```

```tsx
// LearningOutcomes.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningOutcomes } from "./LearningOutcomes";
import { courseContent } from "@/content/curso";

describe("LearningOutcomes", () => {
  it("renders one item per learning outcome", () => {
    render(<LearningOutcomes />);
    expect(screen.getAllByTestId("learning-outcome")).toHaveLength(courseContent.learningOutcomes.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- AudienceFit LearningOutcomes`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement both components**, each list item/card carrying the matching `data-testid`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- AudienceFit LearningOutcomes`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/AudienceFit.tsx src/components/sections/AudienceFit.test.tsx src/components/sections/LearningOutcomes.tsx src/components/sections/LearningOutcomes.test.tsx
git commit -m "feat: add AudienceFit and LearningOutcomes sections"
```

---

### Task 9: Curriculum section

**Files:**
- Create: `src/components/sections/Curriculum.tsx`
- Test: `src/components/sections/Curriculum.test.tsx`

**Interfaces:**
- Consumes: `Accordion` (Task 3), `courseContent.curriculumModules` (Task 1).
- Produces: `Curriculum(): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Curriculum } from "./Curriculum";
import { courseContent } from "@/content/curso";

describe("Curriculum", () => {
  it("renders one accordion trigger per module and reveals its lessons on click", async () => {
    const user = userEvent.setup();
    render(<Curriculum />);
    const firstModule = courseContent.curriculumModules[0];
    const trigger = screen.getByRole("button", { name: new RegExp(firstModule.title) });
    await user.click(trigger);
    expect(screen.getByText(firstModule.lessons[0])).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Curriculum`
Expected: FAIL with "Cannot find module './Curriculum'"

- [ ] **Step 3: Implement `Curriculum`**, mapping each `courseContent.curriculumModules` entry to an `Accordion` item (trigger = module title + summary, content = lessons list).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Curriculum`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Curriculum.tsx src/components/sections/Curriculum.test.tsx
git commit -m "feat: add Curriculum section"
```

---

### Task 10: Methodology and Faculty sections

**Files:**
- Create: `src/components/sections/Methodology.tsx`
- Create: `src/components/sections/Faculty.tsx`
- Test: `src/components/sections/Faculty.test.tsx`

**Interfaces:**
- Consumes: `courseContent.methodology`, `courseContent.faculty` (Task 1).
- Produces: `Methodology(): JSX.Element`, `Faculty(): JSX.Element`.

- [ ] **Step 1: Write the failing Faculty test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faculty } from "./Faculty";
import { courseContent } from "@/content/curso";

describe("Faculty", () => {
  it("renders one card per instructor", () => {
    render(<Faculty />);
    expect(screen.getAllByTestId("faculty-card")).toHaveLength(courseContent.faculty.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Faculty`
Expected: FAIL with "Cannot find module './Faculty'"

- [ ] **Step 3: Implement `Faculty`** (cards with `data-testid="faculty-card"`) **and `Methodology`** (no dedicated test — static content blocks, verified visually in Task 15).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Faculty`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Methodology.tsx src/components/sections/Faculty.tsx src/components/sections/Faculty.test.tsx
git commit -m "feat: add Methodology and Faculty sections"
```

---

### Task 11: CommunityNetwork and SocialProof sections

**Files:**
- Create: `src/components/sections/CommunityNetwork.tsx`
- Create: `src/components/sections/SocialProof.tsx`
- Test: `src/components/sections/SocialProof.test.tsx`

**Interfaces:**
- Consumes: `courseContent.community`, `courseContent.testimonials` (Task 1).
- Produces: `CommunityNetwork(): JSX.Element`, `SocialProof(): JSX.Element`.

- [ ] **Step 1: Write the failing SocialProof test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProof } from "./SocialProof";
import { courseContent } from "@/content/curso";

describe("SocialProof", () => {
  it("renders one testimonial per content entry", () => {
    render(<SocialProof />);
    expect(screen.getAllByTestId("testimonial")).toHaveLength(courseContent.testimonials.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SocialProof`
Expected: FAIL with "Cannot find module './SocialProof'"

- [ ] **Step 3: Implement `SocialProof`** (`data-testid="testimonial"` per card) **and `CommunityNetwork`** (no dedicated test — static content, verified visually in Task 15).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- SocialProof`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/CommunityNetwork.tsx src/components/sections/SocialProof.tsx src/components/sections/SocialProof.test.tsx
git commit -m "feat: add CommunityNetwork and SocialProof sections"
```

---

### Task 12: Investment section

**Files:**
- Create: `src/lib/format-investment.ts`
- Test: `src/lib/format-investment.test.ts`
- Create: `src/components/sections/Investment.tsx`

**Interfaces:**
- Consumes: `isPlaceholder` (Task 1), `courseContent.investment` (Task 1), `Button` (Task 2).
- Produces: `formatInvestment(value: string): string` — if `isPlaceholder(value)`, returns it unchanged (still bracketed, visibly pending); otherwise parses a numeric string and formats as BRL via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Produces: `Investment(): JSX.Element`.

- [ ] **Step 1: Write the failing formatInvestment tests**

```ts
import { describe, it, expect } from "vitest";
import { formatInvestment } from "./format-investment";

describe("formatInvestment", () => {
  it("returns placeholder values unchanged", () => {
    expect(formatInvestment("[PREÇO]")).toBe("[PREÇO]");
  });
  it("formats a real numeric value as BRL currency", () => {
    expect(formatInvestment("7500")).toBe("R$ 7.500,00");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- format-investment`
Expected: FAIL with "Cannot find module './format-investment'"

- [ ] **Step 3: Implement `formatInvestment` in `src/lib/format-investment.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- format-investment`
Expected: PASS

- [ ] **Step 5: Implement `Investment`**, using `formatInvestment` on `courseContent.investment.price`/`earlyBirdPrice`, displaying `seatsLimit`, `earlyBirdDeadline`, `nextCohortDate`, `workloadHours` as-is, and a primary `Button` using `courseContent.investment.checkoutUrl`. No additional test — covered by `formatInvestment`'s unit tests plus visual check in Task 15.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format-investment.ts src/lib/format-investment.test.ts src/components/sections/Investment.tsx
git commit -m "feat: add Investment section with placeholder-safe price formatting"
```

---

### Task 13: FAQ section

**Files:**
- Create: `src/components/sections/FAQ.tsx`
- Test: `src/components/sections/FAQ.test.tsx`

**Interfaces:**
- Consumes: `Accordion` (Task 3), `courseContent.faq` (Task 1).
- Produces: `FAQ(): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FAQ } from "./FAQ";
import { courseContent } from "@/content/curso";

describe("FAQ", () => {
  it("renders one accordion trigger per question", () => {
    render(<FAQ />);
    expect(screen.getAllByRole("button")).toHaveLength(courseContent.faq.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- FAQ`
Expected: FAIL with "Cannot find module './FAQ'"

- [ ] **Step 3: Implement `FAQ`**, mapping `courseContent.faq` to `Accordion` items.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- FAQ`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/FAQ.tsx src/components/sections/FAQ.test.tsx
git commit -m "feat: add FAQ section"
```

---

### Task 14: Lead capture (secondary CTA) — form, validation, and API route

**Files:**
- Create: `src/lib/validate-lead.ts`
- Test: `src/lib/validate-lead.test.ts`
- Create: `src/components/ui/LeadCaptureForm.tsx`
- Test: `src/components/ui/LeadCaptureForm.test.tsx`
- Create: `src/app/api/lead/route.ts`
- Create: `src/components/sections/FinalCTA.tsx`

**Interfaces:**
- Produces: `validateLead(data: { name: string; email: string }): { valid: true } | { valid: false; errors: Partial<Record<"name" | "email", string>> }`.
- Produces: `LeadCaptureForm({ onSuccess?: () => void }): JSX.Element` — controlled name/email inputs, calls `validateLead` on submit, shows field errors inline, `fetch("/api/lead", { method: "POST", body: JSON.stringify({ name, email }) })` only when valid.
- Produces: `POST /api/lead` route handler — re-runs `validateLead` server-side, returns `400` with errors on invalid payload.
- Produces: `FinalCTA(): JSX.Element` — renders `LeadCaptureForm` plus the primary matrícula `Button`.

- [ ] **Step 1: Write the failing validateLead tests**

```ts
import { describe, it, expect } from "vitest";
import { validateLead } from "./validate-lead";

describe("validateLead", () => {
  it("rejects an empty name", () => {
    const result = validateLead({ name: "", email: "ana@example.com" });
    expect(result.valid).toBe(false);
  });
  it("rejects a malformed email", () => {
    const result = validateLead({ name: "Ana", email: "not-an-email" });
    expect(result.valid).toBe(false);
  });
  it("accepts a valid payload", () => {
    const result = validateLead({ name: "Ana", email: "ana@example.com" });
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- validate-lead`
Expected: FAIL with "Cannot find module './validate-lead'"

- [ ] **Step 3: Implement `validateLead` in `src/lib/validate-lead.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- validate-lead`
Expected: PASS

- [ ] **Step 5: Write the failing LeadCaptureForm tests**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadCaptureForm } from "./LeadCaptureForm";

describe("LeadCaptureForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
  });

  it("shows a validation error and does not submit when email is empty", async () => {
    const user = userEvent.setup();
    render(<LeadCaptureForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));
    expect(await screen.findByText(/e-mail/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits to /api/lead when the payload is valid", async () => {
    const user = userEvent.setup();
    render(<LeadCaptureForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/lead",
      expect.objectContaining({ method: "POST" })
    );
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm run test -- LeadCaptureForm`
Expected: FAIL with "Cannot find module './LeadCaptureForm'"

- [ ] **Step 7: Implement `LeadCaptureForm` in `src/components/ui/LeadCaptureForm.tsx`**

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test -- LeadCaptureForm`
Expected: PASS

- [ ] **Step 9: Resolve the lead-notification integration before implementing the route**

The spec leaves open how a submitted lead reaches the admissions team (email notification, spreadsheet, CRM). Before writing provider-specific code in `src/app/api/lead/route.ts`, invoke the Vercel marketplace skill (or ask the user directly) to select and provision a real integration — do not ship a stub that silently discards leads or fabricate a mock integration as if it were final.

- [ ] **Step 10: Implement `POST /api/lead` in `src/app/api/lead/route.ts`**

Validate with `validateLead` server-side (return `400` + errors on failure); on success, deliver the lead via the integration chosen in Step 9, then return `200`.

- [ ] **Step 11: Implement `FinalCTA` in `src/components/sections/FinalCTA.tsx`**, composing `LeadCaptureForm` and the primary `Button`. Wire Hero's secondary CTA (Task 6) to open the same `LeadCaptureForm` (as an inline section reveal or modal — implementer's choice).

- [ ] **Step 12: Commit**

```bash
git add src/lib/validate-lead.ts src/lib/validate-lead.test.ts src/components/ui/LeadCaptureForm.tsx src/components/ui/LeadCaptureForm.test.tsx src/app/api/lead/route.ts src/components/sections/FinalCTA.tsx
git commit -m "feat: add lead capture form, validation, and API route"
```

---

### Task 15: Assemble the page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Consumes: every section component from Tasks 5–14.

- [ ] **Step 1: Write the failing page smoke test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Page", () => {
  it("renders header and footer without throwing", () => {
    render(<Page />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- page`
Expected: FAIL (page still renders the Task 0 starter content, no `banner`/`contentinfo` landmarks)

- [ ] **Step 3: Compose `src/app/page.tsx`**

Render, in order: `Header`, `Hero`, `AuthorityStats`, `AudienceFit`, `LearningOutcomes`, `Curriculum`, `Methodology`, `Faculty`, `CommunityNetwork`, `SocialProof`, `Investment`, `FAQ`, `FinalCTA`, `Footer` (per spec section 6). `Header` uses `<header>` (implicit `banner` role), `Footer` uses `<footer>` (implicit `contentinfo` role).

- [ ] **Step 4: Add metadata and Open Graph tags in `src/app/layout.tsx`**

Title and description from `courseContent.hero`; OG image as a placeholder path (e.g. `/brand/og-placeholder.png`) until a real one exists.

- [ ] **Step 5: Add Vercel Web Analytics**

Run: `npm install @vercel/analytics`

Add `<Analytics />` (from `@vercel/analytics/next`) to `src/app/layout.tsx`, inside `<body>`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- page`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/page.test.tsx package.json package-lock.json
git commit -m "feat: compose full landing page, set metadata, add analytics"
```

---

### Task 16: Build, motion, and accessibility QA pass

**Files:**
- None created — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build succeeds with no type errors

- [ ] **Step 3: Manual reduced-motion check**

Start `npm run dev`, open the page in a browser, use devtools to emulate `prefers-reduced-motion: reduce`, and confirm the hero shows no drift/parallax/stagger and the counters show final values immediately.

- [ ] **Step 4: Manual keyboard check**

Tab through the entire page; confirm every interactive element (nav links, both CTAs, curriculum accordion, FAQ accordion, lead form fields and submit) is reachable and operable without a mouse.

- [ ] **Step 5: Manual contrast check**

With devtools' accessibility/contrast inspector, check text-on-navy and text-on-white combinations introduced in Tasks 5–15 for WCAG AA contrast; adjust any failing color/weight pairing.

- [ ] **Step 6: Commit any fixes from Steps 3–5**

```bash
git add -A
git commit -m "fix: accessibility and reduced-motion QA fixes"
```
