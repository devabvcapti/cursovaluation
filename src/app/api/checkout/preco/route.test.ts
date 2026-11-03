import { describe, it, expect, vi, beforeEach } from "vitest";

const resolvePriceMock = vi.fn();

vi.mock("@/lib/pricing", () => ({
  resolvePrice: resolvePriceMock,
}));

describe("POST /api/checkout/preco", () => {
  beforeEach(() => {
    resolvePriceMock.mockReset();
  });

  it("calls resolvePrice with the parsed body and returns its result as JSON", async () => {
    const result = {
      isAssociado: true,
      cupomAplicado: "PROMO10",
      valorBase: 1000,
      valorCobrado: 900,
    };
    resolvePriceMock.mockResolvedValue(result);
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/preco", {
      method: "POST",
      body: JSON.stringify({ cnpj: "11.222.333/0001-81", cupom: "PROMO10" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(resolvePriceMock).toHaveBeenCalledWith({
      cnpj: "11.222.333/0001-81",
      cupom: "PROMO10",
    });
    const body = await response.json();
    expect(body).toEqual(result);
  });

  it("treats missing fields as null/undefined and still returns 200 on a malformed/empty body", async () => {
    const result = {
      isAssociado: false,
      cupomAplicado: null,
      valorBase: 1000,
      valorCobrado: 1000,
    };
    resolvePriceMock.mockResolvedValue(result);
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/checkout/preco", {
      method: "POST",
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(resolvePriceMock).toHaveBeenCalledWith({
      cnpj: undefined,
      cupom: undefined,
    });
    const body = await response.json();
    expect(body).toEqual(result);
  });
});
