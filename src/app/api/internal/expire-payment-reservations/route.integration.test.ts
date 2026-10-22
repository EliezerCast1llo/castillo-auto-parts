import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";
import { DEFAULT_LOCATION_CODE } from "@/lib/fulfillment";

// The endpoint scans all expired orders. A separate schema prevents it from
// cancelling fixtures belonging to other concurrently running integration tests.
const isolation = vi.hoisted(() => {
  const schema = `e2e_cron_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused");
  url.searchParams.set("schema", schema);
  return { schema, url: url.toString() };
});
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient({ datasources: { db: { url: isolation.url } } }) };
});

describe.skipIf(!process.env.DATABASE_URL)("reservation cron endpoint with PostgreSQL", () => {
  beforeAll(() => {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: isolation.url, DIRECT_DATABASE_URL: isolation.url },
      stdio: "pipe",
    });
    vi.stubEnv("RESERVATION_CRON_SECRET", "fixture-cron-not-a-real-secret");
  }, 30_000);

  afterAll(async () => {
    try {
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${isolation.schema}" CASCADE`);
    } finally {
      await db.$disconnect();
      vi.unstubAllEnvs();
    }
  });

  it("releases expired stock exactly once, preserving live and paid orders", async () => {
    const category = await db.productCategory.create({ data: { name: "Cron fixture", slug: "cron-fixture" } });
    const location = await db.inventoryLocation.create({ data: { code: DEFAULT_LOCATION_CODE, name: "Cron warehouse", isDefault: true } });
    const product = await db.product.create({ data: { sku: "CRON-FIXTURE", slug: "cron-fixture", name: "Cron product", brand: "Fixture", priceCents: 1000, categoryId: category.id } });
    const stock = await db.inventoryStock.create({ data: { productId: product.id, locationId: location.id, quantityOnHand: 5, quantityReserved: 2, status: "IN_STOCK" } });
    for (const kind of ["expired", "live", "paid"] as const) {
      await db.order.create({ data: {
        orderNumber: `CRON-${kind}`, customerName: "Fixture", customerEmail: "fixture@example.com", customerPhone: "7000-0000",
        currency: "USD", subtotalCents: 1000, taxCents: 115, shippingCents: 0, totalCents: 1000,
        status: kind === "paid" ? "PAID_PENDING_SHIPMENT" : "PAYMENT_PROCESSING",
        reservationExpiresAt: new Date(Date.now() + (kind === "live" ? 600_000 : -60_000)),
        payment: { create: { provider: "mock", amountCents: 1000, status: kind === "paid" ? "PAID" : "PENDING" } },
        shipment: { create: { method: "PICKUP", deliveryZone: "Warehouse" } },
        items: { create: { productId: product.id, skuSnapshot: product.sku, productNameSnapshot: product.name, brandSnapshot: product.brand, quantity: 1, unitPriceCents: 1000, lineTotalCents: 1000, taxCents: 115 } },
      } });
    }
    const request = (secret: string) => new Request("https://shop.test/api/internal/expire-payment-reservations", { method: "POST", headers: { authorization: `Bearer ${secret}` } });
    expect((await POST(request("invalid"))).status).toBe(401);
    expect((await db.inventoryStock.findUniqueOrThrow({ where: { id: stock.id } })).quantityReserved).toBe(2);

    const responses = await Promise.all([POST(request("fixture-cron-not-a-real-secret")), POST(request("fixture-cron-not-a-real-secret"))]);
    const payloads = await Promise.all(responses.map((response) => response.json()));
    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(payloads.reduce((sum, payload) => sum + payload.released, 0)).toBe(1);
    const expired = await db.order.findUniqueOrThrow({ where: { orderNumber: "CRON-expired" }, include: { payment: true, shipment: true } });
    expect(expired.status).toBe("CANCELLED");
    expect(expired.payment?.status).toBe("CANCELLED");
    expect(expired.payment?.rawStatus).toBe("RESERVATION_EXPIRED");
    expect(expired.shipment?.status).toBe("CANCELLED");
    expect(await db.paymentEvent.count()).toBe(1);
    expect(await db.inventoryStock.findUniqueOrThrow({ where: { id: stock.id } })).toMatchObject({ quantityOnHand: 5, quantityReserved: 1 });
    for (const [kind, status] of [["live", "PAYMENT_PROCESSING"], ["paid", "PAID_PENDING_SHIPMENT"]]) {
      expect((await db.order.findUniqueOrThrow({ where: { orderNumber: `CRON-${kind}` } })).status).toBe(status);
    }
    await expect((await POST(request("fixture-cron-not-a-real-secret"))).json()).resolves.toEqual({ ok: true, released: 0 });
  });
});
