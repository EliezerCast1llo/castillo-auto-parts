import { randomUUID } from "node:crypto";
import { InventoryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";
import {
  InventoryReservationError,
  confirmInventoryReservation,
  releaseInventoryReservation,
  reserveInventory,
} from "./inventory-reservations";
import { expirePaymentReservations } from "./payment-reservations";

const testRunId = randomUUID().slice(0, 8);
const testPrefix = `RSV-${testRunId}`;
const testSlugPrefix = `rsv-${testRunId}`;
let sequence = 0;

describe.skipIf(!process.env.DATABASE_URL)("inventory reservations", () => {
  afterEach(cleanupTestData);
  afterAll(async () => {
    await cleanupTestData();
    await db.$disconnect();
  });

  it("allows only one concurrent reservation for the final unit", async () => {
    const fixture = await createStockFixture({ quantityOnHand: 1, quantityReserved: 0 });
    const request = {
      currentQuantityOnHand: 1,
      currentQuantityReserved: 0,
      quantity: 1,
      reorderPoint: 0,
      stockId: fixture.stockId,
    };

    const attempts = await Promise.allSettled([
      db.$transaction((tx) => reserveInventory(tx, [request])),
      db.$transaction((tx) => reserveInventory(tx, [request])),
    ]);
    const stock = await db.inventoryStock.findUniqueOrThrow({
      select: { quantityOnHand: true, quantityReserved: true },
      where: { id: fixture.stockId },
    });

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(
      attempts.find((attempt) => attempt.status === "rejected"),
    ).toMatchObject({
      reason: expect.objectContaining({
        code: "insufficient_stock",
      } satisfies Partial<InventoryReservationError>),
    });
    expect(stock).toEqual({ quantityOnHand: 1, quantityReserved: 1 });
  });

  it("confirms a reservation by decrementing on-hand and reserved together", async () => {
    const fixture = await createStockFixture({
      quantityOnHand: 3,
      quantityReserved: 2,
      reorderPoint: 1,
    });

    await db.$transaction((tx) =>
      confirmInventoryReservation(tx, [{ productId: fixture.productId, quantity: 2 }]),
    );

    const stock = await db.inventoryStock.findUniqueOrThrow({
      select: { quantityOnHand: true, quantityReserved: true, status: true },
      where: { id: fixture.stockId },
    });
    expect(stock).toEqual({
      quantityOnHand: 1,
      quantityReserved: 0,
      status: InventoryStatus.LOW_STOCK,
    });
  });

  it("releases a reservation without decrementing on-hand stock", async () => {
    const fixture = await createStockFixture({
      quantityOnHand: 3,
      quantityReserved: 2,
      reorderPoint: 1,
    });

    await db.$transaction((tx) =>
      releaseInventoryReservation(tx, [{ productId: fixture.productId, quantity: 2 }]),
    );

    const stock = await db.inventoryStock.findUniqueOrThrow({
      select: { quantityOnHand: true, quantityReserved: true, status: true },
      where: { id: fixture.stockId },
    });
    expect(stock).toEqual({
      quantityOnHand: 3,
      quantityReserved: 0,
      status: InventoryStatus.IN_STOCK,
    });
  });

  it("expires and releases a pending reservation only once", async () => {
    const fixture = await createStockFixture({ quantityOnHand: 2, quantityReserved: 1 });
    const orderNumber = await createPendingOrderFixture(fixture.productId);
    const now = new Date();

    const firstRun = await expirePaymentReservations({ now, orderNumber });
    const secondRun = await expirePaymentReservations({ now, orderNumber });
    const [order, stock] = await Promise.all([
      db.order.findUniqueOrThrow({
        include: { payment: true, shipment: true },
        where: { orderNumber },
      }),
      db.inventoryStock.findUniqueOrThrow({
        select: { quantityOnHand: true, quantityReserved: true },
        where: { id: fixture.stockId },
      }),
    ]);

    expect(firstRun).toBe(1);
    expect(secondRun).toBe(0);
    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.payment?.status).toBe(PaymentStatus.CANCELLED);
    expect(order.shipment?.status).toBe("CANCELLED");
    expect(stock).toEqual({ quantityOnHand: 2, quantityReserved: 0 });
  });
});

async function createStockFixture({
  quantityOnHand,
  quantityReserved,
  reorderPoint = 0,
}: {
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint?: number;
}) {
  sequence += 1;
  const suffix = `${sequence}-${randomUUID().slice(0, 8)}`;
  const category = await db.productCategory.create({
    data: {
      name: `Reservation Category ${suffix}`,
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
      name: `Reservation Product ${suffix}`,
      priceCents: 1000,
      sku: `${testPrefix}-${suffix}`,
      slug: `${testSlugPrefix}-product-${suffix}`,
    },
  });
  const available = quantityOnHand - quantityReserved;
  const stock = await db.inventoryStock.create({
    data: {
      locationId: location.id,
      productId: product.id,
      quantityOnHand,
      quantityReserved,
      reorderPoint,
      status:
        available <= 0
          ? InventoryStatus.OUT_OF_STOCK
          : available <= reorderPoint
            ? InventoryStatus.LOW_STOCK
            : InventoryStatus.IN_STOCK,
    },
  });

  return { productId: product.id, stockId: stock.id };
}

async function createPendingOrderFixture(productId: string) {
  const suffix = `${sequence}-${randomUUID().slice(0, 8)}`;
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  const orderNumber = `${testPrefix}-ORDER-${suffix}`;

  await db.order.create({
    data: {
      currency: "USD",
      customerEmail: `${suffix}@example.com`,
      customerName: "Reservation QA",
      customerPhone: "7000-0000",
      items: {
        create: {
          brandSnapshot: product.brand,
          lineTotalCents: product.priceCents,
          productId,
          productNameSnapshot: product.name,
          quantity: 1,
          skuSnapshot: product.sku,
          taxCents: 115,
          unitPriceCents: product.priceCents,
        },
      },
      orderNumber,
      payment: {
        create: {
          amountCents: product.priceCents,
          provider: "mock",
          status: PaymentStatus.PENDING,
        },
      },
      reservationExpiresAt: new Date(Date.now() - 60_000),
      shipment: {
        create: {
          deliveryZone: "Bodega principal",
          method: "PICKUP",
        },
      },
      shippingCents: 0,
      status: OrderStatus.PAYMENT_PROCESSING,
      subtotalCents: product.priceCents,
      taxCents: 115,
      totalCents: product.priceCents,
    },
  });

  return orderNumber;
}

async function cleanupTestData() {
  const orderFilter = { order: { orderNumber: { startsWith: testPrefix } } };
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
