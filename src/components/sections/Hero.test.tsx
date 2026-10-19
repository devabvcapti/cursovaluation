import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";
import { courseContent } from "@/content/curso";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("Hero", () => {
  it("renders statically (data-motion=reduced) and shows the full headline immediately", () => {
    render(<Hero />);
    const root = screen.getByTestId("hero-root");
    expect(root).toHaveAttribute("data-motion", "reduced");
  });

  it("renders every headline line from courseContent inside the h1", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    for (const line of courseContent.hero.headlineLines) {
      expect(heading).toHaveTextContent(line);
    }
  });

  it("points the primary CTA at the checkout URL and renders an inert secondary CTA", () => {
    render(<Hero />);
    const secondary = screen.getByTestId("hero-secondary-cta");
    expect(secondary.tagName).toBe("BUTTON");
    expect(secondary).toHaveAttribute("type", "button");
    expect(secondary).toHaveTextContent(courseContent.hero.syllabusCtaLabel);

    const primary = screen.getByRole("link", { name: /matricular/i });
    expect(primary).toHaveAttribute("href", courseContent.hero.checkoutUrl || "#");
  });
});
