import { randomUUID } from "node:crypto";
import { InventoryStatus, OrderStatus } from "@prisma/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  AdminOrderStatusError,
  parseAdminOrderStatus,
  updateOrderStatusForAdmin,
} from "./admin-orders";
import { db } from "./db";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";

const testRunId = randomUUID().slice(0, 8);
const testPrefix = `TST-${testRunId}`;
const testSlugPrefix = `tst-${testRunId}`;
let sequence = 0;

describe("admin order status helpers", () => {
  it("parses only supported order statuses", () => {
    expect(parseAdminOrderStatus("SHIPPED")).toBe(OrderStatus.SHIPPED);
    expect(parseAdminOrderStatus("PENDING_PAYMENT")).toBeUndefined();
  });
});

describe.skipIf(!process.env.DATABASE_URL)("admin order status integration", () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await db.$disconnect();
  });

  it("restores inventory once when a paid pending order is cancelled", async () => {
    const fixture = await createOrderFixture({
      itemQuantity: 2,
      quantityOnHand: 0,
      reorderPoint: 1,
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    const result = await db.$transaction((tx) =>
      updateOrderStatusForAdmin(tx, {
        orderNumber: fixture.orderNumber,
        status: OrderStatus.CANCELLED,
      }),
    );

    const [order, stock, auditLog] = await Promise.all([
      db.order.findUniqueOrThrow({
        where: { orderNumber: fixture.orderNumber },
        select: { shipment: { select: { status: true } }, status: true },
      }),
      db.inventoryStock.findUniqueOrThrow({
        where: { id: fixture.stockId },
        select: { quantityOnHand: true, status: true },
      }),
      db.adminAuditLog.findFirstOrThrow({
        orderBy: { createdAt: "desc" },
        where: {
          action: "order.status_updated",
          entityLabel: fixture.orderNumber,
        },
      }),
    ]);

    expect(result).toMatchObject({
      nextStatus: OrderStatus.CANCELLED,
      previousStatus: OrderStatus.PAID_PENDING_SHIPMENT,
      stockRestored: true,
    });
    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.shipment?.status).toBe("CANCELLED");
    expect(stock.quantityOnHand).toBe(2);
    expect(stock.status).toBe(InventoryStatus.IN_STOCK);
    expect(auditLog.metadata as Record<string, unknown>).toMatchObject({
      nextStatus: OrderStatus.CANCELLED,
      previousStatus: OrderStatus.PAID_PENDING_SHIPMENT,
      stockRestored: true,
    });
  });

  it("does not restore inventory again when moving between terminal statuses", async () => {
    const fixture = await createOrderFixture({
      itemQuantity: 3,
      quantityOnHand: 0,
      reorderPoint: 2,
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    await db.$transaction((tx) =>
      updateOrderStatusForAdmin(tx, {
        orderNumber: fixture.orderNumber,
        status: OrderStatus.CANCELLED,
      }),
    );
    await db.$transaction((tx) =>
      updateOrderStatusForAdmin(tx, {
        orderNumber: fixture.orderNumber,
        status: OrderStatus.REFUNDED,
      }),
    );

    const [order, stock, auditLogs] = await Promise.all([
      db.order.findUniqueOrThrow({
        where: { orderNumber: fixture.orderNumber },
        select: { shipment: { select: { status: true } }, status: true },
      }),
      db.inventoryStock.findUniqueOrThrow({
        where: { id: fixture.stockId },
        select: { quantityOnHand: true, status: true },
      }),
      db.adminAuditLog.findMany({
        orderBy: { createdAt: "asc" },
        where: {
          action: "order.status_updated",
          entityLabel: fixture.orderNumber,
        },
      }),
    ]);

    expect(order.status).toBe(OrderStatus.REFUNDED);
    expect(order.shipment?.status).toBe("CANCELLED");
    expect(stock.quantityOnHand).toBe(3);
    expect(stock.status).toBe(InventoryStatus.IN_STOCK);
    expect(auditLogs.map((log) => (log.metadata as Record<string, unknown>).stockRestored)).toEqual([
      true,
      false,
    ]);
  });

  it("blocks reopening terminal orders without changing stock", async () => {
    const fixture = await createOrderFixture({
      itemQuantity: 1,
      quantityOnHand: 5,
      reorderPoint: 1,
      status: OrderStatus.CANCELLED,
    });

    await expect(
      db.$transaction((tx) =>
        updateOrderStatusForAdmin(tx, {
          orderNumber: fixture.orderNumber,
          status: OrderStatus.SHIPPED,
        }),
      ),
    ).rejects.toMatchObject({
      code: "invalid_transition",
    } satisfies Partial<AdminOrderStatusError>);

    const [order, stock, auditCount] = await Promise.all([
      db.order.findUniqueOrThrow({
        where: { orderNumber: fixture.orderNumber },
        select: { shipment: { select: { status: true } }, status: true },
      }),
      db.inventoryStock.findUniqueOrThrow({
        where: { id: fixture.stockId },
        select: { quantityOnHand: true },
      }),
      db.adminAuditLog.count({
        where: {
          action: "order.status_updated",
          entityLabel: fixture.orderNumber,
        },
      }),
    ]);

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.shipment?.status).toBe("CANCELLED");
    expect(stock.quantityOnHand).toBe(5);
    expect(auditCount).toBe(0);
  });

  it("returns a not_found domain error for missing orders", async () => {
    await expect(
      db.$transaction((tx) =>
        updateOrderStatusForAdmin(tx, {
          orderNumber: `${testPrefix}-MISSING`,
          status: OrderStatus.CANCELLED,
        }),
      ),
    ).rejects.toMatchObject({
      code: "not_found",
    } satisfies Partial<AdminOrderStatusError>);
  });
});

async function createOrderFixture({
  itemQuantity,
  quantityOnHand,
  reorderPoint,
  status,
}: {
  itemQuantity: number;
  quantityOnHand: number;
  reorderPoint: number;
  status: OrderStatus;
}) {
  sequence += 1;
  const suffix = `${sequence}-${randomUUID().slice(0, 8)}`;
  const sku = `${testPrefix}-${suffix}`;
  const orderNumber = `${testPrefix}-ORDER-${suffix}`;
  const category = await db.productCategory.create({
    data: {
      name: `Test Category ${suffix}`,
      slug: `${testSlugPrefix}-${suffix}`,
    },
  });
  const location = await db.inventoryLocation.upsert({
    create: {
      code: DEFAULT_LOCATION_CODE,
      isDefault: true,
      name: "Bodega principal",
    },
    update: {
      isDefault: true,
      name: "Bodega principal",
    },
    where: { code: DEFAULT_LOCATION_CODE },
  });
  const product = await db.product.create({
    data: {
      brand: "Test Brand",
      categoryId: category.id,
      currency: "USD",
      isActive: true,
      name: `Test Product ${suffix}`,
      priceCents: 1000,
      sku,
      slug: `${testSlugPrefix}-product-${suffix}`,
    },
  });
  const stock = await db.inventoryStock.create({
    data: {
      locationId: location.id,
      productId: product.id,
      quantityOnHand,
      quantityReserved: 0,
      reorderPoint,
      status: quantityOnHand > 0 ? InventoryStatus.IN_STOCK : InventoryStatus.OUT_OF_STOCK,
    },
  });

  await db.order.create({
    data: {
      currency: "USD",
      customerEmail: `${suffix}@example.com`,
      customerName: "QA Test Customer",
      customerPhone: "7000-0000",
      items: {
        create: {
          brandSnapshot: product.brand,
          lineTotalCents: product.priceCents * itemQuantity,
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: itemQuantity,
          skuSnapshot: product.sku,
          taxCents: 115,
          unitPriceCents: product.priceCents,
        },
      },
      orderNumber,
      paidAt: new Date(),
      shipment: {
        create: {
          deliveryZone: "Bodega principal",
          method: "PICKUP",
          status: status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED ? "CANCELLED" : "PENDING",
        },
      },
      shippingCents: 0,
      status,
      subtotalCents: product.priceCents * itemQuantity,
      taxCents: 115,
      totalCents: product.priceCents * itemQuantity,
    },
  });

  return {
    orderNumber,
    stockId: stock.id,
  };
}

async function cleanupTestData() {
  await db.paymentEvent.deleteMany({
    where: {
      payment: {
        order: {
          orderNumber: { startsWith: testPrefix },
        },
      },
    },
  });
  await db.payment.deleteMany({
    where: {
      order: {
        orderNumber: { startsWith: testPrefix },
      },
    },
  });
  await db.shipment.deleteMany({
    where: {
      order: {
        orderNumber: { startsWith: testPrefix },
      },
    },
  });
  await db.orderItem.deleteMany({
    where: {
      order: {
        orderNumber: { startsWith: testPrefix },
      },
    },
  });
  await db.order.deleteMany({
    where: {
      orderNumber: { startsWith: testPrefix },
    },
  });
  await db.adminAuditLog.deleteMany({
    where: {
      entityLabel: { startsWith: testPrefix },
    },
  });
  await db.inventoryStock.deleteMany({
    where: {
      product: {
        sku: { startsWith: testPrefix },
      },
    },
  });
  await db.vehicleCompatibility.deleteMany({
    where: {
      product: {
        sku: { startsWith: testPrefix },
      },
    },
  });
  await db.productImage.deleteMany({
    where: {
      product: {
        sku: { startsWith: testPrefix },
      },
    },
  });
  await db.product.deleteMany({
    where: {
      sku: { startsWith: testPrefix },
    },
  });
  await db.productCategory.deleteMany({
    where: {
      slug: { startsWith: testSlugPrefix },
    },
  });
}
