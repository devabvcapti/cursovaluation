import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";
import { courseContent } from "@/content/curso";

describe("Header", () => {
  it("renders the primary CTA pointing at the checkout URL from content", () => {
    render(<Header />);
    const cta = screen.getByRole("link", { name: /matricule-se/i });
    expect(cta).toHaveAttribute("href", courseContent.hero.checkoutUrl);
  });
});
