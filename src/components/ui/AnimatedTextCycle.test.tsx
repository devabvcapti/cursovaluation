import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedTextCycle } from "./AnimatedTextCycle";

vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

describe("AnimatedTextCycle", () => {
  it("renders only the first word, with no cycling, when reduced motion is preferred", () => {
    render(<AnimatedTextCycle words={["Valuation", "M&A", "Governança"]} />);
    // The off-screen measurement copy renders every word (hence `ignore` here),
    // but the visible animated span must show only the first one.
    const ignore = '[aria-hidden="true"] *';
    expect(screen.getByText("Valuation", { ignore })).toBeInTheDocument();
    expect(screen.queryByText("Governança", { ignore })).not.toBeInTheDocument();
  });
});
