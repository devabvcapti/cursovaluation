"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
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

// lucide-react has no brand/logo icons; this is LinkedIn's own glyph.
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.114 20.452H3.558V9h3.556v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

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
