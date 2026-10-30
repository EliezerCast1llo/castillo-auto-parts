import { execFileSync } from "node:child_process";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { createGuestCheckoutFromCart } from "./orders";
import { shippingRateKey } from "./shipping";
import type { GuestCart } from "./cart";

const fixtures = vi.hoisted(() => {
  const schema = `e2e_shipping_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused");
  url.searchParams.set("schema", schema);
  return { schema, url: url.toString(), cart: vi.fn(), clear: vi.fn(), createPayment: vi.fn() };
});
vi.mock("./db", async () => { const { PrismaClient } = await import("@prisma/client"); return { db: new PrismaClient({ datasources: { db: { url: fixtures.url } } }) }; });
vi.mock("./cart", () => ({ getGuestCart: fixtures.cart, clearGuestCart: fixtures.clear }));
vi.mock("./payments", () => ({ getPaymentProvider: () => ({ id: "mock", createPayment: fixtures.createPayment }) }));
vi.mock("./email/templates", () => ({ buildAbsoluteAppUrl: () => "http://localhost/order" }));

const shippingOption = shippingRateKey({ provider: "fake", courierId: "test-express", serviceType: "same-day" });
function checkout(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ customerName: "Shipping QA", customerEmail: "shipping@example.com", customerPhone: "77777777", fulfillmentMethod: "NATIONAL_SHIPPING", paymentMethod: "online_card", addressLine1: "Calle 5", department: "San Miguel", city: "San Miguel Centro", landmark: "Parque", latitude: "13.48", longitude: "-88.18", shippingOption, shippingCents: "1", ...overrides })) form.set(key, value);
  return form;
}

describe.skipIf(!process.env.DATABASE_URL)("shipping checkout with isolated PostgreSQL", () => {
  let cart: GuestCart;
  beforeAll(async () => {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: fixtures.url, DIRECT_DATABASE_URL: fixtures.url }, stdio: "pipe" });
    const category = await db.productCategory.create({ data: { name: "Shipping QA", slug: "shipping-qa" } });
    const location = await db.inventoryLocation.create({ data: { code: "MAIN", name: "QA" } });
    const products = await Promise.all([1250, 500].map((weightGrams, i) => db.product.create({ data: { name: `QA ${i}`, sku: `SHIP-${i}`, slug: `ship-${i}`, brand: "QA", categoryId: category.id, priceCents: 1000, weightGrams, lengthMm: 200, widthMm: 100, heightMm: 80, inventoryStocks: { create: { locationId: location.id, quantityOnHand: 100, status: "IN_STOCK" } } } })));
    cart = { hasBlockingIssues: false, itemCount: 5, subtotalCents: 5000, lines: products.map((product, i) => ({ product, quantity: i === 0 ? 3 : 2, lineTotalCents: 1000 * (i === 0 ? 3 : 2), availableQuantity: 100 })) } as unknown as GuestCart;
    fixtures.createPayment.mockImplementation(async ({ orderNumber, amountCents }) => ({ provider: "mock", externalPaymentId: `mock-${orderNumber}`, externalReference: orderNumber, checkoutUrl: `http://localhost/pay/${orderNumber}`, status: "PENDING", rawStatus: "PENDING", rawPayload: { amountCents } }));
  }, 30000);
  beforeEach(async () => { vi.stubEnv("SHIPPING_PROVIDER", "fake"); fixtures.cart.mockResolvedValue(cart); await db.shippingPromotion.upsert({ where: { id: "national" }, create: { id: "national" }, update: { enabled: false } }); });
  afterAll(async () => { vi.unstubAllEnvs(); try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${fixtures.schema}" CASCADE`); } finally { await db.$disconnect(); } });

  it("re-quotes tampered amounts, persists weights and destination snapshot, and replays without duplicate stock", async () => {
    const key = "a".repeat(64);
    const result = await createGuestCheckoutFromCart(checkout(), undefined, key);
    expect(result.status).toBe("created");
    const order = await db.order.findUniqueOrThrow({ where: { idempotencyKey: key }, include: { shipment: true, address: true, payment: true } });
    expect(order).toMatchObject({ shippingCents: 500, subtotalCents: 5000, totalCents: 5500 });
    expect(order.shipment).toMatchObject({ method: "NATIONAL_SHIPPING", quotedCents: 500, chargedCents: 500, totalWeightGrams: 4750, serviceType: "same-day" });
    expect(order.address?.landmark).toBe("Parque");
    expect(order.payment?.amountCents).toBe(5500);
    const stockBefore = await db.inventoryStock.findMany({ orderBy: { id: "asc" } });
    expect(await createGuestCheckoutFromCart(checkout({ shippingCents: "0" }), undefined, key)).toMatchObject({ status: "created", orderNumber: order.orderNumber });
    expect(await db.order.count({ where: { idempotencyKey: key } })).toBe(1);
    expect(await db.inventoryStock.findMany({ orderBy: { id: "asc" } })).toEqual(stockBefore);
  });
  it("preserves real courier cost while charging zero under an eligible owner promotion", async () => {
    await db.shippingPromotion.update({ where: { id: "national" }, data: { enabled: true, minimumSubtotalCents: 5000 } });
    const result = await createGuestCheckoutFromCart(checkout(), undefined, "b".repeat(64));
    expect(result.status).toBe("created");
    const order = await db.order.findUniqueOrThrow({ where: { idempotencyKey: "b".repeat(64) }, include: { shipment: true } });
    expect(order).toMatchObject({ totalCents: 5000, shippingCents: 0 });
    expect(order.shipment).toMatchObject({ quotedCents: 500, chargedCents: 0 });
  });
  it("blocks missing/unknown quotes without reserving stock; pickup works when unconfigured", async () => {
    const count = await db.order.count();
    expect(await createGuestCheckoutFromCart(checkout({ shippingOption: "tampered" }))).toEqual({ status: "coverage_unavailable" });
    vi.stubEnv("SHIPPING_PROVIDER", "");
    expect(await createGuestCheckoutFromCart(checkout())).toEqual({ status: "coverage_unavailable" });
    expect(await db.order.count()).toBe(count);
    const result = await createGuestCheckoutFromCart(checkout({ fulfillmentMethod: "PICKUP" }), undefined, "c".repeat(64));
    expect(result.status).toBe("created");
    expect((await db.order.findUniqueOrThrow({ where: { idempotencyKey: "c".repeat(64) } })).shippingCents).toBe(0);
  });
});
