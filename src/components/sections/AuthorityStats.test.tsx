import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthorityStats } from "./AuthorityStats";
import { courseContent } from "@/content/curso";

describe("AuthorityStats", () => {
  it("renders one stat per entry in content", () => {
    render(<AuthorityStats />);
    expect(screen.getAllByTestId("authority-stat")).toHaveLength(courseContent.authorityStats.length);
  });
});
