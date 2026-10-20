import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const ANSWER_CLASSES = "font-body text-base leading-relaxed";

/**
 * "Perguntas frequentes" band: one Accordion item per `courseContent.faq`
 * entry — trigger shows the question, content reveals the answer.
 */
export function FAQ() {
  const items = courseContent.faq.map((entry, index) => ({
    id: `faq-${index}`,
    trigger: <span>{entry.question}</span>,
    content: <p className={ANSWER_CLASSES}>{entry.answer}</p>,
  }));

  return (
    <Section tone="white" id="faq">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Perguntas frequentes</h2>
        <div className="mt-14">
          <Accordion items={items} />
        </div>
      </ScrollReveal>
    </Section>
  );
}
