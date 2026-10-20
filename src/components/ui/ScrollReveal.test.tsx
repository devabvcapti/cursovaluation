import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "./ScrollReveal";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("ScrollReveal", () => {
  it("renders children immediately and statically when reduced motion is preferred", () => {
    render(
      <ScrollReveal>
        <p>Conteúdo da seção</p>
      </ScrollReveal>,
    );
    const content = screen.getByText("Conteúdo da seção");
    expect(content).toBeInTheDocument();
    expect(content.closest("[data-motion]")).toHaveAttribute("data-motion", "reduced");
  });
});
