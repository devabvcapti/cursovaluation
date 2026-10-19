import Image from "next/image";
import { CopyrightYear } from "@/components/sections/CopyrightYear";

/**
 * Nav links repeated from `Header` for footer-level wayfinding. Kept as a
 * local copy (not shared/imported) since `Header`'s list is intentionally
 * private to that component; duplicating five short strings here is
 * cheaper than introducing a shared module for it.
 */
const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "Programa", href: "#programa" },
  { label: "Metodologia", href: "#metodologia" },
  { label: "Professores", href: "#professores" },
  { label: "Investimento", href: "#investimento" },
  { label: "FAQ", href: "#faq" },
];

/**
 * Institutional footer (design spec §6.13 — "rodapé institucional").
 * Static content, no dedicated test: nothing here is conditional or
 * derived from user input.
 *
 * Deliberately NOT built on the `Section` primitive: `Section` always
 * renders a `<section>` root, but Task 15's page-assembly smoke test
 * asserts `getByRole("contentinfo")`, the implicit role of `<footer>`.
 * Its navy background/full-bleed styling is replicated here by hand
 * (`bg-brand-navy text-white`, `w-full overflow-hidden`) with its own
 * `mx-auto max-w-*` inner wrapper, matching Task 2's note that `Section`
 * never wraps its children in one.
 *
 * No specific contact details (email/phone/address) are included: Task 1
 * never defined those fields in `courseContent`, and inventing new
 * placeholder-wrapped facts beyond what Task 1 established was explicitly
 * out of scope for this task. The copy below only restates ABVCAP's own
 * public institutional identity, consistent with how it's already
 * described in `courseContent` (hero eyebrow, authority stats).
 */
export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-brand-navy py-12 text-white lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 lg:max-w-md">
            <Image
              src="/brand/abvcap-logo-white.png"
              alt="ABVCAP"
              width={350}
              height={150}
              className="h-10 w-auto"
            />
            <p className="font-body text-sm leading-relaxed text-white/70">
              A ABVCAP — Associação Brasileira de Private Equity e Venture
              Capital — é a entidade de referência do ecossistema de Private
              Equity e Venture Capital no Brasil, reunindo gestoras,
              investidores e profissionais de M&amp;A e finanças corporativas.
              O curso Valuation é oferecido com a chancela institucional da
              ABVCAP.
            </p>
          </div>

          <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-8 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/15 pt-6">
          <p className="font-body text-xs text-white/60">
            © <CopyrightYear /> ABVCAP — Associação Brasileira de Private
            Equity e Venture Capital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
