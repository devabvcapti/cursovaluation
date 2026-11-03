import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/service-client", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("@/lib/cupons", () => ({ incrementCupomUso: vi.fn() }));
vi.mock("@/lib/send-order-confirmation-email", () => ({ sendOrderConfirmationEmail: vi.fn() }));
vi.mock("@/lib/send-order-notification-email", () => ({ sendOrderNotificationEmail: vi.fn() }));

import { mapMpStatusToPedidoStatus } from "./apply-payment-status";

describe("mapMpStatusToPedidoStatus", () => {
  it('maps both unsettled Mercado Pago statuses ("pending" and "in_process") to our "pending"', () => {
    expect(mapMpStatusToPedidoStatus("pending")).toBe("pending");
    expect(mapMpStatusToPedidoStatus("in_process")).toBe("pending");
  });

  it("passes approved/rejected/cancelled through unchanged", () => {
    expect(mapMpStatusToPedidoStatus("approved")).toBe("approved");
    expect(mapMpStatusToPedidoStatus("rejected")).toBe("rejected");
    expect(mapMpStatusToPedidoStatus("cancelled")).toBe("cancelled");
  });

  it("returns null for statuses we don't model, so the row is left alone", () => {
    expect(mapMpStatusToPedidoStatus("refunded")).toBeNull();
    expect(mapMpStatusToPedidoStatus("charged_back")).toBeNull();
  });
});
