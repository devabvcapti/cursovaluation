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
    // to the email field via `aria-describedby`), not `/e-mail/i` generally —
    // the field's own <label> ("E-mail") already matches that broader pattern
    // and is present regardless of whether error rendering works, which
    // would make the assertion a false positive (it'd pass even if
    // `setErrors` were a no-op). The id is now generated per-instance via
    // `useId()` (Fix 2), so we assert the shape instead of a literal string.
    const emailInput = screen.getByLabelText(/e-mail/i);
    const describedBy = emailInput.getAttribute("aria-describedby");
    expect(describedBy).toMatch(/-lead-email-error$/);
    const errorMessage = await screen.findByText("Campo obrigatório.");
    expect(errorMessage).toHaveAttribute("id", describedBy!);
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

  it("generates distinct ids for two instances mounted side by side (regression: duplicate DOM ids)", () => {
    render(
      <>
        <LeadCaptureForm />
        <LeadCaptureForm />
      </>
    );
    const nameInputs = screen.getAllByLabelText(/nome/i);
    const emailInputs = screen.getAllByLabelText(/e-mail/i);
    expect(nameInputs).toHaveLength(2);
    expect(emailInputs).toHaveLength(2);
    expect(nameInputs[0].id).not.toBe(nameInputs[1].id);
    expect(emailInputs[0].id).not.toBe(emailInputs[1].id);
  });

  it("shows the success message and does not call onSuccess until the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<LeadCaptureForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));

    expect(await screen.findByText(/recebemos seus dados/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /fechar/i }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows a generic error message when the server responds with a non-2xx status", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));
    const user = userEvent.setup();
    render(<LeadCaptureForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /baixar ementa/i }));

    expect(await screen.findByText(/não foi possível enviar seus dados agora/i)).toBeInTheDocument();
    // Distinct from the client-side validation error case: no field errors.
    expect(screen.queryByText("Campo obrigatório.")).not.toBeInTheDocument();
  });
});
