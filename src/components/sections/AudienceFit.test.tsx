import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudienceFit } from "./AudienceFit";
import { courseContent } from "@/content/curso";

describe("AudienceFit", () => {
  it("renders one card per audience profile", () => {
    render(<AudienceFit />);
    expect(screen.getAllByTestId("audience-profile")).toHaveLength(courseContent.audienceProfiles.length);
  });
});
