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

/** Fills screen 1 (Nome/E-mail), checks the terms box, but doesn't advance. */
async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome/i), VALID.nome);
  await user.type(screen.getByLabelText(/e-mail/i), VALID.email);
  await user.click(screen.getByRole("checkbox", { name: /termos de uso/i }));
}

/** Fills and submits screen 1, landing on screen 2 (Empresa/Cargo/CPF/Telefone/Cupom). */
async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
  await fillStep1(user);
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByLabelText(/cpf/i);
}

async function fillStep2(user: ReturnType<typeof userEvent.setup>) {
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

  it("shows the non-associado price immediately on mount, before any interaction", async () => {
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    expect(await screen.findByText(/R\$\s*7\.650,00/)).toBeInTheDocument();
  });

  it("renders Nome, E-mail, the member button and the terms checkbox on screen 1, with no Empresa/Cargo/CPF/Telefone/Cupom yet", () => {
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sou associado abvcap/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /termos de uso/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/empresa/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cargo/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/telefone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cupom.*opcional/i)).not.toBeInTheDocument();
  });

  it("advances to screen 2 (Empresa, Cargo, CPF, Telefone, Cupom) once Nome/E-mail/Termos are valid, firing a fire-and-forget partial-lead notification", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await goToStep2(user);

    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cargo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupom.*opcional/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar para pagamento/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/checkout/lead",
        expect.objectContaining({ method: "POST", body: expect.stringContaining(VALID.email) })
      );
    });
  });

  it("a 'Voltar' button on screen 2 returns to screen 1 without losing the typed nome/e-mail", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await goToStep2(user);
    await user.click(screen.getByRole("button", { name: /voltar/i }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue(VALID.nome);
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue(VALID.email);
    expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
  });

  it("shows inline errors and does not advance to screen 2 when nome/e-mail are blank", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findAllByText("Campo obrigatório.")).not.toHaveLength(0);
    expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/lead")
      ).length
    ).toBe(0);
  });

  it("blocks advancing to screen 2 with an inline error when the terms checkbox is left unchecked", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/nome/i), VALID.nome);
    await user.type(screen.getByLabelText(/e-mail/i), VALID.email);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByText(/concordar com os termos de uso e a política de privacidade/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /termos de uso/i }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByLabelText(/cpf/i)).toBeInTheDocument();
  });

  it("clicking 'Sou associado ABVCAP' only swaps the displayed reference price, with no network call", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    expect(await screen.findByText(/R\$\s*7\.650,00/)).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /sou associado abvcap/i });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/R\$\s*6\.120,00/)).toBeInTheDocument();
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/preco")
      ).length
    ).toBe(0);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(await screen.findByText(/R\$\s*7\.650,00/)).toBeInTheDocument();
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

    expect(await screen.findByText(/membro abvcap ativo/i)).toBeInTheDocument();
    expect(await screen.findByText(/R\$\s*800,00/)).toBeInTheDocument();
  });

  it("keeps showing the 'Valor do curso' / 'Desconto' breakdown — not a flat total — once a real associado e-mail match resolves, including after advancing to screen 2", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          const parsedBody = init?.body ? (JSON.parse(init.body as string) as { email?: string }) : {};
          const matched = parsedBody.email === VALID.email;
          return jsonResponse({
            isAssociado: matched,
            empresaAssociada: matched ? "ABVCAP" : null,
            cupomAplicado: null,
            percentualDesconto: null,
            valorBase: 6120,
            valorCobrado: matched ? 6120 : 7650,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 6120 });
      })
    );

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/e-mail/i), VALID.email);
    await screen.findByText(/membro abvcap/i);

    expect(screen.getByText(/R\$\s*7\.650,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*6\.120,00/)).toBeInTheDocument();
    expect(screen.getByText(/desconto/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nome/i), VALID.nome);
    await user.click(screen.getByRole("checkbox", { name: /termos de uso/i }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByLabelText(/cpf/i);

    expect(screen.getByText(/R\$\s*7\.650,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*6\.120,00/)).toBeInTheDocument();
    expect(screen.getByText(/desconto/i)).toBeInTheDocument();
  });

  it("directs the visitor to the Diretório de Membros when they claim to be a member but the e-mail has no match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/checkout/preco")) {
          return jsonResponse({
            isAssociado: false,
            empresaAssociada: null,
            cupomAplicado: null,
            percentualDesconto: null,
            valorBase: 1000,
            valorCobrado: 1000,
          });
        }
        return jsonResponse({ pedidoId: "pedido-1", valorCobrado: 1000 });
      })
    );

    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /sou associado abvcap/i }));
    await user.type(screen.getByLabelText(/e-mail/i), "naoassociado@example.com");

    const diretorioLink = await screen.findByRole("link", { name: /diretoriodemembros@abvcap\.com\.br/i });
    expect(diretorioLink).toHaveAttribute("href", "mailto:diretoriodemembros@abvcap.com.br");
    expect(screen.getByText(/não consta no Diretório de Membros ABVCAP/i)).toBeInTheDocument();
  });

  it("shows the discount percentage when a valid cupom resolves (screen 2)", async () => {
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

    await goToStep2(user);
    await user.type(screen.getByLabelText(/cupom.*opcional/i), "PROMO10");

    expect(await screen.findByText(/R\$\s*6\.885,00/)).toBeInTheDocument();
    expect(screen.getByText(/10%\s*de desconto aplicado/)).toBeInTheDocument();
  });

  it("shows an inline message when a typed cupom does not resolve to a discount (screen 2)", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await goToStep2(user);
    await user.type(screen.getByLabelText(/cupom.*opcional/i), "INEXISTENTE");

    expect(await screen.findByText(/cupom inválido ou expirado/i)).toBeInTheDocument();
  });

  it("debounces the price preview call on cupom change and displays the formatted price (screen 2)", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await goToStep2(user);

    (fetch as unknown as ReturnType<typeof vi.fn>).mockClear();
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

  it("does not flash a stale preview when the cupom changes before the new fetch resolves (screen 2)", async () => {
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

    await goToStep2(user);
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

  it("masks the CPF field as digits are typed (screen 2)", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onPedidoCreated={vi.fn()} />);

    await goToStep2(user);
    await user.type(screen.getByLabelText(/cpf/i), VALID.cpf);

    expect(screen.getByLabelText(/cpf/i)).toHaveValue("111.444.777-35");
  });

  it("shows inline errors and never calls /api/checkout/pedido when CPF/Telefone are invalid", async () => {
    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await goToStep2(user);
    await user.click(screen.getByRole("button", { name: /continuar para pagamento/i }));

    expect(await screen.findAllByText("Campo obrigatório.")).not.toHaveLength(0);
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("/api/checkout/pedido")
      ).length
    ).toBe(0);
    expect(onPedidoCreated).not.toHaveBeenCalled();
  });

  it("posts to /api/checkout/pedido (with empresa/cargo) and calls onPedidoCreated with pedidoId, valorCobrado and email on success", async () => {
    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await goToStep2(user);
    await user.type(screen.getByLabelText(/empresa/i), "ABVCAP");
    await user.type(screen.getByLabelText(/cargo/i), "Analista");
    await fillStep2(user);
    await user.click(screen.getByRole("button", { name: /continuar para pagamento/i }));

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
    expect(pedidoCall?.[1]).toEqual(expect.objectContaining({ method: "POST" }));
    const sentBody = JSON.parse((pedidoCall?.[1] as RequestInit).body as string);
    expect(sentBody).toEqual(expect.objectContaining({ email: VALID.email, empresa: "ABVCAP", cargo: "Analista" }));
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
        if (typeof url === "string" && url.includes("/api/checkout/pedido")) {
          return jsonResponse({ errors: { nome: "Não foi possível iniciar o pagamento agora." } }, false, 502);
        }
        return jsonResponse({ ok: true });
      })
    );

    const user = userEvent.setup();
    const onPedidoCreated = vi.fn();
    render(<CheckoutForm onPedidoCreated={onPedidoCreated} />);

    await goToStep2(user);
    await fillStep2(user);
    await user.click(screen.getByRole("button", { name: /continuar para pagamento/i }));

    expect(await screen.findByText(/não foi possível|tente novamente/i)).toBeInTheDocument();
    expect(onPedidoCreated).not.toHaveBeenCalled();
  });
});
