"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { NavigationMenuWithActiveItem } from "@/components/ui/navigation-menu-05";
import { MobileNavPanel, MobileNavToggle } from "@/components/ui/mobile-nav";
import { courseContent } from "@/content/curso";

/**
 * Fixed top bar, present at every scroll position (design spec §6.1 —
 * "Header fixo"). Built directly against markup/Tailwind rather than on
 * `Section`: `Section` owns a full-bleed vertical-rhythm band
 * (`py-20 md:py-28...`) meant for page sections, not a slim `sticky`
 * bar — and `Section` has no inner max-width wrapper by design (Task 2
 * review), so `Header` adds its own `mx-auto max-w-7xl` content wrapper.
 *
 * Renders a semantic `<header>` so it carries the implicit ARIA "banner"
 * role Task 15's page-assembly smoke test asserts on.
 */
export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-navy/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-10">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-3"
          aria-label="ABVCAP — topo da página"
        >
          <Image
            src="/brand/abvcap-logo-color.png"
            alt="ABVCAP"
            width={168}
            height={70}
            priority
            className="h-8 w-auto lg:h-9"
          />
          <span className="hidden font-heading text-sm font-bold uppercase tracking-[0.08em] text-brand-navy sm:inline">
            Aprenda com quem faz
          </span>
        </a>

        <div className="hidden lg:flex">
          <NavigationMenuWithActiveItem />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            href={courseContent.hero.checkoutUrl}
            variant="primary"
            className="px-5 py-2.5 text-xs"
          >
            Matricule-se
          </Button>
          <MobileNavToggle open={mobileNavOpen} onToggle={() => setMobileNavOpen((prev) => !prev)} />
        </div>
      </div>

      <MobileNavPanel open={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
    </header>
  );
}
