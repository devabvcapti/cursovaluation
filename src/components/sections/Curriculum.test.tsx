import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Curriculum } from "./Curriculum";
import { courseContent } from "@/content/curso";

describe("Curriculum", () => {
  it("renders one accordion trigger per module and reveals its lessons on click", async () => {
    const user = userEvent.setup();
    render(<Curriculum />);
    expect(screen.getAllByRole("button")).toHaveLength(courseContent.curriculumModules.length);
    const firstModule = courseContent.curriculumModules[0];
    const trigger = screen.getByRole("button", { name: new RegExp(firstModule.title) });
    await user.click(trigger);
    expect(screen.getByText(firstModule.lessons[0])).toBeVisible();
  });
});
