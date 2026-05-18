import { describe, expect, it } from "vitest";
import { getProductBySlug, getRelatedProducts, mockProducts } from "./mock-products";

describe("mock product helpers", () => {
  it("finds products by slug", () => {
    expect(getProductBySlug("filtro-aceite-toyota-18l")?.sku).toBe("MOCK-FIL-TOY-18");
  });

  it("does not include the current product in related products", () => {
    const product = mockProducts[0];
    expect(getRelatedProducts(product).every((item) => item.slug !== product.slug)).toBe(true);
  });
});
