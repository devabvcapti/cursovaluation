"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface AccordionItem {
  id: string;
  trigger: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

/**
 * Disclosure list. Each trigger is a native `<button>` so Enter/Space
 * activation and focus handling come from the browser. Items toggle
 * independently: several can be open at once.
 */
export function Accordion({ items, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const baseId = useId();

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-brand-navy/15 border-y border-brand-navy/15", className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full min-h-11 items-center justify-between gap-4 py-4 text-left",
                  "font-heading text-base font-bold text-brand-navy",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
                )}
              >
                <span>{item.trigger}</span>
                <span aria-hidden="true" className="shrink-0 text-xl leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="pb-4 text-brand-navy/80"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
