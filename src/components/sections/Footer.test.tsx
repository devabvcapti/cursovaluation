import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { courseContent } from "@/content/curso";

describe("Footer", () => {
  it("renders LinkedIn and YouTube links pointing at courseContent.socialLinks", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      courseContent.socialLinks.linkedin,
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      courseContent.socialLinks.youtube,
    );
  });

  it("renders the privacy policy, terms of use and refund policy links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      "/politica-de-privacidade",
    );
    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      "/termos-de-uso",
    );
    expect(screen.getByRole("link", { name: "Política de Reembolso" })).toHaveAttribute(
      "href",
      "/politica-de-reembolso",
    );
  });
});
