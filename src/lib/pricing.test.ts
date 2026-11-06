import { describe, it, expect, vi, beforeEach } from "vitest";

const lookupAssociadoMock = vi.fn();
const resolveCupomMock = vi.fn();

vi.mock("./associados", () => ({ lookupAssociado: lookupAssociadoMock }));
vi.mock("./cupons", () => ({ resolveCupom: resolveCupomMock }));

describe("resolvePrice", () => {
  beforeEach(() => {
    lookupAssociadoMock.mockReset();
    resolveCupomMock.mockReset();
    resolveCupomMock.mockResolvedValue({ applied: false });
    vi.useFakeTimers();
  });

  it("charges the early-bird price before the deadline for a non-associado, no coupon", async () => {
    vi.setSystemTime(new Date("2026-12-03T23:59:59Z"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result).toEqual({ isAssociado: false, cupomAplicado: null, valorBase: 7650, valorCobrado: 7650 });
  });

  it("still charges the early-bird price on the evening of the advertised last day (Dec 4, 21:00 BRT = UTC midnight)", async () => {
    vi.setSystemTime(new Date("2026-12-04T21:00:00-03:00"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result.valorBase).toBe(7650);
  });

  it("still charges the early-bird price at the last millisecond of Dec 4 in BRT", async () => {
    vi.setSystemTime(new Date("2026-12-04T23:59:59.999-03:00"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result.valorBase).toBe(7650);
  });

  it("charges the non-early-bird full price exactly at the deadline instant (start of Dec 5 BRT) and after", async () => {
    vi.setSystemTime(new Date("2026-12-05T00:00:00-03:00"));
    lookupAssociadoMock.mockResolvedValue(false);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: null });
    expect(result.valorBase).toBe(8500);
  });

  it("charges the associado early-bird price for an associado before the deadline", async () => {
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
    lookupAssociadoMock.mockResolvedValue(true);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: "11222333000181", cupom: null });
    expect(result.isAssociado).toBe(true);
    expect(result.valorBase).toBe(6120);
  });

  it("charges the associado full price for an associado after the early-bird deadline", async () => {
    vi.setSystemTime(new Date("2026-12-05T00:00:00-03:00"));
    lookupAssociadoMock.mockResolvedValue(true);
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: "11222333000181", cupom: null });
    expect(result.isAssociado).toBe(true);
    expect(result.valorBase).toBe(6800);
  });

  it("applies a resolved coupon's percentage on top of the base price", async () => {
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
    lookupAssociadoMock.mockResolvedValue(false);
    resolveCupomMock.mockResolvedValue({ applied: true, codigo: "PROMO10", percentualDesconto: 10 });
    const { resolvePrice } = await import("./pricing");
    const result = await resolvePrice({ cnpj: null, cupom: "promo10" });
    expect(result).toEqual({
      isAssociado: false,
      cupomAplicado: "PROMO10",
      valorBase: 7650,
      valorCobrado: 6885,
    });
  });
});
