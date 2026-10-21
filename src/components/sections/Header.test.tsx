import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { courseContent } from "@/content/curso";

describe("Header", () => {
  it("renders the primary CTA pointing at the checkout URL from content", () => {
    render(<Header />);
    const cta = screen.getByRole("link", { name: /matricule-se/i });
    expect(cta).toHaveAttribute("href", courseContent.hero.checkoutUrl);
  });

  it("opens the mobile nav panel on toggle and closes it after a link is clicked", async () => {
    const user = userEvent.setup();
    render(<Header />);

    expect(screen.queryByRole("navigation", { name: /menu mobile/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menu/i }));
    const panel = screen.getByRole("navigation", { name: /menu mobile/i });
    const programaLink = within(panel).getByRole("link", { name: /programa/i });
    expect(programaLink).toHaveAttribute("href", "#programa");

    await user.click(programaLink);
    expect(screen.queryByRole("navigation", { name: /menu mobile/i })).not.toBeInTheDocument();
  });
});
