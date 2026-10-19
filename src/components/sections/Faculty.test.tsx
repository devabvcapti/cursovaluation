import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faculty } from "./Faculty";
import { courseContent } from "@/content/curso";

describe("Faculty", () => {
  it("renders one card per instructor", () => {
    render(<Faculty />);
    expect(screen.getAllByTestId("faculty-card")).toHaveLength(courseContent.faculty.length);
  });
});
