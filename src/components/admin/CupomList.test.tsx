import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CupomList } from "./CupomList";
import type { CupomRow } from "@/lib/supabase/types";

function cupom(overrides: Partial<CupomRow> = {}): CupomRow {
  return {
    id: "cupom-1",
    codigo: "PROMO10",
    percentual_desconto: 10,
    ativo: true,
    valido_de: null,
    valido_ate: null,
    limite_uso: null,
    usos_atuais: 0,
    criado_por: "ti@abvcap.com.br",
    curso_slug: "valuation",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
}

describe("CupomList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toggles ativo on success and updates the row from the response", async () => {
    const row = cupom({ ativo: true });
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(cupom({ ativo: false }))));
    const user = userEvent.setup();
    render(<CupomList initialCupons={[row]} />);

    await user.click(screen.getByRole("button", { name: /desativar/i }));

    expect(await screen.findByRole("button", { name: /^ativar$/i })).toBeInTheDocument();
  });

  it("sends the opposite ativo value to PATCH /api/admin/cupons/:codigo", async () => {
    const row = cupom({ codigo: "PROMO10", ativo: true });
    const fetchMock = vi.fn(() => jsonResponse(cupom({ ativo: false })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<CupomList initialCupons={[row]} />);

    await user.click(screen.getByRole("button", { name: /desativar/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/cupons/PROMO10",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ ativo: false }) }),
    );
  });

  it("shows the route's error message and leaves the row unchanged on a 401 (expired session)", async () => {
    const row = cupom({ ativo: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse({ errors: { geral: "Não autorizado." } }, false, 401)),
    );
    const user = userEvent.setup();
    render(<CupomList initialCupons={[row]} />);

    await user.click(screen.getByRole("button", { name: /desativar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não autorizado.");
    // The row's own state never changed — button still says "Desativar".
    expect(screen.getByRole("button", { name: /desativar/i })).toBeInTheDocument();
  });

  it("shows a generic error message when the fetch itself throws", async () => {
    const row = cupom({ ativo: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );
    const user = userEvent.setup();
    render(<CupomList initialCupons={[row]} />);

    await user.click(screen.getByRole("button", { name: /desativar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar o cupom agora.");
  });
});
