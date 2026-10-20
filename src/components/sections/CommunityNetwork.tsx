import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-white md:text-5xl";

const BODY_CLASSES = "mt-8 max-w-3xl font-body text-lg leading-relaxed text-white/75";

/**
 * "Rede e comunidade" band: the `courseContent.community` title and body,
 * describing the ABVCAP network that alumni join on completion.
 */
export function CommunityNetwork() {
  return (
    <Section tone="navy">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>{courseContent.community.title}</h2>
        <p className={BODY_CLASSES}>{courseContent.community.body}</p>
      </ScrollReveal>
    </Section>
  );
}
