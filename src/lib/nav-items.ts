import { BookOpen, HelpCircle, Users, Wallet, Workflow, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Shared by the desktop (navigation-menu-05) and mobile nav so both list the same sections. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Programa", href: "#programa", icon: BookOpen },
  { title: "Diferenciais", href: "#metodologia", icon: Workflow },
  { title: "Professores", href: "#professores", icon: Users },
  { title: "Investimento", href: "#investimento", icon: Wallet },
  { title: "FAQ", href: "#faq", icon: HelpCircle },
];

export const NAV_SECTION_IDS = NAV_ITEMS.map((item) => item.href.slice(1));
