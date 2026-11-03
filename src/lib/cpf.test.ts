import { describe, it, expect } from "vitest";
import { isValidCpf } from "./cpf";

describe("isValidCpf", () => {
  it("accepts a CPF with valid check digits, with or without punctuation", () => {
    expect(isValidCpf("11144477735")).toBe(true);
    expect(isValidCpf("111.444.777-35")).toBe(true);
  });
  it("rejects a CPF with wrong check digits", () => {
    expect(isValidCpf("12345678900")).toBe(false);
  });
  it("rejects all-repeated-digit sequences", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });
  it("rejects anything that isn't 11 digits", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});
