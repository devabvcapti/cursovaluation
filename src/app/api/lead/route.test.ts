import { describe, it, expect, vi, beforeEach } from "vitest";

const sendLeadNotificationMock = vi.fn();

vi.mock("@/lib/send-lead-notification", () => ({
  sendLeadNotification: sendLeadNotificationMock,
}));

describe("POST /api/lead", () => {
  beforeEach(() => {
    sendLeadNotificationMock.mockReset();
  });

  it("returns 400 and does not attempt delivery for an invalid payload", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "not-an-email" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(sendLeadNotificationMock).not.toHaveBeenCalled();
  });

  it("returns 200 when the payload is valid and delivery succeeds", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("returns 502 when the payload is valid but delivery fails", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: false, reason: "domain not verified" });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(502);
  });
});
