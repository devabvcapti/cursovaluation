import { describe, it, expect } from "vitest";
import { validateCheckout } from "./validate-checkout";

const VALID = {
  nome: "Ana",
  email: "ana@example.com",
  cpf: "11144477735",
  telefone: "11991480203",
};

describe("validateCheckout", () => {
  it("accepts a fully valid payload with no cnpj/cupom", () => {
    expect(validateCheckout(VALID)).toEqual({ valid: true });
  });
  it("accepts a valid payload with cnpj and cupom present", () => {
    expect(validateCheckout({ ...VALID, cnpj: "11222333000181", cupom: "BLACKFRIDAY10" })).toEqual({
      valid: true,
    });
  });
  it("flags missing required fields", () => {
    const result = validateCheckout({ nome: "", email: "", cpf: "", telefone: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.nome).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.cpf).toBeDefined();
      expect(result.errors.telefone).toBeDefined();
    }
  });
  it("flags an invalid email format", () => {
    const result = validateCheckout({ ...VALID, email: "not-an-email" });
    expect(result.valid).toBe(false);
  });
  it("flags a CPF that fails the checksum", () => {
    const result = validateCheckout({ ...VALID, cpf: "12345678900" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.cpf).toBeDefined();
  });
  it("flags a telefone with too few digits", () => {
    const result = validateCheckout({ ...VALID, telefone: "123" });
    expect(result.valid).toBe(false);
  });
});
