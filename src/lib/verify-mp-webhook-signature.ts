import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyMpWebhookSignatureParams {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secret: string;
}

/**
 * Verifies Mercado Pago's webhook HMAC-SHA256 signature.
 *
 * `x-signature` arrives as `ts=<unix>,v1=<hex>`. We rebuild the manifest
 * string Mercado Pago signed (`id:<dataId>;request-id:<xRequestId>;ts:<ts>;`),
 * HMAC it with the webhook secret, and compare the result to the `v1` value
 * using a timing-safe comparison. Any malformed input (missing parts, a hex
 * digest of the wrong length, etc.) returns `false` rather than throwing —
 * the caller is expected to treat `false` as "reject with 401".
 */
export function verifyMpWebhookSignature(params: VerifyMpWebhookSignatureParams): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;

  const parts = xSignature.split(",");
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.split("=");
    const key = rawKey?.trim();
    const value = rawValueParts.join("=").trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }

  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(v1, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
