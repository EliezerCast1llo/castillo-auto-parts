import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/data/mock-products";
import { getCart } from "./cart";
import * as shipping from "./shipping";

const mocks = vi.hoisted(() => ({ get: vi.fn(), catalog: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock("@/data/products", () => ({ getLiveCatalogProducts: mocks.catalog }));
// Sin dueño el carrito sale de la cookie, que es lo que este archivo mide: el
// armado de renglones, precios y paquetes. Dónde se guardan es otro test.
vi.mock("./cart-owner", () => ({ resolveCartOwner: async () => null }));
const product = { ...mockProducts[0], stockStatus: "IN_STOCK", stockQuantity: 10,
  weightGrams: 1250, lengthMm: 200, widthMm: 100, heightMm: 80 };
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  mocks.get.mockReturnValue({ value: JSON.stringify([{ sku: product.sku, quantity: 3 }]) });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("getCart shipping calculation", () => {
  it("preserves lines, prices, packages and total weight with a single package calculation", async () => {
    mocks.catalog.mockResolvedValue([product]);
    const build = vi.spyOn(shipping, "buildShippingPackages");
    const cart = await getCart();
    expect(build).toHaveBeenCalledTimes(1);
    expect(cart).toEqual({
      totalWeightGrams: 3750,
      shippingPackages: [{ sku: product.sku, quantity: 3, weightGrams: 1250, lengthMm: 200, widthMm: 100, heightMm: 80 }],
      hasBlockingIssues: false, itemCount: 3, subtotalCents: product.priceCents * 3,
      lines: [{ availableQuantity: 10, issue: undefined, lineTotalCents: product.priceCents * 3, product, quantity: 3 }],
    });
  });
  it.each([{ products: [] }, { products: [{ ...product, weightGrams: null }] }])("preserves missing-measurement/empty-cart fallbacks (%j)", async ({ products }) => {
    mocks.catalog.mockResolvedValue(products);
    const build = vi.spyOn(shipping, "buildShippingPackages");
    expect(await getCart()).toMatchObject({ totalWeightGrams: null, shippingPackages: [] });
    expect(build).toHaveBeenCalledTimes(1);
  });
});
