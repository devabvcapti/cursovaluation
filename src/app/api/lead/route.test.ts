import { describe, it, expect, vi, beforeEach } from "vitest";

const sendLeadNotificationMock = vi.fn();
const sendEmentaEmailMock = vi.fn();

vi.mock("@/lib/send-lead-notification", () => ({
  sendLeadNotification: sendLeadNotificationMock,
}));
vi.mock("@/lib/send-ementa-email", () => ({
  sendEmentaEmail: sendEmentaEmailMock,
}));

describe("POST /api/lead", () => {
  beforeEach(() => {
    sendLeadNotificationMock.mockReset();
    sendEmentaEmailMock.mockReset();
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
    expect(sendEmentaEmailMock).not.toHaveBeenCalled();
  });

  it("returns 200 and emails the ementa when the payload is valid", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: true });
    sendEmentaEmailMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(sendEmentaEmailMock).toHaveBeenCalledWith({ name: "Ana", email: "ana@example.com" });
  });

  it("returns 502 when the ementa email fails to send, even if the admissions notification succeeds", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: true });
    sendEmentaEmailMock.mockResolvedValue({ ok: false, reason: "domain not verified" });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(502);
  });

  it("still returns 200 when only the admissions notification fails", async () => {
    sendLeadNotificationMock.mockResolvedValue({ ok: false, reason: "domain not verified" });
    sendEmentaEmailMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
