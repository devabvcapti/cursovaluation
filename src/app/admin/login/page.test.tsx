import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const signInWithOAuthMock = vi.fn();
vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signInWithOAuth: signInWithOAuthMock },
  }),
}));

describe("admin login page", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    signInWithOAuthMock.mockReset();
    // `signInWithOAuth` reads `window.location.origin`/`search` — give the
    // test full control over both without a real navigation.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/admin/login"),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("starts Microsoft sign-in with the callback redirect on click", async () => {
    signInWithOAuthMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /entrar com microsoft/i }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "azure",
      options: { scopes: "email", redirectTo: "http://localhost/auth/callback" },
    });
  });

  it("shows an inline error and does not treat it as success when signInWithOAuth errors", async () => {
    signInWithOAuthMock.mockResolvedValue({ error: { message: "Provedor Azure não configurado." } });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /entrar com microsoft/i }));

    expect(await screen.findByText("Provedor Azure não configurado.")).toBeInTheDocument();
  });

  it("shows the access-denied message when redirected back with ?denied=1", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/admin/login?denied=1"),
    });

    render(<LoginPage />);

    expect(await screen.findByText(/não tem permissão para gerenciar cupons/i)).toBeInTheDocument();
  });

  it("does not show the access-denied message on a plain visit", () => {
    render(<LoginPage />);

    expect(screen.queryByText(/não tem permissão para gerenciar cupons/i)).not.toBeInTheDocument();
  });
});
