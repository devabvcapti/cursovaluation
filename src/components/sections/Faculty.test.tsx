import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faculty } from "./Faculty";
import { courseContent } from "@/content/curso";

describe("Faculty", () => {
  it("renders one card per instructor", () => {
    render(<Faculty />);
    expect(screen.getAllByTestId("faculty-card")).toHaveLength(courseContent.faculty.length);
  });

  it("starts collapsed and reveals the bio and LinkedIn button on click", async () => {
    const user = userEvent.setup();
    render(<Faculty />);
    const [first] = courseContent.faculty;

    const trigger = screen.getByRole("button", { name: new RegExp(first.name) });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(first.bio)).not.toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(first.bio)).toBeVisible();
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", first.linkedin);
  });
});
