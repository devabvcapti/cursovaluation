import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LeadCaptureForm } from "@/components/ui/LeadCaptureForm";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const BODY_CLASSES = "mt-4 max-w-xl font-body text-base leading-relaxed text-white/80 md:text-lg";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2";

const CARD_CLASSES = "rounded-sm border border-white/15 bg-white/5 p-8 md:p-10";

const CARD_HEADING_CLASSES = "font-heading text-xl font-bold text-white";

// `h-full` + the grid's default (stretch) item alignment give this column
// the same height as the form card beside it, so the bandeira mark below
// has real room to anchor the otherwise-empty lower half.
const CTA_WRAPPER_CLASSES = "relative flex h-full flex-col items-start justify-center gap-6 overflow-hidden";

// Deliberate exception to the brand guide's "never the whole bandeira"
// rule (see `BandeiraShape`'s doc comment) — confirmed with the user for
// this one decorative accent. Faded down so it reads as a quiet background
// element, not a competing focal point against the button above it.
// `h-full` tracks `CTA_WRAPPER_CLASSES`'s own `h-full` (which already
// matches the form card's height), so the mark never overflows above the
// column it sits in. No z-index here on purpose: an unadorned positioned
// element already paints below any sibling that has an explicit one (see
// `BUTTON_STACKING_CLASSES`) — a negative z-index on this element instead
// escaped to behind the whole Section's solid background and erased the
// mark entirely, which is why that approach was reverted.
const BANDEIRA_ACCENT_CLASSES = "pointer-events-none absolute bottom-0 left-0 h-full w-auto opacity-20";

// Keeps the primary CTA button painting above the bandeira mark beside it
// (see `BANDEIRA_ACCENT_CLASSES`), now that both occupy the same column.
const BUTTON_STACKING_CLASSES = "relative z-10";

// LeadCaptureForm's labels/inputs are styled for a light section (see
// Hero.tsx's identical wrapper); `CARD_CLASSES` is a translucent navy
// overlay (`bg-white/5`), so without this solid white panel the form's
// `text-brand-navy` labels would render at ~1:1 contrast against it.
const LEAD_FORM_WRAPPER_CLASSES = "mt-6 rounded-sm bg-white p-6 md:p-8";

/**
 * Final conversion band: the primary matrícula CTA (checkout link) next to
 * `LeadCaptureForm` for visitors who want the ementa before committing.
 * Uses `courseContent.hero.checkoutUrl` — the same site-wide sales-platform
 * link `Hero`'s primary CTA points at — rather than
 * `courseContent.investment.checkoutUrl`, since both currently hold the same
 * placeholder/value and this section is not specifically the pricing band.
 */
export function FinalCTA() {
  return (
    <Section tone="navy" id="matricula">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Pronto para dominar valuation?</h2>
        <p className={BODY_CLASSES}>
          Garanta sua vaga na próxima turma ou baixe a ementa completa para conhecer o programa em detalhes.
        </p>
        <div className={GRID_CLASSES}>
          <div className={CTA_WRAPPER_CLASSES}>
            <Button href={courseContent.hero.checkoutUrl} variant="primary" className={BUTTON_STACKING_CLASSES}>
              Quero me matricular
            </Button>
            <Image
              src="/brand/bandeira-verde.png"
              alt=""
              aria-hidden="true"
              width={217}
              height={160}
              className={BANDEIRA_ACCENT_CLASSES}
            />
          </div>
          <div className={CARD_CLASSES}>
            <h3 className={CARD_HEADING_CLASSES}>{courseContent.hero.syllabusCtaLabel}</h3>
            <div className={LEAD_FORM_WRAPPER_CLASSES}>
              <LeadCaptureForm />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}
