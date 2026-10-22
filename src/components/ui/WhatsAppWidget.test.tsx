import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppWidget } from "./WhatsAppWidget";
import { courseContent } from "@/content/curso";

describe("WhatsAppWidget", () => {
  it("links to wa.me with ABVCAP's WhatsApp number, a pre-filled message, and opens in a new tab", () => {
    render(<WhatsAppWidget />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    const expectedHref = `https://wa.me/${courseContent.whatsappNumber}?text=${encodeURIComponent(courseContent.whatsappMessage)}`;
    expect(link).toHaveAttribute("href", expectedHref);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
