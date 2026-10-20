import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const TRIGGER_TITLE_CLASSES = "block";

const TRIGGER_SUMMARY_CLASSES = "mt-1 block font-body text-sm font-normal text-brand-navy/70";

const LESSON_LIST_CLASSES = "space-y-2";

/**
 * "Grade do curso" band: one Accordion item per
 * `courseContent.curriculumModules` entry — trigger shows the module title
 * and summary, content reveals its lessons list.
 */
export function Curriculum() {
  const items = courseContent.curriculumModules.map((module, index) => ({
    id: `module-${index}`,
    trigger: (
      <>
        <span className={TRIGGER_TITLE_CLASSES}>{module.title}</span>
        <span className={TRIGGER_SUMMARY_CLASSES}>{module.summary}</span>
      </>
    ),
    content: (
      <ul className={LESSON_LIST_CLASSES}>
        {module.lessons.map((lesson) => (
          <li key={lesson}>{lesson}</li>
        ))}
      </ul>
    ),
  }));

  return (
    <Section tone="white" id="programa">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Grade do curso</h2>
        <div className="mt-14">
          <Accordion items={items} />
        </div>
      </ScrollReveal>
    </Section>
  );
}
