import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const redirectMock = vi.fn((url: string) => {
  // Mirrors Next's real redirect(), which throws to abort rendering.
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

const requireAdminSessionMock = vi.fn();
vi.mock("@/lib/supabase/require-admin-session", () => ({
  requireAdminSession: () => requireAdminSessionMock(),
}));

const orderMock = vi.fn();
const selectMock = vi.fn().mockReturnValue({ order: orderMock });
const fromMock = vi.fn().mockReturnValue({ select: selectMock });
const getSupabaseServiceClientMock = vi.fn().mockReturnValue({ from: fromMock });
vi.mock("@/lib/supabase/service-client", () => ({
  getSupabaseServiceClient: () => getSupabaseServiceClientMock(),
}));

// The session-cookie client must NOT be used for this read (RLS on `cupons`
// has no policies, so it silently returns zero rows).
const getSupabaseServerClientMock = vi.fn();
vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: () => getSupabaseServerClientMock(),
}));

vi.mock("@/components/admin/CupomList", () => ({
  CupomList: ({ initialCupons }: { initialCupons: Array<{ codigo: string }> }) => (
    <ul>
      {initialCupons.map((c) => (
        <li key={c.codigo}>{c.codigo}</li>
      ))}
    </ul>
  ),
}));

import CuponsPage from "./page";

describe("admin cupons page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({ order: orderMock });
    fromMock.mockReturnValue({ select: selectMock });
    getSupabaseServiceClientMock.mockReturnValue({ from: fromMock });
  });

  it("redirects to /admin/login without a session and never queries", async () => {
    requireAdminSessionMock.mockResolvedValue(null);

    await expect(CuponsPage()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("lists cupons read through the service-role client when a session is present", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "ti@abvcap.com.br" });
    orderMock.mockResolvedValue({ data: [{ codigo: "PROMO10" }, { codigo: "VIP20" }], error: null });

    render(await CuponsPage());

    expect(getSupabaseServiceClientMock).toHaveBeenCalled();
    expect(getSupabaseServerClientMock).not.toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith("cupons");
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(screen.getByText("PROMO10")).toBeInTheDocument();
    expect(screen.getByText("VIP20")).toBeInTheDocument();
  });

  it("shows an explicit error instead of an empty list when the query fails", async () => {
    requireAdminSessionMock.mockResolvedValue({ email: "ti@abvcap.com.br" });
    orderMock.mockResolvedValue({ data: null, error: { message: "db down" } });

    render(await CuponsPage());

    expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível carregar os cupons/i);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
