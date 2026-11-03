import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const eqChain = { eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock };
const serviceClientMock = {
  from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(eqChain) }),
};

vi.mock("./supabase/service-client", () => ({
  getSupabaseServiceClient: () => serviceClientMock,
}));

describe("lookupAssociado", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("returns false for a null/blank cnpj without querying Supabase", async () => {
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado(null)).toBe(false);
    expect(await lookupAssociado("")).toBe(false);
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("returns true when an active associado row matches the normalized cnpj", async () => {
    maybeSingleMock.mockResolvedValue({ data: { ativo: true }, error: null });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("11.222.333/0001-81")).toBe(true);
  });

  it("returns false when no row matches", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("00000000000000")).toBe(false);
  });

  it("returns false (never throws) on a Supabase error", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "network error" } });
    const { lookupAssociado } = await import("./associados");
    expect(await lookupAssociado("11222333000181")).toBe(false);
  });
});
