import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentStep } from "./PaymentStep";

// The real Payment Brick renders an iframe-backed widget jsdom can't render.
// This stub exposes `onSubmit` through a plain button so we can drive
// PaymentStep's submission/polling logic without the real Brick. The prop
// names (`onSubmit` receiving `{ formData }`) match the real
// `@mercadopago/sdk-react` Payment component's actual `onSubmit(param)`
// contract, where `param.formData` carries fields such as
// `payment_method_id` — see PaymentStep.tsx's header comment for the full
// discrepancy note against the task brief's assumptions.
vi.mock("@mercadopago/sdk-react", () => ({
  initMercadoPago: vi.fn(),
  Payment: (props: { onSubmit: (args: { formData: Record<string, unknown> }) => Promise<void> }) => (
    <button onClick={() => props.onSubmit({ formData: { token: "tok", payment_method_id: "visa" } })}>
      submit-brick
    </button>
  ),
}));

const PROPS = { pedidoId: "pedido-1", valorCobrado: 1000, email: "ana@example.com" };

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

async function flushMicrotasks(times = 6) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

describe("PaymentStep", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the mocked Payment Brick", () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ status: "approved" })));
    render(<PaymentStep {...PROPS} />);
    expect(screen.getByRole("button", { name: "submit-brick" })).toBeInTheDocument();
  });

  it("posts formData and paymentMethodId to /api/checkout/pagamento and shows an approved message on a 200 approved response", async () => {
    const fetchMock = vi.fn((_url?: string, _init?: RequestInit) => jsonResponse({ status: "approved" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PaymentStep {...PROPS} />);

    await user.click(screen.getByRole("button", { name: "submit-brick" }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find((c) => c[0] === "/api/checkout/pagamento");
      expect(call).toBeDefined();
    });

    const call = fetchMock.mock.calls.find((c) => c[0] === "/api/checkout/pagamento")!;
    expect(call[1]).toEqual(
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(call[1]!.body as string)).toEqual({
      pedidoId: "pedido-1",
      formData: { token: "tok", payment_method_id: "visa" },
      paymentMethodId: "visa",
    });

    expect(await screen.findByText(/aprovado/i)).toBeInTheDocument();
  });

  it("renders the Pix QR code and starts polling GET /api/checkout/pedido/:id on a 200 in_process response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/api/checkout/pedido/")) {
        return jsonResponse({ status: "pending" });
      }
      return jsonResponse({
        status: "in_process",
        pix: { qrCode: "00020126...", qrCodeBase64: "BASE64DATA" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentStep {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "submit-brick" }));
    await act(async () => {
      await flushMicrotasks();
    });

    const qrImage = screen.getByAltText(/qr/i);
    expect(qrImage).toHaveAttribute("src", "data:image/png;base64,BASE64DATA");

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      fetchMock.mock.calls.some(
        (c) => typeof c[0] === "string" && c[0].includes("/api/checkout/pedido/pedido-1"),
      ),
    ).toBe(true);
  });

  it("shows a decline message with no QR code on a 200 rejected response", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ status: "rejected" })));
    const user = userEvent.setup();
    render(<PaymentStep {...PROPS} />);

    await user.click(screen.getByRole("button", { name: "submit-brick" }));

    expect(await screen.findByText(/recusad/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
