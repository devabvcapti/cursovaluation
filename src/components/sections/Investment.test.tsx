import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Investment } from "./Investment";
import { courseContent } from "@/content/curso";

describe("Investment", () => {
  it("shows the non-member card with the full and early-bird prices", () => {
    render(<Investment />);
    const card = screen.getByTestId("pricing-card-non-member");
    expect(within(card).getByText("R$ 8.500,00")).toBeInTheDocument();
    expect(within(card).getByText("R$ 7.650,00")).toBeInTheDocument();
  });

  it("shows the ABVCAP member card with the member full and early-bird prices", () => {
    render(<Investment />);
    const card = screen.getByTestId("pricing-card-member");
    expect(within(card).getByText("R$ 6.800,00")).toBeInTheDocument();
    expect(within(card).getByText("R$ 6.120,00")).toBeInTheDocument();
  });

  it("shows the early-bird deadline on both cards", () => {
    render(<Investment />);
    const deadline = courseContent.investment.earlyBirdDeadline;
    expect(screen.getAllByText(new RegExp(deadline))).toHaveLength(2);
  });

  it("keeps the enrollment CTA pointed at the checkout URL", () => {
    render(<Investment />);
    expect(screen.getByRole("link", { name: /quero me inscrever/i })).toHaveAttribute(
      "href",
      courseContent.investment.checkoutUrl,
    );
  });
});
