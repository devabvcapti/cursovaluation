import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./AnimatedCounter";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("AnimatedCounter", () => {
  it("renders the final value immediately when reduced motion is preferred", () => {
    render(<AnimatedCounter to={20} suffix="+" />);
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("20+").closest("[data-motion]")).toHaveAttribute("data-motion", "reduced");
  });
});
