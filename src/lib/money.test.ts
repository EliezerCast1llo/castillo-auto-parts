import { describe, expect, it } from "vitest";
import { formatCurrency, getIncludedTax, getSubtotalBeforeIncludedTax } from "./money";

describe("money helpers", () => {
  it("formats cents as USD for El Salvador", () => {
    expect(formatCurrency(2599)).toBe("$25.99");
  });

  it("extracts included IVA from a tax-included total", () => {
    expect(getIncludedTax(11300)).toBe(1300);
    expect(getSubtotalBeforeIncludedTax(11300)).toBe(10000);
  });
});

