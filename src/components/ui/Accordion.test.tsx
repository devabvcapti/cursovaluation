import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./Accordion";

const items = [
  { id: "m1", trigger: "Módulo 1", content: "Conteúdo do módulo 1" },
  { id: "m2", trigger: "Módulo 2", content: "Conteúdo do módulo 2" },
];

describe("Accordion", () => {
  it("toggles aria-expanded and reveals content on click", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole("button", { name: "Módulo 1" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Conteúdo do módulo 1")).toBeVisible();
  });
  it("toggles via keyboard (Enter) when the trigger is focused", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole("button", { name: "Módulo 2" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
  it("allows multiple items open independently", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByRole("button", { name: "Módulo 1" }));
    await user.click(screen.getByRole("button", { name: "Módulo 2" }));
    expect(screen.getByRole("button", { name: "Módulo 1" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Módulo 2" })).toHaveAttribute("aria-expanded", "true");
  });
});
