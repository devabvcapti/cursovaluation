import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedTextCycle } from "./AnimatedTextCycle";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("AnimatedTextCycle", () => {
  it("renders only the first word, with no cycling, when reduced motion is preferred", () => {
    render(<AnimatedTextCycle words={["Valuation", "M&A", "Governança"]} />);
    expect(screen.getByText("Valuation")).toBeInTheDocument();
    expect(screen.queryByText("Governança")).not.toBeInTheDocument();
  });
});
