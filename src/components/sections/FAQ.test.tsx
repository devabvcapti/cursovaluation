import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FAQ } from "./FAQ";
import { courseContent } from "@/content/curso";

describe("FAQ", () => {
  it("renders one accordion trigger per question", () => {
    render(<FAQ />);
    expect(screen.getAllByRole("button")).toHaveLength(courseContent.faq.length);
  });
});
