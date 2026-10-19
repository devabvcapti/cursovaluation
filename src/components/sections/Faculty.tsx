import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-3";

const CARD_CLASSES = "flex flex-col rounded-sm border border-brand-navy/10 bg-white p-8 shadow-sm";

const PHOTO_CLASSES = "mb-6 h-40 w-40 rounded-full object-cover";

const NAME_CLASSES = "font-heading text-xl font-medium text-brand-navy";

const ROLE_CLASSES = "mt-1 font-body text-sm font-semibold text-brand-navy/70";

const BIO_CLASSES = "mt-4 font-body text-base leading-relaxed text-brand-navy/75";

/**
 * "Professores" band: one card per `courseContent.faculty` entry, showing
 * photo, name, role and bio. The photo value is rendered as given.
 */
export function Faculty() {
  return (
    <Section tone="white" id="professores">
      <div className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Corpo docente</h2>
        <div className={GRID_CLASSES}>
          {courseContent.faculty.map((professor) => (
            <article key={professor.name} data-testid="faculty-card" className={CARD_CLASSES}>
              {/* eslint-disable-next-line @next/next/no-img-element -- photo source is content-driven, not a static asset */}
              <img src={professor.photo} alt={professor.name} className={PHOTO_CLASSES} />
              <h3 className={NAME_CLASSES}>{professor.name}</h3>
              <p className={ROLE_CLASSES}>{professor.role}</p>
              <p className={BIO_CLASSES}>{professor.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
