import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn() });
const serviceClientMock = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock }),
    update: updateMock,
  }),
};

vi.mock("./supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

const NOW = new Date("2026-11-03T12:00:00Z");

describe("resolveCupom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    maybeSingleMock.mockReset();
  });

  it("returns applied:false for a null/blank code without querying Supabase", async () => {
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom(null)).toEqual({ applied: false });
    expect(await resolveCupom("")).toEqual({ applied: false });
  });

  it("applies an active, in-window, under-limit coupon", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        codigo: "BLACKFRIDAY10",
        percentual_desconto: 10,
        ativo: true,
        valido_de: "2026-10-01T00:00:00Z",
        valido_ate: "2026-12-01T00:00:00Z",
        limite_uso: 100,
        usos_atuais: 5,
      },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("blackfriday10")).toEqual({
      applied: true,
      codigo: "BLACKFRIDAY10",
      percentualDesconto: 10,
    });
  });

  it("rejects an inactive coupon", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: false, valido_de: null, valido_ate: null, limite_uso: null, usos_atuais: 0 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("rejects a coupon past its valido_ate", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: true, valido_de: null, valido_ate: "2026-01-01T00:00:00Z", limite_uso: null, usos_atuais: 0 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("rejects a coupon that reached its limite_uso", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { codigo: "X", percentual_desconto: 10, ativo: true, valido_de: null, valido_ate: null, limite_uso: 5, usos_atuais: 5 },
      error: null,
    });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("X")).toEqual({ applied: false });
  });

  it("returns applied:false when no coupon matches the code", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { resolveCupom } = await import("./cupons");
    expect(await resolveCupom("DOES-NOT-EXIST")).toEqual({ applied: false });
  });
});
