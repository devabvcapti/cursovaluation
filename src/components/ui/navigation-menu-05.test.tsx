import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavigationMenuWithActiveItem } from "./navigation-menu-05";

const EXPECTED_LINKS = [
  { name: /programa/i, href: "#programa" },
  { name: /diferenciais/i, href: "#metodologia" },
  { name: /professores/i, href: "#professores" },
  { name: /investimento/i, href: "#investimento" },
  { name: /faq/i, href: "#faq" },
];

describe("NavigationMenuWithActiveItem", () => {
  it("renders one link per section with the correct anchor href", () => {
    render(<NavigationMenuWithActiveItem />);
    for (const { name, href } of EXPECTED_LINKS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});
