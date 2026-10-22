"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LinkedinIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { courseContent } from "@/content/curso";
import { cn } from "@/lib/cn";

const CONTENT_CLASSES = "relative mx-auto w-full max-w-6xl px-6 lg:px-10";

const HEADING_CLASSES = "font-heading text-4xl font-light text-brand-navy md:text-5xl";

const GRID_CLASSES = "mt-14 grid grid-cols-1 gap-6 md:grid-cols-3";

const CARD_CLASSES = "rounded-sm border border-brand-navy/10 bg-white shadow-sm";

const TRIGGER_CLASSES = cn(
  "flex w-full flex-col items-center p-8 text-center",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const PHOTO_CLASSES = "mb-6 h-40 w-40 rounded-full object-cover";

const NAME_CLASSES = "font-heading text-xl font-medium text-brand-navy";

const ROLE_CLASSES = "mt-1 font-body text-sm font-semibold text-brand-navy/70";

const CHEVRON_CLASSES = "mt-4 h-5 w-5 text-brand-navy/50 transition-transform duration-200";

const PANEL_CLASSES = "px-8 pb-8 text-center";

const BIO_CLASSES = "font-body text-base leading-relaxed text-brand-navy/75";

/**
 * "Professores" band: one card per `courseContent.faculty` entry. Cards
 * start collapsed (photo, name, role only); clicking reveals the bio/CV and
 * a LinkedIn button. Each card toggles independently.
 */
export function Faculty() {
  const [openNames, setOpenNames] = useState<Set<string>>(() => new Set());
  const baseId = useId();

  const toggle = (name: string) => {
    setOpenNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <Section tone="white" id="professores">
      <ScrollReveal className={CONTENT_CLASSES}>
        <h2 className={HEADING_CLASSES}>Corpo docente</h2>
        <div className={GRID_CLASSES}>
          {courseContent.faculty.map((professor) => {
            const isOpen = openNames.has(professor.name);
            const triggerId = `${baseId}-trigger-${professor.name}`;
            const panelId = `${baseId}-panel-${professor.name}`;

            return (
              <article key={professor.name} data-testid="faculty-card" className={CARD_CLASSES}>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(professor.name)}
                  className={TRIGGER_CLASSES}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo source is content-driven, not a static asset */}
                  <img src={professor.photo} alt={professor.name} className={PHOTO_CLASSES} />
                  <h3 className={NAME_CLASSES}>{professor.name}</h3>
                  <p className={ROLE_CLASSES}>{professor.role}</p>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(CHEVRON_CLASSES, isOpen && "rotate-180")}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                  className={PANEL_CLASSES}
                >
                  <p className={BIO_CLASSES}>{professor.bio}</p>
                  <Button
                    href={professor.linkedin}
                    variant="secondary"
                    className="mt-5 gap-2 px-5 py-2 text-xs"
                  >
                    <LinkedinIcon />
                    Ver no LinkedIn
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </ScrollReveal>
    </Section>
  );
}
