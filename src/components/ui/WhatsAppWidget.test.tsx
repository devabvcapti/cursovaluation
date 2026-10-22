import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppWidget } from "./WhatsAppWidget";
import { courseContent } from "@/content/curso";

describe("WhatsAppWidget", () => {
  it("links to wa.me with ABVCAP's WhatsApp number and opens in a new tab", () => {
    render(<WhatsAppWidget />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link).toHaveAttribute("href", `https://wa.me/${courseContent.whatsappNumber}`);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
