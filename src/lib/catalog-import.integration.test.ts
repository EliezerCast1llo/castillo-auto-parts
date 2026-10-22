import { execFileSync } from "node:child_process";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { commitCatalogImport, previewCatalogImport } from "./catalog-import";
import { CSV_COLUMNS, exportCsv } from "./catalog-csv";
import { csvDigest } from "./catalog-import-proof";
import type { AdminSessionUser } from "./admin-user";

const isolation = vi.hoisted(() => {
  const schema = `e2e_csv_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused");
  url.searchParams.set("schema", schema);
  return { schema, url: url.toString() };
});
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient({ datasources: { db: { url: isolation.url } } }) };
});
const actor: AdminSessionUser = { id: "csv-admin-fixture", email: "csv-admin@example.com", name: "CSV fixture", role: "ADMIN" };
const row = (sku: string) => [sku, `Producto ${sku}`, "Proveedor", "PARTE-1", "Categoría CSV", "25.50", "10", "Descripción", "1.250", "20.5", "10", "5", "Toyota|Corolla|2010|2018"];
const csv = (rows: string[][]) => exportCsv([CSV_COLUMNS, ...rows]);
const commit = async (source: string, cleanup = false) => {
  const preview = await previewCatalogImport(source, cleanup, actor);
  expect(preview.errors).toEqual([]);
  return commitCatalogImport(source, cleanup, preview.revision, actor);
};

it.each(["MARKETING", "SUPPORT", "CUSTOMER"] as const)("denies %s before importing", async (role) => {
  const other = { ...actor, role };
  await expect(previewCatalogImport(csv([row("CSV-DENIED")]), false, other)).rejects.toThrow("administrador");
  await expect(commitCatalogImport(csv([row("CSV-DENIED")]), false, "", other)).rejects.toThrow("administrador");
});

describe.skipIf(!process.env.DATABASE_URL)("catalog import with isolated PostgreSQL", () => {
  beforeAll(() => {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: isolation.url, DIRECT_DATABASE_URL: isolation.url }, stdio: "pipe",
    });
  }, 30_000);
  afterAll(async () => {
    try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${isolation.schema}" CASCADE`); }
    finally { await db.$disconnect(); }
  });

  it("previews without writes, upserts by SKU and preserves reserved stock, routes and translations", async () => {
    const source = csv([row("CSV-IDEMPOTENT")]);
    const before = await db.product.count();
    const preview = await previewCatalogImport(source, false, actor);
    expect(preview.items[0].action).toBe("crear");
    expect(await db.product.count()).toBe(before);
    expect(await db.adminAuditLog.count()).toBe(0);
    await commitCatalogImport(source, false, preview.revision, actor);
    const product = await db.product.findUniqueOrThrow({ where: { sku: "CSV-IDEMPOTENT" } });
    expect(product.weightGrams).toBe(1250);
    const main = await db.inventoryLocation.findUniqueOrThrow({ where: { code: "MAIN" } });
    const secondary = await db.inventoryLocation.create({ data: { code: "SECOND", name: "Otra bodega" } });
    await db.inventoryStock.create({ data: { productId: product.id, locationId: secondary.id, quantityOnHand: 30 } });
    await db.inventoryStock.update({ where: { productId_locationId: { productId: product.id, locationId: main.id } }, data: { quantityReserved: 2 } });
    await db.product.update({ where: { id: product.id }, data: { isActive: false, isFeatured: true, translations: { create: { locale: "en", name: "Existing English" } } } });
    const changed = row(product.sku); changed[5] = "20.00"; changed[6] = "12"; changed[7] = "";
    changed.splice(8, 4, "", "", "", ""); changed[12] += ";Honda|Civic|2016|2020";
    await commit(csv([changed]));
    await commit(csv([changed]));
    const updated = await db.product.findUniqueOrThrow({ where: { sku: product.sku }, include: { compatibilities: true, inventoryStocks: true, translations: true } });
    expect(updated).toMatchObject({ id: product.id, slug: product.slug, priceCents: 2000, weightGrams: 1250, description: null, isActive: false, isFeatured: true });
    expect(updated.compatibilities).toHaveLength(2);
    expect(updated.translations[0].name).toBe("Existing English");
    expect(updated.inventoryStocks.find((stock) => stock.locationId === main.id)).toMatchObject({ quantityOnHand: 12, quantityReserved: 2 });
    expect(updated.inventoryStocks.find((stock) => stock.locationId === secondary.id)?.quantityOnHand).toBe(30);
    expect(await db.product.count({ where: { sku: product.sku } })).toBe(1);
    const audit = await db.adminAuditLog.findFirstOrThrow({ where: { action: "catalog.csv_imported" }, orderBy: { createdAt: "desc" } });
    expect(audit).toMatchObject({ adminUserId: actor.id, adminUserEmail: actor.email });
  });

  it("rejects invalid rows and stale previews without partial updates", async () => {
    const invalid = row("CSV-BAD"); invalid[5] = "not-a-price";
    const source = csv([row("CSV-NOT-PARTIAL"), invalid]);
    expect((await previewCatalogImport(source, false, actor)).errors[0]).toMatchObject({ row: 3, column: "precio_iva" });
    await expect(commitCatalogImport(source, false, "", actor)).rejects.toThrow("errores");
    expect(await db.product.count({ where: { sku: "CSV-NOT-PARTIAL" } })).toBe(0);
    const existing = row("CSV-IDEMPOTENT"), main = await db.inventoryLocation.findUniqueOrThrow({ where: { code: "MAIN" } });
    const product = await db.product.findUniqueOrThrow({ where: { sku: existing[0] } });
    existing[6] = "1";
    expect((await previewCatalogImport(csv([existing]), false, actor)).errors[0].column).toBe("stock");
    existing[6] = "15";
    const validSource = csv([existing]), preview = await previewCatalogImport(validSource, false, actor);
    await db.inventoryStock.update({ where: { productId_locationId: { productId: product.id, locationId: main.id } }, data: { quantityReserved: 3 } });
    await expect(commitCatalogImport(validSource, false, preview.revision, actor)).rejects.toThrow("cambiaron");
    expect((await db.inventoryStock.findUniqueOrThrow({ where: { productId_locationId: { productId: product.id, locationId: main.id } } })).quantityOnHand).toBe(12);
  });

  it("rolls back the complete batch if audit persistence fails after product writes", async () => {
    const source = csv([row("CSV-ROLLBACK-ONE"), row("CSV-ROLLBACK-TWO")]);
    const preview = await previewCatalogImport(source, false, actor);
    await db.$executeRawUnsafe(`ALTER TABLE "${isolation.schema}"."AdminAuditLog" ADD CONSTRAINT "reject_csv_audit" CHECK (action <> 'catalog.csv_imported') NOT VALID`);
    try {
      await expect(commitCatalogImport(source, false, preview.revision, actor)).rejects.toThrow("No se importó el lote");
      expect(await db.product.count({ where: { sku: { startsWith: "CSV-ROLLBACK-" } } })).toBe(0);
    } finally { await db.$executeRawUnsafe(`ALTER TABLE "${isolation.schema}"."AdminAuditLog" DROP CONSTRAINT "reject_csv_audit"`); }
  });

  it("serializes concurrent confirmations of the same preview", async () => {
    const source = csv([row("CSV-CONCURRENT")]);
    const preview = await previewCatalogImport(source, false, actor);
    const attempts = await Promise.allSettled([commitCatalogImport(source, false, preview.revision, actor), commitCatalogImport(source, false, preview.revision, actor)]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(await db.product.count({ where: { sku: "CSV-CONCURRENT" } })).toBe(1);
    expect(await db.adminAuditLog.count({ where: { metadata: { path: ["sourceHash"], equals: csvDigest(source) } } })).toBe(1);
  });

  it("deactivates only flagged demo products, preserving orders and imported conversions", async () => {
    const category = await db.productCategory.findFirstOrThrow();
    const create = (sku: string, isDemo: boolean) => db.product.create({ data: { sku, slug: sku.toLowerCase(), name: sku, brand: "Fixture", categoryId: category.id, priceCents: 1000, isDemo } });
    const demo = await create("CSV-SEED-OLD", true);
    const converted = await create("CSV-SEED-CONVERTED", true);
    const real = await create("MOCK-NOT-SEED", false);
    const order = await db.order.create({ data: {
      orderNumber: "CSV-DEMO-ORDER", customerName: "Fixture", customerEmail: "fixture@example.com", customerPhone: "7000-0000", currency: "USD", subtotalCents: 1000, taxCents: 115, shippingCents: 0, totalCents: 1000, status: "PAYMENT_PROCESSING",
      items: { create: { productId: demo.id, skuSnapshot: demo.sku, productNameSnapshot: demo.name, brandSnapshot: demo.brand, quantity: 1, unitPriceCents: 1000, lineTotalCents: 1000, taxCents: 115 } },
    } });
    const source = csv([row(converted.sku)]), preview = await previewCatalogImport(source, true, actor);
    expect(preview.demo.map((product) => product.id)).toEqual([demo.id]);
    expect((await commitCatalogImport(source, true, preview.revision, actor)).deactivated).toBe(1);
    expect((await db.product.findUniqueOrThrow({ where: { id: demo.id } })).isActive).toBe(false);
    expect(await db.product.findUniqueOrThrow({ where: { id: converted.id } })).toMatchObject({ isActive: true, isDemo: false });
    expect((await db.product.findUniqueOrThrow({ where: { id: real.id } })).isActive).toBe(true);
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } })).toMatchObject({ status: "PAYMENT_PROCESSING", items: [expect.objectContaining({ productId: demo.id })] });
  });
});
