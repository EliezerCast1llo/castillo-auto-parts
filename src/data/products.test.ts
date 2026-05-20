import { describe, expect, it } from "vitest";
import { shouldUseMockCatalogFallback } from "./catalog-source";

describe("catalog product data source", () => {
  it("allows mock catalog fallback outside production only", () => {
    expect(shouldUseMockCatalogFallback("development")).toBe(true);
    expect(shouldUseMockCatalogFallback("test")).toBe(true);
    expect(shouldUseMockCatalogFallback("production")).toBe(false);
  });
});
