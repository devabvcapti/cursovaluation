import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const signInWithPasswordMock = vi.fn();
vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock },
  }),
}));

describe("admin login page", () => {
  const originalLocation = window.location;

  function stubLocation(url: string) {
    // `href`/`search`/etc. are getters on URL's prototype, not own
    // properties — spreading the instance into a plain object would lose
    // them (and break next/image, which reads `window.location.href`
    // internally). Mutate the real instance instead so they stay intact.
    const location = new URL(url) as unknown as Location;
    (location as unknown as { assign: typeof vi.fn }).assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: location });
  }

  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    // The component reads `window.location.search` and navigates via
    // `window.location.assign` on success — give the test full control over
    // both without a real navigation.
    stubLocation("http://localhost/admin/login");
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("signs in with e-mail/senha and navigates to /admin/cupons on success", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "ti@abvcap.com.br");
    await user.type(screen.getByLabelText(/senha/i), "correct-horse-battery-staple");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "ti@abvcap.com.br",
      password: "correct-horse-battery-staple",
    });
    expect(window.location.assign).toHaveBeenCalledWith("/admin/cupons");
  });

  it("shows an inline error and does not navigate when signInWithPassword errors", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "ti@abvcap.com.br");
    await user.type(screen.getByLabelText(/senha/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("shows the access-denied message when redirected back with ?denied=1", async () => {
    stubLocation("http://localhost/admin/login?denied=1");

    render(<LoginPage />);

    expect(await screen.findByText(/não tem permissão para gerenciar cupons/i)).toBeInTheDocument();
  });

  it("does not show the access-denied message on a plain visit", () => {
    render(<LoginPage />);

    expect(screen.queryByText(/não tem permissão para gerenciar cupons/i)).not.toBeInTheDocument();
  });
});
