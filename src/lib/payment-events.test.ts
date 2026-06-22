import { randomUUID } from "node:crypto";
import { InventoryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";
import { processPaymentWebhookEvent } from "./payment-events";
import { cancelPaymentProcessingOrder } from "./payment-reservations";
import type { PaymentWebhookEvent } from "./payments";

const testRunId = randomUUID().slice(0, 8);
const testPrefix = `PAY-${testRunId}`;
const testSlugPrefix = `pay-${testRunId}`;
let sequence = 0;

describe.skipIf(!process.env.DATABASE_URL)("payment event processing", () => {
  afterEach(cleanupTestData);
  afterAll(async () => {
    await cleanupTestData();
    await db.$disconnect();
  });

  it("fulfills a paid order exactly once and confirms reserved stock", async () => {
    const fixture = await createPaymentFixture();
    const event = buildEvent(fixture);

    const firstResult = await processPaymentWebhookEvent(event, {
      expectedProduction: false,
    });
    const secondResult = await processPaymentWebhookEvent(event, {
      expectedProduction: false,
    });
    const [order, stock, eventCount] = await Promise.all([
      db.order.findUniqueOrThrow({
        include: { payment: true },
        where: { orderNumber: fixture.orderNumber },
      }),
      db.inventoryStock.findUniqueOrThrow({
        where: { id: fixture.stockId },
      }),
      db.paymentEvent.count({ where: { paymentId: fixture.paymentId } }),
    ]);

    expect(firstResult).toEqual({ status: "processed" });
    expect(secondResult).toEqual({ status: "duplicate" });
    expect(order.status).toBe(OrderStatus.PAID_PENDING_SHIPMENT);
    expect(order.payment?.status).toBe(PaymentStatus.PAID);
    expect(order.emailAccessTokenHash).toBeTruthy();
    expect(stock.quantityOnHand).toBe(0);
    expect(stock.quantityReserved).toBe(0);
    expect(eventCount).toBe(1);
  });

  it("rejects a mismatched amount without fulfilling or releasing stock", async () => {
    const fixture = await createPaymentFixture();
    const event = buildEvent(fixture, { amountCents: fixture.amountCents - 1 });

    const result = await processPaymentWebhookEvent(event, {
      expectedProduction: false,
    });
    const [order, stock, paymentEvent] = await Promise.all([
      db.order.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } }),
      db.inventoryStock.findUniqueOrThrow({ where: { id: fixture.stockId } }),
      db.paymentEvent.findFirstOrThrow({ where: { paymentId: fixture.paymentId } }),
    ]);

    expect(result).toEqual({ reason: "amount_mismatch", status: "rejected" });
    expect(order.status).toBe(OrderStatus.PAYMENT_PROCESSING);
    expect(stock.quantityOnHand).toBe(1);
    expect(stock.quantityReserved).toBe(1);
    expect(paymentEvent.isValid).toBe(false);
  });

  it("rejects a sandbox event when production is expected", async () => {
    const fixture = await createPaymentFixture();

    const result = await processPaymentWebhookEvent(buildEvent(fixture), {
      expectedProduction: true,
    });

    expect(result).toEqual({ reason: "environment_mismatch", status: "rejected" });
    await expect(
      db.order.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } }),
    ).resolves.toMatchObject({ status: OrderStatus.PAYMENT_PROCESSING });
  });

  it("handles a webhook that arrives before the payment link response is persisted", async () => {
    const fixture = await createPaymentFixture({ persistExternalPaymentId: false });

    const result = await processPaymentWebhookEvent(buildEvent(fixture), {
      expectedProduction: false,
    });
    const payment = await db.payment.findUniqueOrThrow({
      where: { id: fixture.paymentId },
    });

    expect(result).toEqual({ status: "processed" });
    expect(payment.externalPaymentId).toBe(fixture.externalPaymentId);
    expect(payment.status).toBe(PaymentStatus.PAID);
  });

  it("marks a payment received after reservation expiry for manual review", async () => {
    const fixture = await createPaymentFixture();
    const now = new Date();
    await db.order.update({
      data: { reservationExpiresAt: new Date(now.getTime() - 1_000) },
      where: { orderNumber: fixture.orderNumber },
    });
    await cancelPaymentProcessingOrder({
      expiresBefore: now,
      orderNumber: fixture.orderNumber,
      paymentStatus: PaymentStatus.CANCELLED,
      rawStatus: "RESERVATION_EXPIRED",
    });

    const result = await processPaymentWebhookEvent(buildEvent(fixture), {
      expectedProduction: false,
    });
    const [order, payment, stock] = await Promise.all([
      db.order.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } }),
      db.payment.findUniqueOrThrow({ where: { id: fixture.paymentId } }),
      db.inventoryStock.findUniqueOrThrow({ where: { id: fixture.stockId } }),
    ]);

    expect(result).toEqual({ status: "manual_review" });
    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.rawStatus).toBe("PAID_AFTER_RESERVATION_RELEASED");
    expect(stock.quantityOnHand).toBe(1);
    expect(stock.quantityReserved).toBe(0);
  });
});

async function createPaymentFixture({
  persistExternalPaymentId = true,
}: { persistExternalPaymentId?: boolean } = {}) {
  sequence += 1;
  const suffix = `${sequence}-${randomUUID().slice(0, 8)}`;
  const orderNumber = `${testPrefix}-ORDER-${suffix}`;
  const amountCents = 1299;
  const category = await db.productCategory.create({
    data: {
      name: `Payment Category ${suffix}`,
      slug: `${testSlugPrefix}-${suffix}`,
    },
  });
  const location = await db.inventoryLocation.upsert({
    create: {
      code: DEFAULT_LOCATION_CODE,
      isDefault: true,
      name: "Bodega principal",
    },
    update: {},
    where: { code: DEFAULT_LOCATION_CODE },
  });
  const product = await db.product.create({
    data: {
      brand: "Test Brand",
      categoryId: category.id,
      currency: "USD",
      isActive: true,
      name: `Payment Product ${suffix}`,
      priceCents: amountCents,
      sku: `${testPrefix}-${suffix}`,
      slug: `${testSlugPrefix}-product-${suffix}`,
    },
  });
  const stock = await db.inventoryStock.create({
    data: {
      locationId: location.id,
      productId: product.id,
      quantityOnHand: 1,
      quantityReserved: 1,
      reorderPoint: 0,
      status: InventoryStatus.OUT_OF_STOCK,
    },
  });
  const order = await db.order.create({
    data: {
      currency: "USD",
      customerEmail: `${testPrefix.toLowerCase()}-${suffix}@example.com`,
      customerName: "Payment QA",
      customerPhone: "7000-0000",
      items: {
        create: {
          brandSnapshot: product.brand,
          lineTotalCents: amountCents,
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: 1,
          skuSnapshot: product.sku,
          taxCents: 149,
          unitPriceCents: amountCents,
        },
      },
      orderNumber,
      payment: {
        create: {
          amountCents,
          externalPaymentId: persistExternalPaymentId ? `${sequence}` : undefined,
          externalReference: orderNumber,
          provider: "wompi",
          status: PaymentStatus.PENDING,
        },
      },
      reservationExpiresAt: new Date(Date.now() + 20 * 60_000),
      shipment: {
        create: { deliveryZone: "Bodega principal", method: "PICKUP" },
      },
      shippingCents: 0,
      status: OrderStatus.PAYMENT_PROCESSING,
      subtotalCents: amountCents,
      taxCents: 149,
      totalCents: amountCents,
    },
    include: { payment: true },
  });

  return {
    amountCents,
    externalPaymentId: `${sequence}`,
    orderNumber,
    paymentId: order.payment!.id,
    stockId: stock.id,
  };
}

function buildEvent(
  fixture: Awaited<ReturnType<typeof createPaymentFixture>>,
  overrides: Partial<PaymentWebhookEvent> = {},
): PaymentWebhookEvent {
  return {
    amountCents: fixture.amountCents,
    eventType: "wompi.payment.received",
    externalEventId: `${testPrefix}-EVENT-${sequence}`,
    externalPaymentId: fixture.externalPaymentId,
    externalReference: fixture.orderNumber,
    isProduction: false,
    isValid: true,
    occurredAt: new Date(),
    provider: "wompi",
    rawPayload: { source: "test" },
    status: "PAID",
    ...overrides,
  };
}

async function cleanupTestData() {
  const emailPrefix = `${testPrefix.toLowerCase()}-`;
  const orderFilter = { order: { orderNumber: { startsWith: testPrefix } } };
  await db.emailLog.deleteMany({ where: { recipient: { startsWith: emailPrefix } } });
  await db.paymentEvent.deleteMany({ where: { payment: orderFilter } });
  await db.payment.deleteMany({ where: orderFilter });
  await db.shipment.deleteMany({ where: orderFilter });
  await db.orderItem.deleteMany({ where: orderFilter });
  await db.order.deleteMany({ where: { orderNumber: { startsWith: testPrefix } } });
  await db.inventoryStock.deleteMany({
    where: { product: { sku: { startsWith: testPrefix } } },
  });
  await db.product.deleteMany({ where: { sku: { startsWith: testPrefix } } });
  await db.productCategory.deleteMany({
    where: { slug: { startsWith: testSlugPrefix } },
  });
}
