import "server-only";
import { db } from "./db";
import { buildShippingPackages, chargedShippingCents, getShippingRates, type ShippingDestination } from "./shipping";

export async function quoteCartShipping(lines: { product: { sku: string }; quantity: number }[], destination: ShippingDestination) {
  try {
    const [products, promotion] = await Promise.all([
      db.product.findMany({ where: { sku: { in: lines.map(({ product }) => product.sku) }, isActive: true } }),
      db.shippingPromotion.findUnique({ where: { id: "national" } }),
    ]);
    const bySku = new Map(products.map((product) => [product.sku, product]));
    const currentLines = lines.map((line) => ({ product: bySku.get(line.product.sku), quantity: line.quantity }));
    if (currentLines.some((line) => !line.product)) return null;
    const packages = buildShippingPackages(currentLines.map(({ product, quantity }) => ({ product: product!, quantity })));
    if (!packages) return null;
    const subtotalCents = currentLines.reduce((sum, line) => sum + line.product!.priceCents * line.quantity, 0);
    const rates = await getShippingRates({ ...packages, destination });
    return {
      ...packages,
      products,
      subtotalCents,
      rates: rates.map((rate) => ({ ...rate, chargedCents: chargedShippingCents(rate.priceCents, subtotalCents, promotion ?? { enabled: false, minimumSubtotalCents: 0 }) })),
    };
  } catch { return null; }
}
