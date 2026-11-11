import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";
import { formatInvestment } from "@/lib/format-investment";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const PRICING_GRID_CLASSES = "mt-14 grid gap-6 md:grid-cols-2";

const PRICE_LABEL_CLASSES = "font-heading text-sm font-bold uppercase tracking-[0.08em] text-brand-green";

const FULL_PRICE_CLASSES = "mt-4 font-body text-base text-white/50 line-through";

const PRICE_CLASSES = "mt-1 font-heading text-4xl font-light text-white md:text-5xl";

const EARLY_BIRD_CLASSES = "mt-2 font-body text-sm text-white/70";

const INSTALLMENTS_CLASSES = "mt-1 font-body text-sm font-semibold text-brand-green";

const DETAILS_CLASSES =
  "mt-10 flex flex-col items-center gap-6 border-t border-white/15 pt-10 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-6 sm:text-left";

const DETAIL_ITEM_CLASSES = "sm:flex-none";

const DETAIL_LABEL_CLASSES = "font-body text-sm font-semibold uppercase tracking-[0.08em] text-white/60";

const DETAIL_VALUE_CLASSES = "mt-1 font-body text-lg text-white";

const CTA_WRAPPER_CLASSES = "mt-12 flex justify-center md:justify-start";

const DETAILS = (investment: typeof courseContent.investment) => [
  { label: "Carga horária", value: investment.workloadHours },
  { label: "Próxima turma", value: investment.nextCohortDate },
  { label: "Dias e horário", value: investment.schedule },
  { label: "Vagas", value: investment.seatsLimit },
  { label: "Local", value: investment.location },
];

type PricingCard = {
  testId: string;
  label: string;
  fullPrice: string;
  earlyBirdPrice: string;
  highlighted: boolean;
};

function pricingCards(investment: typeof courseContent.investment): PricingCard[] {
  return [
    {
      testId: "pricing-card-non-member",
      label: "Não Associado",
      fullPrice: investment.price,
      earlyBirdPrice: investment.earlyBirdPrice,
      highlighted: false,
    },
    {
      testId: "pricing-card-member",
      label: "Associado ABVCAP",
      fullPrice: investment.associadoPrice,
      earlyBirdPrice: investment.associadoEarlyBirdPrice,
      highlighted: true,
    },
  ];
}

function PricingCard({ card, earlyBirdDeadline }: { card: PricingCard; earlyBirdDeadline: string }) {
  const cardClasses = card.highlighted
    ? "relative rounded-sm border-2 border-brand-green bg-white/5 p-8 text-center md:p-10"
    : "relative rounded-sm border border-white/15 bg-white/5 p-8 text-center md:p-10";

  return (
    <div className={cardClasses} data-testid={card.testId}>
      {card.highlighted ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green px-4 py-1 font-heading text-xs font-bold uppercase tracking-[0.08em] text-brand-navy">
          Associado ABVCAP
        </span>
      ) : null}
      <p className={PRICE_LABEL_CLASSES}>{card.label}</p>
      <p className={FULL_PRICE_CLASSES}>{formatInvestment(card.fullPrice)}</p>
      <p className={PRICE_CLASSES}>{formatInvestment(card.earlyBirdPrice)}</p>
      <p className={EARLY_BIRD_CLASSES}>Early bird até {earlyBirdDeadline}</p>
      <p className={INSTALLMENTS_CLASSES}>ou em até 3x sem juros no cartão</p>
    </div>
  );
}

/**
 * "Investimento" band: shows Não Associado and Associado ABVCAP pricing side
 * by side so the member discount is visible upfront, instead of only
 * surfacing it later in the CNPJ-driven checkout flow. All four price
 * values run through `formatInvestment` so placeholders stay bracketed; the
 * other fields are display strings shown as given. The primary CTA points
 * at the sales platform checkout URL.
 */
export function Investment() {
  const { investment } = courseContent;

  return (
    <Section tone="navy" id="investimento">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Investimento</h2>
        <div className={PRICING_GRID_CLASSES}>
          {pricingCards(investment).map((card) => (
            <PricingCard key={card.testId} card={card} earlyBirdDeadline={investment.earlyBirdDeadline} />
          ))}
        </div>
        <dl className={DETAILS_CLASSES}>
          {DETAILS(investment).map((detail) => (
            <div key={detail.label} className={DETAIL_ITEM_CLASSES}>
              <dt className={DETAIL_LABEL_CLASSES}>{detail.label}</dt>
              <dd className={DETAIL_VALUE_CLASSES}>{detail.value}</dd>
            </div>
          ))}
        </dl>
        <div className={CTA_WRAPPER_CLASSES}>
          <Button href={investment.checkoutUrl} variant="primary">
            Quero me inscrever
          </Button>
        </div>
      </ScrollReveal>
    </Section>
  );
}
