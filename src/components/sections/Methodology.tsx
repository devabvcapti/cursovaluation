import { Table2, Building2, Sparkles, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-3";

const CARD_CLASSES =
  "rounded-sm border border-white/15 bg-white/5 p-8 transition-colors duration-200 hover:border-brand-green/40 hover:bg-white/10";

const ICON_BOX_CLASSES =
  "mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-brand-green";

const BLOCK_TITLE_CLASSES = "font-heading text-xl font-medium text-white";

const BLOCK_BODY_CLASSES = "mt-4 font-body text-base leading-relaxed text-white/75";

// Icons, in the same order as `courseContent.methodology` — presentation
// detail kept out of the content model (which stays plain title/body data).
const ICONS: LucideIcon[] = [Table2, Building2, Sparkles];

/**
 * "Metodologia" band (anchor id kept for nav compatibility): one static
 * block per `courseContent.methodology` entry — the course's differentiators
 * — each with an icon, a title and a body paragraph.
 */
export function Methodology() {
  return (
    <Section tone="navy" id="metodologia">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>O que diferencia o curso</h2>
        <div className={GRID_CLASSES}>
          {courseContent.methodology.map((block, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <div key={block.title} className={CARD_CLASSES}>
                <div className={ICON_BOX_CLASSES}>
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className={BLOCK_TITLE_CLASSES}>{block.title}</h3>
                <p className={BLOCK_BODY_CLASSES}>{block.body}</p>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </Section>
  );
}
