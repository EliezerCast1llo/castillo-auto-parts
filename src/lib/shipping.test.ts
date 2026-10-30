import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd } from "./structured-data";
import { departments, municipalitiesByDepartment, isNationalAddress, isNationalCoordinate } from "@/data/el-salvador";
import { buildShippingPackages, chargedShippingCents, getShippingProvider, getShippingRates, fakeShippingProvider, shippingRateKey } from "./shipping";

const destination = { addressLine1: "Calle principal 5", city: "San Miguel Centro", department: "San Miguel", landmark: "Frente al parque", latitude: 13.48, longitude: -88.18 };
const product = { sku: "A", weightGrams: 1250, lengthMm: 200, widthMm: 100, heightMm: 80 };
const request = { destination, ...buildShippingPackages([{ product, quantity: 3 }])! };

describe("national shipping boundary", () => {
  it("publishes national coverage in structured data", () => { expect(buildOrganizationJsonLd().areaServed).toBe("El Salvador"); });
  it("accepts all 14 departments and their 44 municipalities independently of zones", () => {
    expect(departments).toHaveLength(14);
    expect(Object.values(municipalitiesByDepartment).flat()).toHaveLength(44);
    for (const [department, cities] of Object.entries(municipalitiesByDepartment)) for (const city of cities) expect(isNationalAddress(department, city)).toBe(true);
    expect(isNationalAddress("San Miguel", "Santa Ana Centro")).toBe(false);
    for (const [lat, lng] of [[13.84, -89.85], [14.36, -89.17], [13.34, -87.84], [13.18, -87.7]]) expect(isNationalCoordinate(lat, lng)).toBe(true);
    expect(isNationalCoordinate(0, 0)).toBe(false);
    expect(isNationalCoordinate(NaN, -89)).toBe(false);
  });
  it("sums weight by quantity and preserves individual package dimensions", () => {
    const result = buildShippingPackages([{ product, quantity: 3 }, { product: { ...product, sku: "B", weightGrams: 500 }, quantity: 2 }]);
    expect(result?.totalWeightGrams).toBe(4750);
    expect(result?.packages).toEqual([{ ...product, quantity: 3 }, { ...product, sku: "B", weightGrams: 500, quantity: 2 }]);
    expect(buildShippingPackages([{ product: { ...product, heightMm: null }, quantity: 1 }])).toBeNull();
    expect(buildShippingPackages([{ product, quantity: -1 }])).toBeNull();
  });
  it("fails closed without configuration, on errors, and on invalid provider prices", async () => {
    expect(await getShippingRates(request, getShippingProvider({ NODE_ENV: "test" }))).toEqual([]);
    expect(await getShippingRates(request, { async getRates() { throw new Error("provider down"); } })).toEqual([]);
    expect(await getShippingRates(request, { async getRates() { return [{ ...(await fakeShippingProvider.getRates(request))[0], priceCents: -1 }]; } })).toEqual([]);
  });
  it("offers deterministic same-day test rates only in allowed environments", async () => {
    expect(await getShippingRates(request, getShippingProvider({ NODE_ENV: "development", SHIPPING_PROVIDER: "fake" }))).toEqual(expect.arrayContaining([expect.objectContaining({ serviceType: "same-day", priceCents: 500 })]));
    expect(await getShippingRates(request, getShippingProvider({ NODE_ENV: "production", SHIPPING_PROVIDER: "fake" }))).toEqual([]);
    expect(await getShippingRates(request, getShippingProvider({ NODE_ENV: "production", SHIPPING_PROVIDER: "fake", E2E_ISOLATED_DATABASE: "true", ALLOW_MOCK_PAYMENT_IN_E2E: "true", DATABASE_URL: "not-a-url", DIRECT_DATABASE_URL: "not-a-url" }))).toEqual([]);
    expect(shippingRateKey({ provider: "fake", courierId: "express", serviceType: "same-day" })).not.toBe(shippingRateKey({ provider: "fake", courierId: "express", serviceType: "next-day" }));
  });
  it("keeps shipping paid unless the owner explicitly activates an eligible promotion", () => {
    expect(chargedShippingCents(500, 2000, { enabled: false, minimumSubtotalCents: 1000 })).toBe(500);
    expect(chargedShippingCents(500, 999, { enabled: true, minimumSubtotalCents: 1000 })).toBe(500);
    expect(chargedShippingCents(500, 1000, { enabled: true, minimumSubtotalCents: 1000 })).toBe(0);
  });
});
