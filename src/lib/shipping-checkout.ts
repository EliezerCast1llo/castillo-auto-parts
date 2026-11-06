import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { seal, unseal } from "./boxful/crypto";
import { snapshotSchema } from "./boxful/provider";
import { boxfulConfig, quoteTtlSeconds } from "./boxful/config";
import { db } from "./db";
import { buildShippingPackages, chargedShippingCents, getShippingProvider, unavailableShippingProvider, publicShippingRate, getShippingRates, type ShippingDestination } from "./shipping";

async function prepareCartShipping(lines: { product: { sku: string }; quantity: number }[]) {
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
    packages.packages = packages.packages.map((p) => ({ ...p, priceCents: bySku.get(p.sku)!.priceCents }));
    return { ...packages, products, subtotalCents, promotion };
  } catch { return null; }
}

type Lines = { product: { sku: string }; quantity: number }[];
const rateSchema = z.object({ provider: z.string(), courierId: z.string(), courierName: z.string(), priceCents: z.number().int().positive(), chargedCents: z.number().int().nonnegative(), serviceType: z.enum(["same-day", "next-day"]), estimatedDeliveryAt: z.string().optional(), boxfulSnapshot: snapshotSchema.optional() });
const quoteSchema = z.object({ expiresAt: z.number(), fingerprint: z.string(), rates: z.array(rateSchema).max(100), boxfulSnapshot: snapshotSchema.optional() });
function fingerprint(prepared: NonNullable<Awaited<ReturnType<typeof prepareCartShipping>>>, destination: ShippingDestination) {
  return createHash("sha256").update(JSON.stringify({ packages: prepared.packages, destination: [destination.addressLine1, destination.addressLine2 || "", destination.department, destination.city, destination.landmark, destination.latitude, destination.longitude, destination.cityId || ""], provider: process.env.SHIPPING_PROVIDER })).digest("hex");
}
export async function quoteCartShipping(lines: Lines, destination: ShippingDestination) {
  try {
    const prepared = await prepareCartShipping(lines);
    if (!prepared) return null;
    const { promotion, ...packages } = prepared;
    const { products, subtotalCents } = prepared;
    const rates = await getShippingRates({ ...packages, destination });
    const quotedRates = rates.map((rate) => ({ ...rate, chargedCents: chargedShippingCents(rate.priceCents, subtotalCents, promotion ?? { enabled: false, minimumSubtotalCents: 0 }) }));
    const expiresAt = Date.now() + quoteTtlSeconds() * 1000;
    const quoteToken = seal({ expiresAt, fingerprint: fingerprint(prepared, destination), rates: quotedRates.map(publicShippingRate), boxfulSnapshot: quotedRates.find((r) => r.provider === "boxful")?.boxfulSnapshot }, "GUEST_CART_SECRET", "shipping-quote-v1");
    return { ...packages, products, subtotalCents, rates: quotedRates, quoteToken, expiresAt };
  } catch { return null; }
}


// Authenticated encrypted snapshot: no quote rows, no second carrier call at pay.
export async function readCartShippingQuote(lines: Lines, destination: ShippingDestination, token?: string) {
  try {
    if (!token || getShippingProvider() === unavailableShippingProvider) return null;
    const saved = quoteSchema.parse(unseal(token, "GUEST_CART_SECRET", "shipping-quote-v1"));
    if (saved.expiresAt <= Date.now() || saved.expiresAt > Date.now() + 900_000) return null;
    const rates = saved.rates.map((r) => ({ ...r, boxfulSnapshot: r.provider === "boxful" ? saved.boxfulSnapshot : undefined }));
    if (rates.some((r) => r.provider === "boxful")) {
      const config = boxfulConfig();
      if (process.env.BOXFUL_ORDER_REFERENCE_CONFIRMED !== "true" || rates.some((r) => r.boxfulSnapshot?.accountScope !== config.scope)) return null;
      const mapping = await db.boxfulLocation.findFirst({ where: { accountScope: config.scope, department: destination.department, municipality: destination.city, cityId: destination.cityId || "" } });
      if (!mapping || rates.some((r) => r.boxfulSnapshot?.stateId !== mapping.stateId)) return null;
    }
    const prepared = await prepareCartShipping(lines);
    if (!prepared || fingerprint(prepared, destination) !== saved.fingerprint) return null;
    return { ...prepared, ...saved, rates };
  } catch { return null; }
}
