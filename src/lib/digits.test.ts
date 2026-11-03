import { describe, it, expect } from "vitest";
import { onlyDigits } from "./digits";

describe("onlyDigits", () => {
  it("strips everything but digits", () => {
    expect(onlyDigits("111.444.777-35")).toBe("11144477735");
    expect(onlyDigits("(11) 99148-0203")).toBe("11991480203");
  });
});
