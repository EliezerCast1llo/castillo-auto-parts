import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createAdminProduct, updateAdminProduct } from "./actions";
import { previewCatalogImport } from "@/lib/catalog-import";
import { CSV_COLUMNS, exportCsv } from "@/lib/catalog-csv";

const isolation = vi.hoisted(() => {
  const schema = `e2e_manual_sku_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused");
  url.searchParams.set("schema", schema);
  return { schema, url: url.toString(), requireAdmin: vi.fn() };
});
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient({ datasources: { db: { url: isolation.url } } }) };
});
vi.mock("@/lib/admin-auth", () => ({ requireAdminRole: isolation.requireAdmin }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/revalidate", () => ({ revalidateStorefrontPath: vi.fn() }));
vi.mock("@/data/products", () => ({ CATALOG_CACHE_TAG: "catalog", productCacheTag: (slug: string) => `product:${slug}` }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`TEST_REDIRECT:${path}`); } }));

const actor = { id: "sku-admin", email: "sku-admin@example.com", role: "ADMIN" as const, name: "Fixture" };
async function submit(action: (form: FormData) => Promise<void>, form: FormData) {
  try { await action(form); }
  catch (error) {
    if (error instanceof Error && error.message.startsWith("TEST_REDIRECT:")) return new URL(error.message.slice("TEST_REDIRECT:".length), "https://admin.test");
    throw error;
  }
  throw new Error("Action did not redirect");
}

describe.skipIf(!process.env.DATABASE_URL)("manual product SKU writes with isolated PostgreSQL", () => {
  let categoryId: string;
  const form = (sku: string, slug: string, productId?: string) => {
    const data = new FormData();
    for (const [name, value] of Object.entries({ sku, slug, name: `Fixture ${slug}`, brand: "Proveedor", categoryId, price: "25.50", quantityOnHand: "10", reorderPoint: "2", status: "IN_STOCK", isActive: "true", ...(productId ? { productId } : {}) })) data.set(name, value);
    return data;
  };
  beforeAll(async () => {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: isolation.url, DIRECT_DATABASE_URL: isolation.url }, stdio: "pipe" });
    categoryId = (await db.productCategory.create({ data: { name: "Manual SKU Fixtures", slug: "manual-sku-fixtures" } })).id;
    isolation.requireAdmin.mockResolvedValue(actor);
  }, 30_000);
  afterAll(async () => {
    try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${isolation.schema}" CASCADE`); }
    finally { await db.$disconnect(); }
  });

  it("rejects creating abc-1 when ABC-1 exists, before categories, stock or audit writes", async () => {
    expect((await submit(createAdminProduct, form("ABC-1", "existing-abc"))).searchParams.get("estado")).toBe("created");
    const before = { products: await db.product.count(), stocks: await db.inventoryStock.count(), audit: await db.adminAuditLog.count() };
    const duplicate = form("abc-1", "would-be-duplicate"); duplicate.set("newCategoryName", "Never create conflict category");
    const result = await submit(createAdminProduct, duplicate);
    expect(result.pathname).toBe("/admin/products/new");
    expect(result.searchParams.get("estado")).toBe("sku_conflict");
    expect(result.searchParams.get("sku_existente")).toBe("ABC-1");
    expect({ products: await db.product.count(), stocks: await db.inventoryStock.count(), audit: await db.adminAuditLog.count() }).toEqual(before);
    expect(await db.productCategory.count({ where: { name: "Never create conflict category" } })).toBe(0);
  });

  it("stores the CSV canonical SKU and the CSV recognizes a manually created product as an update", async () => {
    const result = await submit(createAdminProduct, form(" qa-fil/03 ", "manual-qa-fil"));
    expect(result.searchParams.get("estado")).toBe("created");
    const product = await db.product.findUniqueOrThrow({ where: { sku: "QA-FIL/03" } });
    const source = exportCsv([CSV_COLUMNS, ["qa-fil/03", product.name, product.brand, "", "Manual SKU Fixtures", "30.00", "12", "", "", "", "", "", ""]]);
    const preview = await previewCatalogImport(source, false, actor);
    expect(preview.errors).toEqual([]);
    expect(preview.items).toEqual([expect.objectContaining({ action: "actualizar", productId: product.id })]);
    expect(await db.product.count({ where: { sku: "QA-FIL/03" } })).toBe(1);
  });

  it("allows own unchanged/case-only SKU edits and normalizes legacy own spelling", async () => {
    await submit(createAdminProduct, form("EDIT-SELF", "edit-self"));
    const product = await db.product.findUniqueOrThrow({ where: { sku: "EDIT-SELF" } });
    for (const sku of ["EDIT-SELF", "edit-self", " eDit -self "]) {
      const result = await submit(updateAdminProduct, form(sku, product.slug, product.id));
      expect(result.searchParams.get("estado")).toBe("updated");
      expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).sku).toBe("EDIT-SELF");
    }
    await db.product.update({ where: { id: product.id }, data: { sku: "edit-self" } });
    expect((await submit(updateAdminProduct, form("EDIT-SELF", product.slug, product.id))).searchParams.get("estado")).toBe("updated");
    expect(await db.product.count({ where: { sku: "EDIT-SELF" } })).toBe(1);
  });

  it("rejects renaming another product to a canonical collision without changing either product", async () => {
    await submit(createAdminProduct, form("EDIT-OTHER", "edit-other"));
    const before = await db.product.findUniqueOrThrow({ where: { sku: "EDIT-OTHER" }, include: { inventoryStocks: true } });
    const audits = await db.adminAuditLog.count();
    const changes = form(" aBc-1 ", "must-not-rename", before.id); changes.set("name", "Must not change"); changes.set("quantityOnHand", "99");
    const result = await submit(updateAdminProduct, changes);
    expect(result.pathname).toBe(`/admin/products/${before.slug}/edit`);
    expect(result.searchParams.get("estado")).toBe("sku_conflict");
    expect(result.searchParams.get("sku_existente")).toBe("ABC-1");
    expect(await db.product.findUniqueOrThrow({ where: { id: before.id }, include: { inventoryStocks: true } })).toEqual(before);
    expect(await db.adminAuditLog.count()).toBe(audits);
  });

  it("finds legacy whitespace variants and reports existing ambiguous duplicates without merging", async () => {
    const legacy = await db.product.create({ data: { sku: "legacy /sku\u00a0", slug: "legacy-spaced", name: "Legacy", brand: "Fixture", categoryId, priceCents: 100 } });
    const result = await submit(createAdminProduct, form("LEGACY/SKU", "cannot-create-legacy"));
    expect(result.searchParams.get("sku_existente")).toBe(legacy.sku);
    const duplicate = await db.product.create({ data: { sku: "LEGACY/SKU", slug: "legacy-upper", name: "Legacy 2", brand: "Fixture", categoryId, priceCents: 200 } });
    const edit = await submit(updateAdminProduct, form(legacy.sku, legacy.slug, legacy.id));
    expect(edit.pathname).toBe(`/admin/products/${legacy.slug}/edit`);
    expect(edit.searchParams.get("estado")).toBe("sku_conflict");
    expect(edit.searchParams.get("sku_existente")).toBe(duplicate.sku);
    expect(await db.product.findUniqueOrThrow({ where: { id: legacy.id } })).toMatchObject({ sku: legacy.sku, priceCents: 100 });
    expect(await db.product.findUniqueOrThrow({ where: { id: duplicate.id } })).toMatchObject({ sku: duplicate.sku, priceCents: 200 });
  });

  it("concurrent case variants create only one product and report the winner SKU", async () => {
    const attempts = await Promise.all([
      submit(createAdminProduct, form("concurrent-sku", "concurrent-one")),
      submit(createAdminProduct, form(" CONCURRENT-SKU ", "concurrent-two")),
    ]);
    expect(attempts.map((url) => url.searchParams.get("estado")).sort()).toEqual(["created", "sku_conflict"]);
    expect(attempts.find((url) => url.searchParams.get("estado") === "sku_conflict")?.searchParams.get("sku_existente")).toBe("CONCURRENT-SKU");
    expect(await db.product.count({ where: { sku: "CONCURRENT-SKU" } })).toBe(1);
    expect(await db.adminAuditLog.count({ where: { action: "product.created", entityLabel: "CONCURRENT-SKU" } })).toBe(1);
  });

  it("normalization cannot turn a blank SKU into a valid product", async () => {
    const count = await db.product.count();
    expect((await submit(createAdminProduct, form(" \u00a0 ", "empty-sku"))).searchParams.get("estado")).toBe("invalid_sku");
    expect(await db.product.count()).toBe(count);
  });

  it("rechecks after serialization conflicts so concurrent distinct SKUs can both save", async () => {
    const results = await Promise.all([
      submit(createAdminProduct, form("DISTINCT-ONE", "distinct-one")),
      submit(createAdminProduct, form("DISTINCT-TWO", "distinct-two")),
    ]);
    expect(results.map((url) => url.searchParams.get("estado"))).toEqual(["created", "created"]);
    expect(await db.product.count({ where: { sku: { in: ["DISTINCT-ONE", "DISTINCT-TWO"] } } })).toBe(2);
  });

  it.each(["ABC#1", "AÑO-1", "añ o-1", "ß-FIL", "X".repeat(65)])("rejects invalid SKU format on create and edit without changes (%#)", async (sku) => {
    const existing = await db.product.findUniqueOrThrow({ where: { sku: "EDIT-SELF" }, include: { inventoryStocks: true } });
    const counts = { products: await db.product.count(), audit: await db.adminAuditLog.count() };
    const create = form(sku, "never-created-invalid"); create.set("newCategoryName", "Never created invalid category");
    const rejectedCreate = await submit(createAdminProduct, create);
    expect(rejectedCreate.pathname).toBe("/admin/products/new");
    expect(rejectedCreate.searchParams.get("estado")).toBe("invalid_sku");
    const edit = form(sku, "attempted-untrusted-slug", existing.id); edit.set("name", "Do not overwrite"); edit.set("quantityOnHand", "99");
    const rejectedEdit = await submit(updateAdminProduct, edit);
    expect(rejectedEdit.pathname).toBe(`/admin/products/${existing.slug}/edit`);
    expect(rejectedEdit.searchParams.get("estado")).toBe("invalid_sku");
    expect(await db.product.findUniqueOrThrow({ where: { id: existing.id }, include: { inventoryStocks: true } })).toEqual(existing);
    expect({ products: await db.product.count(), audit: await db.adminAuditLog.count() }).toEqual(counts);
    expect(await db.productCategory.count({ where: { name: "Never created invalid category" } })).toBe(0);
  });

  it("accepts dots and underscores used by valid CSV SKUs", async () => {
    const result = await submit(createAdminProduct, form("ab.c_1", "valid-dot-underscore"));
    expect(result.searchParams.get("estado")).toBe("created");
    expect(await db.product.findUniqueOrThrow({ where: { sku: "AB.C_1" } })).toMatchObject({ slug: "valid-dot-underscore" });
  });
});
