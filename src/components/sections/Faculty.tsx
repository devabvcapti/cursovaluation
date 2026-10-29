import { Button } from "@/components/ui/Button";
import { LinkedinIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const PROFILE_ROW_CLASSES = "mt-14 flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12";

const PHOTO_WRAPPER_CLASSES = "lg:w-2/5 lg:shrink-0";

const PHOTO_CLASSES = "aspect-[4/5] w-full rounded-sm object-cover lg:aspect-auto lg:h-full";

const BIO_COLUMN_CLASSES = "flex flex-col justify-center lg:w-3/5";

const NAME_CLASSES = "font-heading text-2xl font-medium text-brand-navy md:text-3xl";

const ROLE_CLASSES = "mt-1 font-body text-base font-semibold text-brand-navy/70";

const BIO_CLASSES = "mt-5 font-body text-base leading-relaxed text-brand-navy/80";

const QUOTE_CLASSES = "mt-6 font-quote text-2xl italic text-brand-green md:text-3xl";

const LINKEDIN_LINK_CLASSES = "mt-6 inline-flex";

const COMPANIES_ROW_CLASSES = "mt-8 flex flex-wrap items-center gap-4 border-t border-brand-navy/10 pt-6";

const COMPANY_PLACEHOLDER_CLASSES =
  "flex h-10 items-center rounded-sm border border-dashed border-brand-navy/25 px-4 font-body text-xs font-medium uppercase tracking-[0.04em] text-brand-navy/40 grayscale";

const ENDORSEMENT_CLASSES =
  "mt-8 border-t border-brand-navy/10 pt-6 text-center font-body text-sm font-medium uppercase tracking-[0.06em] text-brand-navy/60";

/**
 * "Professor": a single editorial profile block (photo + bio), not a
 * card grid — the course currently has one confirmed instructor, so a
 * multi-card grid with empty slots would undersell him instead of reading
 * as thin. Stacks photo-over-bio on mobile (`flex-col`), splits ~40/60 on
 * desktop (`lg:flex-row`).
 */
export function Faculty() {
  const [professor] = courseContent.faculty;

  return (
    <Section tone="white" id="professores">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Professor</h2>
        <div className={PROFILE_ROW_CLASSES}>
          <div className={PHOTO_WRAPPER_CLASSES}>
            {/* eslint-disable-next-line @next/next/no-img-element -- photo source is content-driven, not a static asset */}
            <img src={professor.photo} alt={professor.name} className={PHOTO_CLASSES} />
          </div>
          <div className={BIO_COLUMN_CLASSES}>
            <h3 className={NAME_CLASSES}>{professor.name}</h3>
            <p className={ROLE_CLASSES}>{professor.role}</p>
            <p className={BIO_CLASSES}>{professor.bio}</p>
            <blockquote className={QUOTE_CLASSES}>&ldquo;{professor.quote}&rdquo;</blockquote>
            <Button
              href={professor.linkedin}
              variant="secondary"
              className={`${LINKEDIN_LINK_CLASSES} gap-2 px-5 py-2 text-xs`}
            >
              <LinkedinIcon />
              Ver no LinkedIn
            </Button>
            <div className={COMPANIES_ROW_CLASSES}>
              {professor.companies.map((company) => (
                <span key={company} className={COMPANY_PLACEHOLDER_CLASSES}>
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className={ENDORSEMENT_CLASSES}>Conteúdo e caso com curadoria e chancela ABVCAP</p>
      </ScrollReveal>
    </Section>
  );
}
