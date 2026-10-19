import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-3";

const CARD_CLASSES = "flex flex-col rounded-sm border border-brand-navy/10 bg-white p-8 shadow-sm";

const QUOTE_CLASSES = "font-body text-base leading-relaxed text-brand-navy/80";

const AUTHOR_ROW_CLASSES = "mt-8 flex items-center gap-4";

const PHOTO_CLASSES = "h-14 w-14 shrink-0 rounded-full object-cover";

const AUTHOR_NAME_CLASSES = "font-heading text-base font-medium text-brand-navy";

const AUTHOR_ROLE_CLASSES = "font-body text-sm text-brand-navy/70";

/**
 * "Depoimentos" band: one card per `courseContent.testimonials` entry,
 * showing quote, photo, author name, role and company. The photo value is
 * rendered as given.
 */
export function SocialProof() {
  return (
    <Section tone="white">
      <div className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>O que dizem os alunos</h2>
        <div className={GRID_CLASSES}>
          {courseContent.testimonials.map((testimonial) => (
            <figure key={testimonial.author} data-testid="testimonial" className={CARD_CLASSES}>
              <blockquote className={QUOTE_CLASSES}>&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className={AUTHOR_ROW_CLASSES}>
                {/* eslint-disable-next-line @next/next/no-img-element -- photo source is content-driven, not a static asset */}
                <img src={testimonial.photo} alt={testimonial.author} className={PHOTO_CLASSES} />
                <span className="flex flex-col">
                  <span className={AUTHOR_NAME_CLASSES}>{testimonial.author}</span>
                  <span className={AUTHOR_ROLE_CLASSES}>
                    {testimonial.role}, {testimonial.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}
