import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProof } from "./SocialProof";
import { courseContent } from "@/content/curso";

describe("SocialProof", () => {
  it("renders one testimonial per content entry", () => {
    render(<SocialProof />);
    expect(screen.getAllByTestId("testimonial")).toHaveLength(courseContent.testimonials.length);
  });

  it("renders a video player for a testimonial with a videoUrl", () => {
    render(<SocialProof />);
    const videoCount = courseContent.testimonials.filter((t) => t.videoUrl).length;
    expect(screen.getAllByTestId("testimonial-video")).toHaveLength(videoCount);
  });
});
