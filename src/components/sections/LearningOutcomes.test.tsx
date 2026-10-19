import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningOutcomes } from "./LearningOutcomes";
import { courseContent } from "@/content/curso";

describe("LearningOutcomes", () => {
  it("renders one item per learning outcome", () => {
    render(<LearningOutcomes />);
    expect(screen.getAllByTestId("learning-outcome")).toHaveLength(courseContent.learningOutcomes.length);
  });
});
