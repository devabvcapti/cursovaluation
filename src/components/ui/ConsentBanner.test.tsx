import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "./ConsentBanner";

describe("ConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner on first visit and hides it after accepting, remembering the choice", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /cookies/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /aceitar/i }));

    expect(screen.queryByRole("region", { name: /cookies/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("abvcap-consent")).toBe("accepted");
  });

  it("hides the banner after rejecting and does not show it again on a later mount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /cookies/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /recusar/i }));
    expect(window.localStorage.getItem("abvcap-consent")).toBe("rejected");
    unmount();

    render(<ConsentBanner />);
    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /cookies/i })).not.toBeInTheDocument();
    });
  });
});
