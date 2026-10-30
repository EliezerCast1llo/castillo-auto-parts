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
    expect(updated).toMatchObject({ id: product.id, slug: product.slug, priceCents: 2000, weightGrams: 1250, description: "Descripción", isActive: false, isFeatured: true });
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

  it("preserves blank optional data and compatibility IDs while previewing only actual price/stock changes and inactive state", async () => {
    const original = row("CSV-PRESERVE");
    await commit(csv([original]));
    const before = await db.product.update({ where: { sku: original[0] }, data: { isActive: false }, include: { compatibilities: true } });
    const changed = [...original]; changed[3] = ""; changed[7] = ""; changed[12] = "";
    changed.splice(8, 4, "", "", "", ""); changed[5] = "32.99"; changed[6] = "18";
    const source = csv([changed]), preview = await previewCatalogImport(source, false, actor);
    expect(preview.items[0]).toMatchObject({ action: "actualizar", productId: before.id, partNumber: "PARTE-1", description: "Descripción", isActive: false, changes: ["Precio con IVA", "Stock MAIN"] });
    expect(preview.items[0].compatibilities).toEqual([{ make: "Toyota", model: "Corolla", yearFrom: 2010, yearTo: 2018 }]);
    await commitCatalogImport(source, false, preview.revision, actor);
    const after = await db.product.findUniqueOrThrow({ where: { id: before.id }, include: { compatibilities: true, inventoryStocks: true } });
    expect(after).toMatchObject({ sku: before.sku, slug: before.slug, partNumber: before.partNumber, description: before.description, weightGrams: before.weightGrams, isActive: false, priceCents: 3299 });
    expect(after.compatibilities).toEqual(before.compatibilities);
    expect(after.inventoryStocks[0].quantityOnHand).toBe(18);
    const audit = await db.adminAuditLog.findFirstOrThrow({ where: { metadata: { path: ["sourceHash"], equals: csvDigest(source) } } });
    expect(audit.metadata).toMatchObject({ rows: [expect.objectContaining({ compatibilities: 1, changes: ["Precio con IVA", "Stock MAIN"], isActive: false })] });
  });

  it("still replaces nonempty optional fields and creates empty defaults on a new product", async () => {
    const original = row("CSV-REPLACE"); await commit(csv([original]));
    const changed = [...original]; changed[3] = "NEW-PART"; changed[7] = "Nueva descripción"; changed[12] = "Honda|Civic|2016|2020";
    const source = csv([changed]), preview = await previewCatalogImport(source, false, actor);
    expect(preview.items[0].changes).toEqual(["Número de parte", "Descripción", "Compatibilidades"]);
    await commitCatalogImport(source, false, preview.revision, actor);
    const product = await db.product.findUniqueOrThrow({ where: { sku: original[0] }, include: { compatibilities: true } });
    expect(product).toMatchObject({ partNumber: "NEW-PART", description: "Nueva descripción" });
    expect(product.compatibilities).toEqual([expect.objectContaining({ make: "Honda", model: "Civic" })]);
    const empty = row("CSV-NEW-EMPTY"); empty[3] = ""; empty[7] = ""; empty[12] = ""; empty.splice(8, 4, "1", "20", "10", "5");
    await commit(csv([empty]));
    expect(await db.product.findUniqueOrThrow({ where: { sku: empty[0] }, include: { compatibilities: true } })).toMatchObject({ partNumber: null, description: null, weightGrams: 1000, compatibilities: [], isActive: true });
  });

  it("updates case-insensitive matches and preserves the stored spelling of legacy SKUs", async () => {
    const original = row("QA-FIL/03"); await commit(csv([original]));
    const product = await db.product.findUniqueOrThrow({ where: { sku: original[0] } });
    const changed = [...original]; changed[0] = "qa-fil/03"; changed[5] = "28.50";
    const source = csv([changed]), preview = await previewCatalogImport(source, false, actor);
    expect(preview.items[0]).toMatchObject({ action: "actualizar", productId: product.id, source: { sku: "QA-FIL/03" } });
    expect(await commitCatalogImport(source, false, preview.revision, actor)).toMatchObject({ created: 0, updated: 1 });
    await db.product.update({ where: { id: product.id }, data: { sku: "qa-fil /03\u00a0" } });
    const legacyPreview = await previewCatalogImport(source, false, actor);
    expect(legacyPreview.items[0]).toMatchObject({ action: "actualizar", productId: product.id, existingSku: "qa-fil /03\u00a0" });
    await commitCatalogImport(source, false, legacyPreview.revision, actor);
    expect(await db.product.findUniqueOrThrow({ where: { id: product.id } })).toMatchObject({ sku: "qa-fil /03\u00a0", priceCents: 2850 });
    expect(await db.product.count({ where: { OR: [{ sku: "QA-FIL/03" }, { sku: "qa-fil/03" }, { id: product.id }] } })).toBe(1);
  });

  it("blocks ambiguous existing SKU collisions without partial writes", async () => {
    await commit(csv([row("QA-CLASH/03")]));
    const existing = await db.product.findUniqueOrThrow({ where: { sku: "QA-CLASH/03" } });
    await db.product.create({ data: { sku: "qa-clash/03", slug: "legacy-case-clash", name: "Legacy clash", brand: "Fixture", categoryId: existing.categoryId, priceCents: 99 } });
    const source = csv([row("CSV-CLASH-NO-PARTIAL"), row("QA-CLASH/03")]);
    const preview = await previewCatalogImport(source, false, actor);
    expect(preview.errors).toContainEqual(expect.objectContaining({ row: 3, column: "sku", message: expect.stringContaining("varios productos") }));
    const audits = await db.adminAuditLog.count();
    await expect(commitCatalogImport(source, false, preview.revision, actor)).rejects.toThrow("cambiaron");
    expect(await db.product.count({ where: { sku: "CSV-CLASH-NO-PARTIAL" } })).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: existing.id } })).priceCents).toBe(2550);
    expect(await db.adminAuditLog.count()).toBe(audits);
  });

  it("invalidates previews after compatibility-only changes or a new canonical SKU match", async () => {
    const original = row("CSV-STALE-COMPAT"); await commit(csv([original]));
    const product = await db.product.findUniqueOrThrow({ where: { sku: original[0] }, include: { compatibilities: true } });
    const unchanged = [...original]; unchanged[12] = "";
    const source = csv([unchanged]), preview = await previewCatalogImport(source, false, actor);
    await db.vehicleCompatibility.update({ where: { id: product.compatibilities[0].id }, data: { yearTo: 2019 } });
    await expect(commitCatalogImport(source, false, preview.revision, actor)).rejects.toThrow("cambiaron");
    const fresh = csv([row("CSV-LATE-MATCH")]), before = await previewCatalogImport(fresh, false, actor);
    await db.product.create({ data: { sku: "csv-late-match", slug: "late-case-match", name: "Concurrent legacy match", brand: "Fixture", categoryId: product.categoryId, priceCents: 50 } });
    await expect(commitCatalogImport(fresh, false, before.revision, actor)).rejects.toThrow("cambiaron");
    expect(await db.product.count({ where: { sku: "CSV-LATE-MATCH" } })).toBe(0);
  });

  it("deactivates only flagged demo products, preserving orders and imported conversions", async () => {
    const category = await db.productCategory.findFirstOrThrow();
    const create = (sku: string, isDemo: boolean) => db.product.create({ data: { sku, slug: sku.toLowerCase(), name: sku, brand: "Fixture", categoryId: category.id, priceCents: 1000, isDemo } });
    const demo = await create("CSV-SEED-OLD", true);
    const converted = await create("csv-seed-converted", true);
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
