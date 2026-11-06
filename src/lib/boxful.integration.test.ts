import { execFileSync } from "node:child_process";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { updateOrderStatusForAdmin } from "./admin-orders";
import { db } from "./db";
import { boxfulConfig } from "./boxful/config";
import { boxfulAccessToken } from "./boxful/client";
import { unseal } from "./boxful/crypto";
import { boxfulParcels } from "./boxful/provider";
import { ensureBoxfulShipment, reconcileBoxfulShipment } from "./boxful/shipments";
import { checkBoxfulBalance, flushShippingAlerts } from "./boxful/alerts";
import { quoteCartShipping, readCartShippingQuote } from "./shipping-checkout";
import { createGuestCheckoutFromCart } from "./orders";
import { processPaymentWebhookEvent } from "./payment-events";
import { POST as webhook } from "@/app/api/webhooks/boxful/route";
import type { CartSummary } from "./cart";

const f = vi.hoisted(() => {
  const schema = `e2e_boxful_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused"); url.searchParams.set("schema", schema);
  return { schema, url: url.toString(), cart: vi.fn(), clear: vi.fn(), payment: vi.fn(), mail: vi.fn(), confirmation: vi.fn() };
});
vi.mock("./db", async () => { const { PrismaClient } = await import("@prisma/client"); return { db: new PrismaClient({ datasources: { db: { url: f.url } } }) }; });
vi.mock("./cart", () => ({ getCart: f.cart, clearCart: f.clear }));
vi.mock("./payments", () => ({ getPaymentProvider: () => ({ id: "mock", createPayment: f.payment }) }));
vi.mock("./email", () => ({ getEmailProvider: () => ({ sendEmail: f.mail }), getTransactionalEmailFrom: () => "qa@example.com" }));
vi.mock("./email/transactional", () => ({ sendOrderConfirmationEmail: f.confirmation }));

const destination = { addressLine1: "Calle 5", department: "San Miguel", city: "San Miguel Centro", landmark: "Parque", latitude: 13.48, longitude: -88.18, cityId: "city-test" };
const remote = { id: "shipment-test", shipmentNumber: "BF123", trackingUrl: "https://devtracking.goboxful.com/?shipment=BF123", labelUrl: "https://boxful.sfo3.digitaloceanspaces.com/label.pdf", status: "1" };
let cart: CartSummary;
let calls: { path: string; body: Record<string, unknown> | undefined }[];
let shippingPrice: number;
let createStatus: number;
let found: boolean;
let remoteStatus: string;
let telegramOk: boolean;
let scope: string;
function pair() { return { accessToken: "private-access", refreshToken: "private-refresh", accessTokenExpiresAt: Date.now() / 1000 + 900, refreshTokenExpiresAt: Date.now() / 1000 + 2592000 }; }
function form() { const form = new FormData(); for (const [k, v] of Object.entries({ ...destination, shippingCityId: destination.cityId, customerName: "Shipping QA", customerEmail: "qa@example.com", customerPhone: "77777777", fulfillmentMethod: "NATIONAL_SHIPPING", paymentMethod: "online_card" })) form.set(k, String(v)); return form; }
async function createOrder() {
  const quote = await quoteCartShipping(cart.lines, destination); expect(quote?.rates).toHaveLength(1);
  const data = form(); data.set("shippingOption", JSON.stringify(["boxful", "courier-test", "next-day"])); data.set("shippingQuoteToken", quote!.quoteToken);
  const result = await createGuestCheckoutFromCart(data, undefined, crypto.randomUUID());
  expect(result.status).toBe("created");
  return db.order.findFirstOrThrow({ where: { customerEmail: "qa@example.com" }, orderBy: { createdAt: "desc" }, include: { shipment: true, payment: true } });
}
async function markPaid(order: Awaited<ReturnType<typeof createOrder>>) { await db.payment.update({ where: { orderId: order.id }, data: { status: "PAID" } }); await db.order.update({ where: { id: order.id }, data: { status: "PAID_PENDING_SHIPMENT" } }); }

describe.skipIf(!process.env.DATABASE_URL)("Boxful HTTP + PostgreSQL flow", () => {
  beforeAll(async () => {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: f.url, DIRECT_DATABASE_URL: f.url }, stdio: "pipe" });
    const category = await db.productCategory.create({ data: { name: "Boxful QA", slug: "boxful-qa" } });
    const location = await db.inventoryLocation.create({ data: { code: "MAIN", name: "QA" } });
    const product = await db.product.create({ data: { name: "QA", sku: "BF-QA", slug: "bf-qa", brand: "QA", categoryId: category.id, priceCents: 2000, weightGrams: 4536, lengthMm: 200, widthMm: 100, heightMm: 80, inventoryStocks: { create: { locationId: location.id, quantityOnHand: 1000, status: "IN_STOCK" } } } });
    cart = { hasBlockingIssues: false, itemCount: 2, subtotalCents: 4000, lines: [{ product, quantity: 2, lineTotalCents: 4000, availableQuantity: 1000 }] } as unknown as CartSummary;
  }, 30000);
  beforeEach(async () => {
    for (const [k, v] of Object.entries({ SHIPPING_PROVIDER: "boxful", BOXFUL_API_BASE_URL: "https://devapi.goboxful.com", BOXFUL_EMAIL: "account@example.com", BOXFUL_PASSWORD: "private-password", BOXFUL_CLIENT_ID: "client-test", BOXFUL_PICKUP_ADDRESS_ID: "pickup-test", BOXFUL_WEIGHT_UNIT: "lb", BOXFUL_DIMENSION_UNIT: "omit", BOXFUL_TOKEN_ENCRYPTION_KEY: "test-only-encryption-key-at-least-32-characters", BOXFUL_ORDER_REFERENCE_CONFIRMED: "true", BOXFUL_WEBHOOK_SECRET: "test-only-webhook-secret-at-least-32-characters", OPS_ALERT_EMAIL: "ops@example.com", TELEGRAM_BOT_TOKEN: "123:private-telegram", TELEGRAM_CHAT_ID: "12345", NEXT_PUBLIC_SITE_URL: "https://qa.example.com" })) vi.stubEnv(k, v);
    scope = boxfulConfig().scope;
    await db.boxfulLocation.upsert({ where: { accountScope_department_municipality_cityId: { accountScope: scope, department: destination.department, municipality: destination.city, cityId: destination.cityId } }, create: { accountScope: scope, department: destination.department, municipality: destination.city, district: "San Miguel", stateId: "state-test", cityId: destination.cityId }, update: {} });
    calls = []; shippingPrice = 4; createStatus = 201; found = false; remoteStatus = "1"; telegramOk = true;
    f.cart.mockResolvedValue(cart); f.mail.mockResolvedValue({ provider: "mock", status: "SENT" }); f.mail.mockClear();
    f.payment.mockImplementation(async ({ orderNumber }) => ({ provider: "mock", externalPaymentId: `mock-${orderNumber}`, externalReference: orderNumber, checkoutUrl: `https://qa.example.com/pay/${orderNumber}`, status: "PENDING", rawStatus: "PENDING", rawPayload: {} }));
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path, body });
      if (path.startsWith("/auth/")) return Response.json(pair());
      if (path === "/courier/available") return Response.json([{ id: "courier-test", name: "Courier QA", price: shippingPrice, deliveryType: "next-day" }]);
      if (path === "/shipment") return Response.json({ shipmentData: remote }, { status: createStatus });
      if (path.startsWith("/shipment/")) return found ? Response.json({ shipment: { ...remote, status: remoteStatus } }) : Response.json({}, { status: 404 });
      if (path.endsWith("/sendMessage")) return Response.json({ ok: telegramOk });
      throw new Error("Unexpected test HTTP path");
    }));
  });
  afterAll(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${f.schema}" CASCADE`); } finally { await db.$disconnect(); } });

  it("serializes concurrent login and refresh, persists encrypted pairs and scopes them by account", async () => {
    await db.boxfulSession.deleteMany();
    await Promise.all([boxfulAccessToken(), boxfulAccessToken(), boxfulAccessToken()]);
    expect(calls.filter((c) => c.path === "/auth/v2/client")).toHaveLength(1);
    const row = await db.boxfulSession.findUniqueOrThrow({ where: { id: scope } });
    expect(row.encryptedTokens).not.toContain("private-");
    const saved = unseal(row.encryptedTokens!, "BOXFUL_TOKEN_ENCRYPTION_KEY", `boxful:${scope}`) as ReturnType<typeof pair>;
    saved.accessTokenExpiresAt = Date.now() / 1000 - 1;
    const { seal } = await import("./boxful/crypto");
    await db.boxfulSession.update({ where: { id: scope }, data: { encryptedTokens: seal(saved, "BOXFUL_TOKEN_ENCRYPTION_KEY", `boxful:${scope}`) } });
    await Promise.all([boxfulAccessToken(), boxfulAccessToken()]);
    expect(calls.filter((c) => c.path === "/auth/v2/refresh")).toHaveLength(1);
    expect(calls.find((c) => c.path === "/auth/v2/refresh")?.body).toEqual({ refreshToken: "private-refresh" });
  });
  it("converts grams to pounds, omits dimensions as requested, and supports explicit unit conversion", () => {
    const request = { destination, packages: [{ sku: "QA", quantity: 2, priceCents: 2000, weightGrams: 453.59237, lengthMm: 254, widthMm: 127, heightMm: 50.8 }], totalWeightGrams: 907.18474 };
    expect(boxfulParcels(request)).toEqual(Array(2).fill({ content: "QA", weight: 1, price: 20 }));
    vi.stubEnv("BOXFUL_DIMENSION_UNIT", "in"); expect(boxfulParcels(request)[0]).toMatchObject({ length: 10, width: 5, height: 2 });
  });
  it("protects quotes against tampering, expiry, address/cart changes; pays the displayed price without re-quoting", async () => {
    const quote = await quoteCartShipping(cart.lines, destination); expect(quote).not.toBeNull();
    expect(await readCartShippingQuote(cart.lines, destination, quote!.quoteToken + "bad")).toBeNull();
    expect(await readCartShippingQuote(cart.lines, { ...destination, latitude: 13.5 }, quote!.quoteToken)).toBeNull();
    expect(await readCartShippingQuote([{ ...cart.lines[0], quantity: 3 }], destination, quote!.quoteToken)).toBeNull();
    const data = form(); data.set("shippingQuoteToken", quote!.quoteToken); data.set("shippingOption", JSON.stringify(["boxful", "courier-test", "next-day"]));
    const before = calls.filter((c) => c.path === "/courier/available").length;
    shippingPrice = 9;
    const key = crypto.randomUUID(); const result = await createGuestCheckoutFromCart(data, undefined, key);
    expect(result.status).toBe("created"); expect(calls.filter((c) => c.path === "/courier/available")).toHaveLength(before);
    const order = await db.order.findUniqueOrThrow({ where: { idempotencyKey: key } }); expect(order.totalCents).toBe(4400);
    expect(f.payment).toHaveBeenLastCalledWith(expect.objectContaining({ amountCents: 4400 }));
    const refreshed = await quoteCartShipping(cart.lines, destination);
    data.set("shippingQuoteToken", refreshed!.quoteToken);
    expect(await createGuestCheckoutFromCart(data, undefined, key)).toMatchObject({ status: "created", orderNumber: order.orderNumber });
    expect(await db.order.count({ where: { idempotencyKey: key } })).toBe(1);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).totalCents).toBe(4400);
    const now = Date.now(); const spy = vi.spyOn(Date, "now").mockReturnValue(now + 300001);
    expect(await readCartShippingQuote(cart.lines, destination, quote!.quoteToken)).toBeNull(); spy.mockRestore();
  });
  it("creates a single waybill after PAID, reserves no double stock, debits estimated balance once", async () => {
    const order = await createOrder();
    await ensureBoxfulShipment(order.orderNumber); expect(calls.filter((c) => c.path === "/shipment")).toHaveLength(0);
    const result = await processPaymentWebhookEvent({ provider: "mock", isValid: true, externalEventId: crypto.randomUUID(), externalPaymentId: order.payment!.externalPaymentId!, externalReference: order.orderNumber, eventType: "payment.paid", amountCents: order.totalCents, status: "PAID", rawPayload: {} });
    expect(result.status).toBe("processed");
    await Promise.all([ensureBoxfulShipment(order.orderNumber), ensureBoxfulShipment(order.orderNumber)]);
    expect(calls.filter((c) => c.path === "/shipment")).toHaveLength(1);
    expect(calls.find((c) => c.path === "/shipment")?.body).toMatchObject({ orderNumber: order.orderNumber, cod: false, courierId: "courier-test", customerState: "state-test", customerCity: "city-test", parcels: expect.any(Array) });
    expect(await db.shipment.findUnique({ where: { orderId: order.id } })).toMatchObject({ creationState: "CREATED", externalId: remote.id, shipmentNumber: "BF123" });
    expect(await db.boxfulBalanceEntry.findUnique({ where: { id: `shipment:${order.shipment!.id}` } })).toMatchObject({ amountCents: -400 });
    // Reuse the fixed remote ID in subsequent independent test fixtures.
    await db.shipment.update({ where: { orderId: order.id }, data: { externalId: null } });
  });
  it("keeps failed paid orders pending, alerts both channels independently and never blindly repeats an ambiguous create", async () => {
    const order = await createOrder(); await markPaid(order); createStatus = 500; telegramOk = false;
    await ensureBoxfulShipment(order.orderNumber);
    expect(await db.order.findUnique({ where: { id: order.id } })).toMatchObject({ status: "PAID_PENDING_SHIPMENT" });
    expect(await db.payment.findUnique({ where: { orderId: order.id } })).toMatchObject({ status: "PAID" });
    expect(await db.shipment.findUnique({ where: { orderId: order.id } })).toMatchObject({ creationState: "UNKNOWN" });
    await expect(db.$transaction((tx) => updateOrderStatusForAdmin(tx, { orderNumber: order.orderNumber, status: "CANCELLED" }))).rejects.toThrow("invalid_transition");
    expect(f.mail).toHaveBeenCalledTimes(1);
    const message = f.mail.mock.calls[0][0]; expect(message.text).not.toMatch(/qa@example|77777777|Calle 5|private-/);
    expect(message.text).toContain(order.orderNumber);
    await ensureBoxfulShipment(order.orderNumber); expect(calls.filter((c) => c.path === "/shipment")).toHaveLength(1);
    telegramOk = true; await flushShippingAlerts(); expect(f.mail).toHaveBeenCalledTimes(1);
    const alert = await db.shippingAlert.findUniqueOrThrow({ where: { id: `shipment:${order.shipment!.id}` } }); expect(alert.emailSentAt).not.toBeNull(); expect(alert.telegramSentAt).not.toBeNull();
    found = true; await ensureBoxfulShipment(order.orderNumber);
    expect((await db.shipment.findUniqueOrThrow({ where: { orderId: order.id } })).creationState).toBe("CREATED");
    expect(calls.filter((c) => c.path === "/shipment")).toHaveLength(1);
    await db.shipment.update({ where: { orderId: order.id }, data: { externalId: null } });
  });
  it("authenticates webhook before IO, confirms current API state, deduplicates and preserves payments on courier cancellation", async () => {
    const order = await createOrder(); await markPaid(order); await ensureBoxfulShipment(order.orderNumber); found = true;
    const before = calls.length;
    for (let i = 0; i < 30; i++) expect((await webhook(new Request("https://qa.test/api/webhooks/boxful", { method: "POST", body: "{}" }))).status).toBe(401);
    expect(calls).toHaveLength(before);
    remoteStatus = "3";
    const req = () => new Request("https://qa.test/api/webhooks/boxful", { method: "POST", headers: { accessToken: process.env.BOXFUL_WEBHOOK_SECRET! }, body: JSON.stringify({ shipmentId: remote.id, status: "4" }) });
    expect((await webhook(req())).status).toBe(200);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("SHIPPED");
    expect(await reconcileBoxfulShipment(remote.id)).toBe("duplicate");
    remoteStatus = "5"; await reconcileBoxfulShipment(remote.id);
    expect((await db.payment.findUniqueOrThrow({ where: { orderId: order.id } })).status).toBe("PAID");
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("SHIPPED");
    remoteStatus = "4"; await reconcileBoxfulShipment(remote.id);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("DELIVERED");
    expect(await db.shipmentEvent.count({ where: { shipmentId: order.shipment!.id } })).toBe(3);
    await db.shipment.update({ where: { orderId: order.id }, data: { externalId: null } });
  });
  it("retries a documented rejection after correction and checks for an existing waybill first", async () => {
    const order = await createOrder(); await markPaid(order); createStatus = 400;
    await ensureBoxfulShipment(order.orderNumber);
    expect((await db.shipment.findUniqueOrThrow({ where: { orderId: order.id } })).creationState).toBe("FAILED");
    createStatus = 201;
    await ensureBoxfulShipment(order.orderNumber);
    const paths = calls.map((c) => c.path);
    const creates = paths.reduce<number[]>((indices, path, i) => path === "/shipment" ? [...indices, i] : indices, []);
    expect(creates).toHaveLength(2);
    expect(paths.slice(creates[0] + 1, creates[1])).toContain(`/shipment/${order.orderNumber}`);
    expect((await db.shipment.findUniqueOrThrow({ where: { orderId: order.id } })).creationState).toBe("CREATED");
    await db.shipment.update({ where: { orderId: order.id }, data: { externalId: null } });
  });
  it("sends the first failure urgently and coalesces subsequent orders into one summary without duplicate channels", async () => {
    await db.shippingAlert.deleteMany();
    const start = Math.floor(Date.now() / 60000) * 60000 + 1000;
    const now = vi.spyOn(Date, "now").mockReturnValue(start);
    try {
      const groupKey = `${scope}:${Math.floor(start / 60000)}`;
      const insert = (id: string) => db.shippingAlert.create({ data: { id, accountScope: scope, orderNumber: `CAP-QA-${id}`, code: "SHIPPING_RATE_UNAVAILABLE", groupKey, amountCents: 400 } });
      await insert("first"); await flushShippingAlerts(); expect(f.mail).toHaveBeenCalledTimes(1);
      await insert("second"); await insert("third"); await flushShippingAlerts(); expect(f.mail).toHaveBeenCalledTimes(1);
      now.mockReturnValue(start + 60000);
      await Promise.all([flushShippingAlerts(), flushShippingAlerts()]);
      expect(f.mail).toHaveBeenCalledTimes(2);
      expect(f.mail.mock.calls[1][0].text).toContain("CAP-QA-second"); expect(f.mail.mock.calls[1][0].text).toContain("CAP-QA-third"); expect(f.mail.mock.calls[1][0].text).not.toContain("CAP-QA-first");
      await flushShippingAlerts(); expect(f.mail).toHaveBeenCalledTimes(2);
      expect(await db.shippingAlert.count({ where: { emailSentAt: { not: null }, telegramSentAt: { not: null } } })).toBe(3);
    } finally { now.mockRestore(); }
  });
  it("gates production endpoints, unknown mappings/units/reference contract and deduplicates low balance alerts", async () => {
    vi.stubEnv("BOXFUL_API_BASE_URL", "https://api.goboxful.com"); expect(() => boxfulConfig()).toThrow();
    vi.stubEnv("BOXFUL_API_BASE_URL", "https://attacker.example.com"); expect(() => boxfulConfig()).toThrow();
    vi.stubEnv("BOXFUL_API_BASE_URL", "https://devapi.goboxful.com");
    expect((await quoteCartShipping(cart.lines, { ...destination, cityId: "wrong-city" }))?.rates).toEqual([]);
    vi.stubEnv("BOXFUL_ORDER_REFERENCE_CONFIRMED", ""); expect((await quoteCartShipping(cart.lines, destination))?.rates).toEqual([]);
    vi.stubEnv("BOXFUL_LOW_BALANCE_ALERT_CENTS", "10000"); await checkBoxfulBalance(); await checkBoxfulBalance();
    expect(await db.shippingAlert.count({ where: { code: "BOXFUL_LOW_BALANCE" } })).toBe(1);
  });
});
