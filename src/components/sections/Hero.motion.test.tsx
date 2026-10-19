import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";
import { courseContent } from "@/content/curso";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => false }));

describe("Hero (full motion)", () => {
  it("renders the animated variant (data-motion=full) with the same content", () => {
    render(<Hero />);
    expect(screen.getByTestId("hero-root")).toHaveAttribute("data-motion", "full");

    const heading = screen.getByRole("heading", { level: 1 });
    for (const line of courseContent.hero.headlineLines) {
      expect(heading).toHaveTextContent(line);
    }
    expect(screen.getByTestId("hero-secondary-cta")).toBeInTheDocument();
  });
});
