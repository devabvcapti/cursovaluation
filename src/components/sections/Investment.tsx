import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";
import { formatInvestment } from "@/lib/format-investment";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const CARD_CLASSES = "mt-14 rounded-sm border border-white/15 bg-white/5 p-8 md:p-12";

const PRICE_LABEL_CLASSES = "font-heading text-sm font-bold uppercase tracking-[0.08em] text-brand-green";

const PRICE_CLASSES = "mt-2 font-heading text-4xl font-light text-white md:text-5xl";

const EARLY_BIRD_CLASSES = "mt-6 font-body text-base text-white/80";

const DETAILS_CLASSES = "mt-10 grid grid-cols-1 gap-6 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-4";

const DETAIL_LABEL_CLASSES = "font-body text-sm font-semibold uppercase tracking-[0.08em] text-white/60";

const DETAIL_VALUE_CLASSES = "mt-1 font-body text-lg text-white";

const CTA_WRAPPER_CLASSES = "mt-12 flex justify-center md:justify-start";

const DETAILS = (investment: typeof courseContent.investment) => [
  { label: "Carga horária", value: investment.workloadHours },
  { label: "Próxima turma", value: investment.nextCohortDate },
  { label: "Vagas", value: investment.seatsLimit },
  { label: "Early bird até", value: investment.earlyBirdDeadline },
];

/**
 * "Investimento" band: price and early-bird price run through
 * `formatInvestment` so placeholders stay bracketed; the other fields are
 * display strings shown as given. The primary CTA points at the sales
 * platform checkout URL.
 */
export function Investment() {
  const { investment } = courseContent;

  return (
    <Section tone="navy" id="investimento">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Investimento</h2>
        <div className={CARD_CLASSES}>
          <p className={PRICE_LABEL_CLASSES}>Valor do curso</p>
          <p className={PRICE_CLASSES}>{formatInvestment(investment.price)}</p>
          <p className={EARLY_BIRD_CLASSES}>
            Early bird: {formatInvestment(investment.earlyBirdPrice)}
          </p>
          <dl className={DETAILS_CLASSES}>
            {DETAILS(investment).map((detail) => (
              <div key={detail.label}>
                <dt className={DETAIL_LABEL_CLASSES}>{detail.label}</dt>
                <dd className={DETAIL_VALUE_CLASSES}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={CTA_WRAPPER_CLASSES}>
          <Button href={investment.checkoutUrl} variant="primary">
            Quero me matricular
          </Button>
        </div>
      </ScrollReveal>
    </Section>
  );
}
