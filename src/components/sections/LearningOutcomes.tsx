import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const LIST_CLASSES = "mt-14 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2";

const ITEM_CLASSES = "flex gap-5 border-t border-white/15 pt-6";

const INDEX_CLASSES = "font-heading text-2xl font-light text-brand-green";

const TEXT_CLASSES = "font-body text-base leading-relaxed text-white/85";

/**
 * "O que você vai aprender" band: one numbered item per
 * `courseContent.learningOutcomes` entry.
 */
export function LearningOutcomes() {
  return (
    <Section tone="navy" id="resultados">
      <div className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>O que você vai aprender</h2>
        <ol className={LIST_CLASSES}>
          {courseContent.learningOutcomes.map((outcome, index) => (
            <li key={outcome} data-testid="learning-outcome" className={ITEM_CLASSES}>
              <span className={INDEX_CLASSES} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className={TEXT_CLASSES}>{outcome}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
