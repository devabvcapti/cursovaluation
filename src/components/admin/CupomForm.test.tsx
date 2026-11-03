import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CupomForm } from "./CupomForm";

function jsonResponse(body: unknown, ok = true, status = ok ? 201 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

const CREATED_ROW = {
  id: "1",
  codigo: "ABC10",
  percentual_desconto: 10,
  ativo: true,
  valido_de: null,
  valido_ate: null,
  limite_uso: null,
  usos_atuais: 0,
  criado_por: "admin@abvcap.com.br",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("CupomForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(CREATED_ROW)),
    );
  });

  it("renders código, percentual, válido de/até and limite de uso fields", () => {
    render(<CupomForm onCreated={vi.fn()} />);

    expect(screen.getByLabelText(/código/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/percentual de desconto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/válido de/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/válido até/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/limite de uso/i)).toBeInTheDocument();
  });

  it("posts a valid submission to /api/admin/cupons and calls onCreated on 201, then clears the form", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<CupomForm onCreated={onCreated} />);

    const codigoInput = screen.getByLabelText(/código/i);
    const percentualInput = screen.getByLabelText(/percentual de desconto/i);

    await user.type(codigoInput, "abc10");
    await user.type(percentualInput, "10");
    await user.click(screen.getByRole("button", { name: /criar cupom/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(CREATED_ROW);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/cupons",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("abc10"),
      }),
    );
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsedBody = JSON.parse((call[1] as RequestInit).body as string);
    expect(parsedBody).toEqual(
      expect.objectContaining({ codigo: "abc10", percentualDesconto: 10 }),
    );

    // Cleared after success.
    expect((codigoInput as HTMLInputElement).value).toBe("");
    expect((percentualInput as HTMLInputElement).value).toBe("");
  });

  it("shows an inline error for an invalid percentual (e.g. 150) and never calls fetch", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<CupomForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/código/i), "ABC10");
    await user.type(screen.getByLabelText(/percentual de desconto/i), "150");
    await user.click(screen.getByRole("button", { name: /criar cupom/i }));

    expect(
      await screen.findByText(/percentual de desconto entre 1 e 100/i),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows an inline error for a blank código and never calls fetch", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<CupomForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/percentual de desconto/i), "10");
    await user.click(screen.getByRole("button", { name: /criar cupom/i }));

    expect(await screen.findByText(/informe o código do cupom/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows a generic error on a 400 response and does not call onCreated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse({ errors: { codigo: "Código já existe." } }, false, 400)),
    );

    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<CupomForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/código/i), "ABC10");
    await user.type(screen.getByLabelText(/percentual de desconto/i), "10");
    await user.click(screen.getByRole("button", { name: /criar cupom/i }));

    expect(
      await screen.findByText(/não foi possível criar o cupom agora/i),
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
