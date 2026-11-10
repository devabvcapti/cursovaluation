import { describe, it, expect, vi, beforeEach } from "vitest";

const sendLeadNotificationMock = vi.fn();

vi.mock("@/lib/send-lead-notification", () => ({
  sendLeadNotification: sendLeadNotificationMock,
}));

describe("POST /api/checkout/lead", () => {
  beforeEach(() => {
    sendLeadNotificationMock.mockReset();
  });

  it("returns 400 and does not attempt delivery for an invalid payload", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/lead", {
      method: "POST",
      body: JSON.stringify({ nome: "", email: "not-an-email" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(sendLeadNotificationMock).not.toHaveBeenCalled();
  });

  it("notifies admissions and returns 200 for a valid payload, without sending the ementa", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/lead", {
      method: "POST",
      body: JSON.stringify({ nome: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(sendLeadNotificationMock).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@example.com",
      origem: "checkout",
    });
  });

  it("returns 502 when the admissions notification fails to send", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: false, reason: "domain not verified" });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/lead", {
      method: "POST",
      body: JSON.stringify({ nome: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(502);
  });
});
