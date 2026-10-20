import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";

const CONTENT_CLASSES =
  "relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 sm:grid-cols-3 lg:px-10";

const VALUE_CLASSES = "font-heading text-5xl font-light text-brand-green md:text-6xl";

const LABEL_CLASSES = "mt-4 max-w-[22ch] font-body text-sm leading-relaxed text-white/80";

const UNVERIFIED_MARKER_CLASSES = "mt-1 block font-body text-xs italic text-white/50";

/**
 * Institutional authority band (design spec) right after the Hero: one
 * `AnimatedCounter` per `courseContent.authorityStats` entry, each paired
 * with its label. Lives on the navy `Section` tone, matching the Hero's
 * field so the two read as one continuous opening statement.
 */
export function AuthorityStats() {
  return (
    <Section tone="navy">
      <ScrollReveal className={CONTENT_CLASSES}>
        {courseContent.authorityStats.map((stat) => (
          <div key={stat.label} data-testid="authority-stat" className="text-center sm:text-left">
            <AnimatedCounter to={stat.value} suffix={stat.suffix} className={VALUE_CLASSES} />
            <p className={LABEL_CLASSES}>
              {stat.label}
              {!stat.verified ? (
                <span className={UNVERIFIED_MARKER_CLASSES}>(número a confirmar)</span>
              ) : null}
            </p>
          </div>
        ))}
      </ScrollReveal>
    </Section>
  );
}
