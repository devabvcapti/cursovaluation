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
  await user.click(screen.getByRole("checkbox", { name: /termos de uso/i }));
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

  it("shows the non-associado price immediately on mount, before any interaction", async () => {
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    expect(await screen.findByText(/R\$\s*7\.650,00/)).toBeInTheDocument();
  });

  it("shows the discount percentage when a valid cupom resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          return jsonResponse({
            isAssociado: false,
            cupomAplicado: "PROMO10",
            percentualDesconto: 10,
            valorBase: 7650,
            valorCobrado: 6885,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 6885 });
      })
    );

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/cupom.*opcional/i), "PROMO10");

    expect(await screen.findByText(/R\$\s*6\.885,00/)).toBeInTheDocument();
    expect(screen.getByText(/10%\s*de desconto aplicado/)).toBeInTheDocument();
  });

  it("shows an inline message when a typed cupom does not resolve to a discount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          return jsonResponse({
            isAssociado: false,
            cupomAplicado: null,
            percentualDesconto: null,
            valorBase: 7650,
            valorCobrado: 7650,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 7650 });
      })
    );

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/cupom.*opcional/i), "INEXISTENTE");

    expect(await screen.findByText(/cupom inválido ou expirado/i)).toBeInTheDocument();
  });

  it("renders nome, e-mail, CPF, telefone and cupom (opcional) fields, with no member toggle or CNPJ field", () => {
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupom.*opcional/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sou associado abvcap/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cnpj/i)).not.toBeInTheDocument();
  });

  it("debounces the price preview call on cupom change and displays the formatted price", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/cupom.*opcional/i), "PROMO10");

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

  it("does not flash a stale preview when the cupom changes before the new fetch resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          const parsedBody = init?.body ? (JSON.parse(init.body as string) as { cupom?: string }) : {};
          if (parsedBody.cupom === "OUTRO") {
            return jsonResponse({
              isAssociado: false,
              cupomAplicado: null,
              valorBase: 500,
              valorCobrado: 500,
            });
          }
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

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    const cupomInput = screen.getByLabelText(/cupom.*opcional/i);

    // Resolve a preview for the first cupom.
    await user.type(cupomInput, "PRIMEIRO");
    await waitFor(() => expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument(), {
      timeout: 2000,
    });

    // Clear the field and start typing a different cupom. The new fetch is
    // still debounced (hasn't fired/resolved yet), but the old, now-stale
    // R$ 1.000,00 preview must not still be shown in the meantime.
    await user.clear(cupomInput);
    await user.type(cupomInput, "OUTRO");
    expect(screen.queryByText(/R\$\s*1\.000,00/)).not.toBeInTheDocument();

    // Once the new fetch resolves, the new preview does show.
    await waitFor(() => expect(screen.getByText(/R\$\s*500,00/)).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("shows the member badge and associado price when a typed email matches the GlueUp export, without checking the member toggle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          const parsedBody = init?.body ? (JSON.parse(init.body as string) as { email?: string }) : {};
          const matched = parsedBody.email === "membro@abvcap.com.br";
          return jsonResponse({
            isAssociado: matched,
            empresaAssociada: matched ? "ABVCAP" : null,
            cupomAplicado: null,
            percentualDesconto: null,
            valorBase: 1000,
            valorCobrado: matched ? 800 : 1000,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 1000 });
      })
    );

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/e-mail/i), "membro@abvcap.com.br");

    expect(await screen.findByText(/membro abvcap.*abvcap/i)).toBeInTheDocument();
    expect(await screen.findByText(/R\$\s*800,00/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/cnpj/i)).not.toBeInTheDocument();
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

  it("blocks submission with an inline error when the terms checkbox is left unchecked", async () => {
    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await user.type(screen.getByLabelText(/nome/i), VALID.nome);
    await user.type(screen.getByLabelText(/e-mail/i), VALID.email);
    await user.type(screen.getByLabelText(/cpf/i), VALID.cpf);
    await user.type(screen.getByLabelText(/telefone/i), VALID.telefone);
    await user.click(screen.getByRole("button", { name: /inscri|finaliz|continuar/i }));

    expect(
      await screen.findByText(/concordar com os termos de uso e a política de privacidade/i),
    ).toBeInTheDocument();
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/pedido")
      ).length
    ).toBe(0);
    expect(onPedidoCreated).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: /termos de uso/i }));
    await user.click(screen.getByRole("button", { name: /inscri|finaliz|continuar/i }));

    await waitFor(() => expect(onPedidoCreated).toHaveBeenCalled());
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
