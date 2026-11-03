import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a link with the given href", () => {
    render(<Button href="https://example.com/checkout" variant="primary">Matricule-se</Button>);
    const link = screen.getByRole("link", { name: "Matricule-se" });
    expect(link).toHaveAttribute("href", "https://example.com/checkout");
  });
  it("never renders an empty href", () => {
    render(<Button href="[URL DA PRATELEIRA]" variant="primary">Matricule-se</Button>);
    const link = screen.getByRole("link", { name: "Matricule-se" });
    expect(link.getAttribute("href")).not.toBe("");
  });
  it("opens external links safely", () => {
    render(<Button href="https://example.com" variant="secondary">Saiba mais</Button>);
    const link = screen.getByRole("link", { name: "Saiba mais" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("navigates in-place for an internal href, without opening a new tab", () => {
    render(<Button href="/inscricao" variant="primary">Quero me matricular</Button>);
    const link = screen.getByRole("link", { name: "Quero me matricular" });
    expect(link).toHaveAttribute("href", "/inscricao");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });
});
