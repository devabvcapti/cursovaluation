import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyMpWebhookSignature } from "./verify-mp-webhook-signature";

function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

describe("verifyMpWebhookSignature", () => {
  it("accepts a correctly computed signature", () => {
    const ts = "1700000000";
    const v1 = sign("whsec", "123", "req-1", ts);
    expect(
      verifyMpWebhookSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(
      verifyMpWebhookSignature({ xSignature: "ts=1700000000,v1=deadbeef", xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(false);
  });

  it("rejects a malformed x-signature header", () => {
    expect(
      verifyMpWebhookSignature({ xSignature: "garbage", xRequestId: "req-1", dataId: "123", secret: "whsec" }),
    ).toBe(false);
  });
});
