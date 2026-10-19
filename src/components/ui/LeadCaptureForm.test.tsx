import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadCaptureForm } from "./LeadCaptureForm";

describe("LeadCaptureForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
  });

  it("shows a validation error and does not submit when email is empty", async () => {
    const user = userEvent.setup();
    render(<LeadCaptureForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));
    // Targets the rendered error text specifically (by its exact copy, tied
    // to the email field via `aria-describedby="lead-email-error"`), not
    // `/e-mail/i` generally — the field's own <label> ("E-mail") already
    // matches that broader pattern and is present regardless of whether
    // error rendering works, which would make the assertion a false
    // positive (it'd pass even if `setErrors` were a no-op).
    const emailInput = screen.getByLabelText(/e-mail/i);
    expect(emailInput).toHaveAttribute("aria-describedby", "lead-email-error");
    expect(await screen.findByText("Campo obrigatório.")).toHaveAttribute("id", "lead-email-error");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits to /api/lead when the payload is valid", async () => {
    const user = userEvent.setup();
    render(<LeadCaptureForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/lead",
      expect.objectContaining({ method: "POST" })
    );
  });
});
