import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./CheckoutForm";

const VALID = {
  nome: "Ana",
  email: "ana@example.com",
  cpf: "11144477735",
  telefone: "11991480203",
};

async function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome/i), VALID.nome);
  await user.type(screen.getByLabelText(/e-mail/i), VALID.email);
  await user.type(screen.getByLabelText(/cpf/i), VALID.cpf);
  await user.type(screen.getByLabelText(/telefone/i), VALID.telefone);
}

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          return jsonResponse({
            isAssociado: false,
            cupomAplicado: null,
            valorBase: 1000,
            valorCobrado: 1000,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 1000 });
      })
    );
  });

  it("renders nome, e-mail, CPF, telefone, CNPJ (opcional) and cupom (opcional) fields", () => {
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj.*opcional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupom.*opcional/i)).toBeInTheDocument();
  });

  it("debounces the price preview call on cnpj change and displays the formatted price", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/cnpj.*opcional/i), "11222333000181");

    // Debounce: should not fire immediately on every keystroke.
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/preco")
      ).length
    ).toBe(0);

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/checkout/preco",
          expect.objectContaining({ method: "POST" })
        );
      },
      { timeout: 2000 }
    );

    expect(await screen.findByText(/R\$\s*1\.000,00/)).toBeInTheDocument();
  });

  it("shows inline errors and never calls /api/checkout/pedido when the form is invalid", async () => {
    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await user.click(screen.getByRole("button", { name: /inscri|finaliz|continuar/i }));

    expect(await screen.findAllByText("Campo obrigatório.")).not.toHaveLength(0);
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/pedido")
      ).length
    ).toBe(0);
    expect(onPedidoCreated).not.toHaveBeenCalled();
  });

  it("posts to /api/checkout/pedido and calls onPedidoCreated with pedidoId, valorCobrado and email on success", async () => {
    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await fillValidFields(user);
    await user.click(screen.getByRole("button", { name: /inscri|finaliz|continuar/i }));

    await waitFor(() => {
      expect(onPedidoCreated).toHaveBeenCalledWith({
        pedidoId: "pedido-1",
        valorCobrado: 1000,
        email: VALID.email,
      });
    });

    const pedidoCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/pedido")
    );
    expect(pedidoCall).toBeDefined();
    expect(pedidoCall?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(VALID.email),
      })
    );
  });

  it("shows a generic retry error and does not call onPedidoCreated on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          return jsonResponse({
            isAssociado: false,
            cupomAplicado: null,
            valorBase: 1000,
            valorCobrado: 1000,
          });
        }
        return jsonResponse({ errors: { nome: "Não foi possível iniciar o pagamento agora." } }, false, 502);
      })
    );

    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await fillValidFields(user);
    await user.click(screen.getByRole("button", { name: /inscri|finaliz|continuar/i }));

    expect(await screen.findByText(/não foi possível|tente novamente/i)).toBeInTheDocument();
    expect(onPedidoCreated).not.toHaveBeenCalled();
  });
});
