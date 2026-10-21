"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useActiveSection } from "@/lib/hooks/use-active-section";
import { NAV_ITEMS, NAV_SECTION_IDS } from "@/lib/nav-items";

/** Hamburger button for the below-`lg` nav; `Header` owns the open/closed state. */
export function MobileNavToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-nav-panel"
      aria-label={open ? "Fechar menu" : "Abrir menu"}
      className="flex h-10 w-10 shrink-0 items-center justify-center text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green lg:hidden"
    >
      {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
    </button>
  );
}

/**
 * Mobile nav panel: a normal (non-absolute) block, so opening it pushes the
 * page content below down rather than overlaying it. Shares `NAV_ITEMS` and
 * the scroll-spy hook with the desktop `NavigationMenuWithActiveItem`; each
 * tap calls `onNavigate` to collapse the panel.
 */
export function MobileNavPanel({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const activeId = useActiveSection(NAV_SECTION_IDS);

  if (!open) {
    return null;
  }

  return (
    <nav
      id="mobile-nav-panel"
      aria-label="Seções da página — menu mobile"
      className="border-t border-brand-navy/10 bg-white px-6 py-3 lg:hidden"
    >
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 font-body text-sm font-medium text-brand-navy/80 transition-colors",
                "hover:bg-brand-navy/5 hover:text-brand-navy",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
                activeId === item.href.slice(1) && "bg-brand-navy/5 text-brand-navy",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
