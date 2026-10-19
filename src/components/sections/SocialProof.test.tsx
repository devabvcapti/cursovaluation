import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProof } from "./SocialProof";
import { courseContent } from "@/content/curso";

describe("SocialProof", () => {
  it("renders one testimonial per content entry", () => {
    render(<SocialProof />);
    expect(screen.getAllByTestId("testimonial")).toHaveLength(courseContent.testimonials.length);
  });
});
