import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-3";

const CARD_CLASSES =
  "rounded-sm border border-white/15 bg-white/5 p-8 transition-colors duration-200 hover:border-brand-green/40 hover:bg-white/10";

const BLOCK_TITLE_CLASSES = "font-heading text-xl font-medium text-white";

const BLOCK_BODY_CLASSES = "mt-4 font-body text-base leading-relaxed text-white/75";

/**
 * "Metodologia" band: one static block per `courseContent.methodology`
 * entry, each with a title and body paragraph.
 */
export function Methodology() {
  return (
    <Section tone="navy" id="metodologia">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Metodologia</h2>
        <div className={GRID_CLASSES}>
          {courseContent.methodology.map((block) => (
            <div key={block.title} className={CARD_CLASSES}>
              <h3 className={BLOCK_TITLE_CLASSES}>{block.title}</h3>
              <p className={BLOCK_BODY_CLASSES}>{block.body}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </Section>
  );
}
