import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe("sendEmentaEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
  });

  it("fails without throwing when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendEmentaEmail } = await import("./send-ementa-email");
    const result = await sendEmentaEmail({ name: "Ana", email: "ana@example.com" });
    expect(result.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("emails the lead directly with the ementa PDF attached", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendEmentaEmail } = await import("./send-ementa-email");
    const result = await sendEmentaEmail({ name: "Ana", email: "ana@example.com" });
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["ana@example.com"],
        attachments: [
          expect.objectContaining({
            filename: expect.stringContaining("Ementa"),
            content: expect.any(Buffer),
          }),
        ],
      }),
    );
  });

  it("returns ok:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const { sendEmentaEmail } = await import("./send-ementa-email");
    const result = await sendEmentaEmail({ name: "Ana", email: "ana@example.com" });
    expect(result).toEqual({ ok: false, reason: "domain not verified" });
  });

  it("builds the checkout link as an absolute URL", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendEmentaEmail } = await import("./send-ementa-email");
    await sendEmentaEmail({ name: "Ana", email: "ana@example.com" });
    const call = sendMock.mock.calls[0][0];
    expect(call.text).toMatch(/https?:\/\/.*\/inscricao/);
  });
});
