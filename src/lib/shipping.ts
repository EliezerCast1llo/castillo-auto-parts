import "server-only";
import { boxfulShippingProvider } from "./boxful/provider";
import type { BoxfulSnapshot } from "./boxful/provider";
import { isIsolatedE2EEnvironment } from "./production-environment";
import type { PackageMeasurements } from "./package-measurements";
import { isNationalAddress, isNationalCoordinate } from "@/data/el-salvador";
import { OperationalError } from "./operational-error";
import { logWarn } from "./logger";
export { shippingRateKey } from "./shipping-rate-key";

export type ShippingDestination = {
  addressLine1: string; addressLine2?: string; department: string; city: string;
  landmark: string; latitude: number; longitude: number;
  stateId?: string; cityId?: string;
};
export type ShippingPackage = PackageMeasurements & { quantity: number; sku: string; priceCents?: number };
export type ShippingRequest = { destination: ShippingDestination; packages: ShippingPackage[]; totalWeightGrams: number };
export type ShippingRate = {
  boxfulSnapshot?: BoxfulSnapshot;
  provider: string; courierId: string; courierName: string; priceCents: number;
  serviceType: "same-day" | "next-day"; estimatedDeliveryAt?: string;
};
export interface ShippingRateProvider { getRates(request: ShippingRequest): Promise<ShippingRate[]> }

export function buildShippingPackages(lines: { product: { [K in keyof PackageMeasurements]?: number | null } & { sku: string }; quantity: number }[]) {
  const packages: ShippingPackage[] = [];
  for (const { product, quantity } of lines) {
    const { weightGrams, lengthMm, widthMm, heightMm } = product;
    if (![weightGrams, lengthMm, widthMm, heightMm, quantity].every((n) => Number.isSafeInteger(n) && n! > 0)) return null;
    packages.push({ sku: product.sku, quantity, weightGrams: weightGrams!, lengthMm: lengthMm!, widthMm: widthMm!, heightMm: heightMm! });
  }
  const totalWeightGrams = packages.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
  if (!packages.length || !Number.isSafeInteger(totalWeightGrams)) return null;
  return { packages, totalWeightGrams };
}

export const unavailableShippingProvider: ShippingRateProvider = { async getRates() { return []; } };
export const fakeShippingProvider: ShippingRateProvider = {
  async getRates({ destination }) {
    if (!isNationalAddress(destination.department, destination.city) || !isNationalCoordinate(destination.latitude, destination.longitude)) return [];
    return [
      { provider: "fake", courierId: "test-express", courierName: "Paquetería de prueba Express", priceCents: 500, serviceType: "same-day" },
      { provider: "fake", courierId: "test-standard", courierName: "Paquetería de prueba Estándar", priceCents: 350, serviceType: "next-day" },
    ];
  },
};

export function getShippingProvider(env = process.env): ShippingRateProvider {
  if (env.SHIPPING_PROVIDER === "boxful") return boxfulShippingProvider;
  if (env.SHIPPING_PROVIDER !== "fake") return unavailableShippingProvider;
  return ["development", "test"].includes(env.NODE_ENV ?? "") || isIsolatedE2EEnvironment(env)
    ? fakeShippingProvider : unavailableShippingProvider;
}

export async function getShippingRates(request: ShippingRequest, provider = getShippingProvider()) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const rates = await Promise.race([
      provider.getRates(request),
      new Promise<ShippingRate[]>((_, reject) => { timeout = setTimeout(() => reject(new OperationalError("SHIPPING_RATE_UNAVAILABLE", "Shipping rates timed out.")), provider === boxfulShippingProvider ? 20000 : 5000); }),
    ]);
    return rates.filter((rate) => rate.provider && rate.courierId && rate.courierName &&
      Number.isSafeInteger(rate.priceCents) && rate.priceCents > 0 &&
      ["same-day", "next-day"].includes(rate.serviceType) &&
      (!rate.estimatedDeliveryAt || Number.isFinite(Date.parse(rate.estimatedDeliveryAt))));
  } catch {
    await logWarn({ context: "shipping_rates", outcome: "failed" }, new OperationalError("SHIPPING_RATE_UNAVAILABLE", "Shipping rates unavailable."));
    return [];
  } finally { if (timeout) clearTimeout(timeout); }
}

export function chargedShippingCents(quotedCents: number, subtotalCents: number, promo: { enabled: boolean; minimumSubtotalCents: number }) {
  return promo.enabled && subtotalCents >= promo.minimumSubtotalCents ? 0 : quotedCents;
}

export function publicShippingRate(rate: ShippingRate & { chargedCents: number }) {
  return { provider: rate.provider, courierId: rate.courierId, courierName: rate.courierName, priceCents: rate.priceCents, chargedCents: rate.chargedCents, serviceType: rate.serviceType, estimatedDeliveryAt: rate.estimatedDeliveryAt };
}
