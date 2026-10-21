"use client";

import { BookOpen, HelpCircle, Users, Wallet, Workflow } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useActiveSection } from "@/lib/hooks/use-active-section";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navigationMenuItems = [
  { title: "Programa", href: "#programa", icon: BookOpen },
  { title: "Metodologia", href: "#metodologia", icon: Workflow },
  { title: "Professores", href: "#professores", icon: Users },
  { title: "Investimento", href: "#investimento", icon: Wallet },
  { title: "FAQ", href: "#faq", icon: HelpCircle },
];

const SECTION_IDS = navigationMenuItems.map((item) => item.href.slice(1));

/**
 * In-page nav with an icon per item and a bottom bar that animates in on
 * hover/focus, staying visible for whichever section is currently in
 * view (`useActiveSection` scroll-spy) via Radix's `data-active` attribute.
 */
export function NavigationMenuWithActiveItem() {
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <NavigationMenu aria-label="Seções da página">
      <NavigationMenuList className="space-x-8">
        {navigationMenuItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
              active={activeId === item.href.slice(1)}
              asChild
              className={cn(
                "group relative inline-flex h-9 w-max items-center justify-center px-0.5 py-2 font-body font-medium text-sm text-brand-navy/80",
                "before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:scale-x-0 before:bg-primary before:transition-transform",
                "hover:text-accent-foreground hover:before:scale-x-100",
                "focus:text-accent-foreground focus:outline-hidden focus:before:scale-x-100",
                "disabled:pointer-events-none disabled:opacity-50",
                "data-active:bg-transparent data-[state=open]:before:scale-x-100 data-active:before:scale-x-100 data-active:text-accent-foreground",
                "hover:bg-transparent focus:bg-transparent active:bg-transparent",
              )}
            >
              <Link className="flex-row items-center gap-2" href={item.href}>
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
