import { describe, it, expect } from "vitest";
import { isValidCpf, formatCpf } from "./cpf";

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

describe("formatCpf", () => {
  it("adds dots and a dash progressively as digits are typed", () => {
    expect(formatCpf("1")).toBe("1");
    expect(formatCpf("111")).toBe("111");
    expect(formatCpf("1114")).toBe("111.4");
    expect(formatCpf("111444777")).toBe("111.444.777");
    expect(formatCpf("11144477735")).toBe("111.444.777-35");
  });
  it("strips non-digits before formatting, so re-formatting an already-masked value never doubles up punctuation", () => {
    expect(formatCpf("111.444.777-35")).toBe("111.444.777-35");
    expect(formatCpf("111.444.777-3")).toBe("111.444.777-3");
  });
  it("ignores anything past the 11th digit", () => {
    expect(formatCpf("111444777355555")).toBe("111.444.777-35");
  });
});
