import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faculty } from "./Faculty";
import { courseContent } from "@/content/curso";

describe("Faculty", () => {
  it("renders the professor's name, role, bio and quote, always visible", () => {
    const [professor] = courseContent.faculty;
    render(<Faculty />);

    expect(screen.getByRole("heading", { name: professor.name })).toBeInTheDocument();
    expect(screen.getByText(professor.role)).toBeInTheDocument();
    for (const paragraph of professor.bio.split("\n\n")) {
      expect(screen.getByText(paragraph)).toBeVisible();
    }
    expect(screen.getByText(professor.quote, { exact: false })).toBeInTheDocument();
  });

  it("links to the professor's LinkedIn", () => {
    const [professor] = courseContent.faculty;
    render(<Faculty />);
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      professor.linkedin,
    );
  });
});
