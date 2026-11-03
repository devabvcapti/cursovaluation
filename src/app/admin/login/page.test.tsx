import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const signInWithPasswordMock = vi.fn();
vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock },
  }),
}));

describe("admin login page", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signInWithPasswordMock.mockReset();
  });

  it("signs in and navigates to /admin/cupons on success", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "ti@abvcap.com.br");
    await user.type(screen.getByLabelText(/senha/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "ti@abvcap.com.br",
      password: "hunter2",
    });
    await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/cupons"));
  });

  it("shows an inline error and does not navigate on failed sign-in", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Credenciais inválidas." } });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "ti@abvcap.com.br");
    await user.type(screen.getByLabelText(/senha/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Credenciais inválidas.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
