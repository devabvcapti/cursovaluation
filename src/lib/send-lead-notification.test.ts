import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe("sendLeadNotification", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalRecipient = process.env.LEAD_NOTIFICATION_EMAIL;

  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.LEAD_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
    process.env.LEAD_NOTIFICATION_EMAIL = originalRecipient;
  });

  it("fails without throwing when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendLeadNotification } = await import("./send-lead-notification");
    const result = await sendLeadNotification({ name: "Ana", email: "ana@example.com" });
    expect(result.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends to the default recipient when LEAD_NOTIFICATION_EMAIL is unset", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendLeadNotification } = await import("./send-lead-notification");
    const result = await sendLeadNotification({ name: "Ana", email: "ana@example.com" });
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["ti@abvcap.com.br"] }),
    );
  });

  it("returns ok:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const { sendLeadNotification } = await import("./send-lead-notification");
    const result = await sendLeadNotification({ name: "Ana", email: "ana@example.com" });
    expect(result).toEqual({ ok: false, reason: "domain not verified" });
  });

  it("tags the subject [LEAD] by default (no origem, or origem: \"ementa\")", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendLeadNotification } = await import("./send-lead-notification");
    await sendLeadNotification({ name: "Ana", email: "ana@example.com" });
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringMatching(/^\[LEAD\]/) }));
  });

  it("tags the subject [COMPRAS] and notes the origem in the body for origem: \"checkout\"", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendLeadNotification } = await import("./send-lead-notification");
    await sendLeadNotification({ name: "Ana", email: "ana@example.com", origem: "checkout" });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/^\[COMPRAS\]/),
        text: expect.stringContaining("Origem: Checkout"),
      }),
    );
  });
});
