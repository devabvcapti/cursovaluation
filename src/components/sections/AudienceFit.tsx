import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-2";

const CARD_CLASSES = "rounded-sm border border-brand-navy/10 bg-white p-8 shadow-sm";

const CARD_TITLE_CLASSES = "font-heading text-xl font-medium text-brand-navy";

const CARD_PAIN_CLASSES = "mt-4 font-body text-base leading-relaxed text-brand-navy/75";

/**
 * "Para quem é" band: one card per `courseContent.audienceProfiles` entry,
 * each naming the professional profile and the pain the course addresses.
 */
export function AudienceFit() {
  return (
    <Section tone="white" id="para-quem">
      <div className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Para quem é este programa</h2>
        <div className={GRID_CLASSES}>
          {courseContent.audienceProfiles.map((profile) => (
            <article key={profile.title} data-testid="audience-profile" className={CARD_CLASSES}>
              <h3 className={CARD_TITLE_CLASSES}>{profile.title}</h3>
              <p className={CARD_PAIN_CLASSES}>{profile.pain}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
