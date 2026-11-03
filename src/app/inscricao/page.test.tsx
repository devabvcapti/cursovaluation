import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InscricaoPage from "./page";

vi.mock("@/components/checkout/CheckoutForm", () => ({
  CheckoutForm: ({
    onPedidoCreated,
  }: {
    onPedidoCreated: (pedido: { pedidoId: string; valorCobrado: number; email: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onPedidoCreated({ pedidoId: "pedido-123", valorCobrado: 1500, email: "ana@example.com" })
      }
    >
      CheckoutForm Stub
    </button>
  ),
}));

vi.mock("@/components/checkout/PaymentStep", () => ({
  PaymentStep: ({
    pedidoId,
    valorCobrado,
    email,
  }: {
    pedidoId: string;
    valorCobrado: number;
    email: string;
  }) => (
    <div>
      PaymentStep Stub: {pedidoId} / {valorCobrado} / {email}
    </div>
  ),
}));

describe("InscricaoPage", () => {
  it("renders CheckoutForm initially, not PaymentStep", () => {
    render(<InscricaoPage />);

    expect(screen.getByText("CheckoutForm Stub")).toBeInTheDocument();
    expect(screen.queryByText(/PaymentStep Stub/)).not.toBeInTheDocument();
  });

  it("renders PaymentStep with the pedido data after onPedidoCreated fires", async () => {
    const user = userEvent.setup();
    render(<InscricaoPage />);

    await user.click(screen.getByText("CheckoutForm Stub"));

    expect(screen.queryByText("CheckoutForm Stub")).not.toBeInTheDocument();
    expect(screen.getByText("PaymentStep Stub: pedido-123 / 1500 / ana@example.com")).toBeInTheDocument();
  });
});
