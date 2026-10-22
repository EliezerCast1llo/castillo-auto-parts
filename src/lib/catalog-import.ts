import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { writeAdminAuditLog } from "./admin-audit";
import type { AdminSessionUser } from "./admin-user";
import { normalizeCatalogSku, parseCatalogCsv, SKU_WHITESPACE, type CatalogCsvRow, type CsvIssue } from "./catalog-csv";
import { csvDigest } from "./catalog-import-proof";
import { slugifyValue } from "./slug";
import type { PackageMeasurements } from "./package-measurements";

export type ImportPreviewItem = {
  source: CatalogCsvRow; action: "crear" | "actualizar"; previousStock: number | null;
  previousPrice: number | null; measurements: PackageMeasurements | null;
  productId: string | null; existingSku: string | null; isActive: boolean;
  partNumber: string | null; description: string | null;
  compatibilities: CatalogCsvRow["compatibilities"]; changes: string[];
};
export type CatalogImportPlan = {
  items: ImportPreviewItem[]; errors: CsvIssue[]; revision: string;
  demo: Array<{ id: string; sku: string; name: string; slug: string }>;
};
export class CatalogImportError extends Error {}

function assertAdmin(actor: AdminSessionUser) {
  if (actor.role !== "ADMIN") throw new CatalogImportError("Solo un administrador puede importar el catálogo.");
}

async function buildPlan(tx: Prisma.TransactionClient, rows: CatalogCsvRow[], deactivateDemo: boolean): Promise<CatalogImportPlan> {
  const skus = rows.map((row) => row.sku);
  // Compare canonical identities in PostgreSQL without loading the whole catalog.
  // Do not rewrite legacy SKUs: carts/order snapshots may still use their spelling.
  const matches = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "Product" WHERE upper(translate(sku, ${SKU_WHITESPACE}, '')) IN (${Prisma.join(skus)})
  `);
  const products = await tx.product.findMany({
    where: { OR: [{ id: { in: matches.map(({ id }) => id) } }, ...(deactivateDemo ? [{ isDemo: true, isActive: true }] : [])] },
    select: { id: true, sku: true, name: true, brand: true, partNumber: true, description: true, category: { select: { slug: true } },
      slug: true, isDemo: true, isActive: true, updatedAt: true, priceCents: true,
      weightGrams: true, lengthMm: true, widthMm: true, heightMm: true,
      compatibilities: { select: { make: true, model: true, yearFrom: true, yearTo: true }, orderBy: [{ make: "asc" }, { model: "asc" }, { yearFrom: "asc" }, { yearTo: "asc" }] },
      inventoryStocks: { where: { location: { code: "MAIN" } }, select: { id: true, quantityOnHand: true, quantityReserved: true, reorderPoint: true, status: true, updatedAt: true } },
    },
    orderBy: { sku: "asc" },
  });
  const categories = await tx.productCategory.findMany({ where: { slug: { in: rows.map((row) => row.categorySlug) } }, select: { id: true, slug: true, updatedAt: true }, orderBy: { slug: "asc" } });
  const bySku = new Map<string, typeof products>();
  for (const product of products) {
    const identity = normalizeCatalogSku(product.sku);
    bySku.set(identity, [...(bySku.get(identity) || []), product]);
  }
  const errors: CsvIssue[] = [];
  const items: ImportPreviewItem[] = [];
  const compatibilityKey = (values: CatalogCsvRow["compatibilities"]) => JSON.stringify(values.map(({ make, model, yearFrom, yearTo }) => JSON.stringify([make, model, yearFrom, yearTo])).sort());
  for (const row of rows) {
    const candidates = bySku.get(row.sku) || [];
    if (candidates.length > 1) {
      errors.push({ row: row.row, column: "sku", message: `Hay varios productos existentes para ${row.sku}: ${candidates.map((product) => product.sku).join(", ")}. Resuelve el choque en el catálogo antes de importar.` });
      continue;
    }
    const product = candidates[0], stock = product?.inventoryStocks[0];
    if (stock && row.stock < stock.quantityReserved) errors.push({ row: row.row, column: "stock", message: `Hay ${stock.quantityReserved} unidades reservadas; el stock no puede ser menor.` });
    const existingMeasurements = product?.weightGrams && product.lengthMm && product.widthMm && product.heightMm
      ? { weightGrams: product.weightGrams, lengthMm: product.lengthMm, widthMm: product.widthMm, heightMm: product.heightMm } : null;
    const partNumber = row.partNumber ?? product?.partNumber ?? null;
    const description = row.description ?? product?.description ?? null;
    const compatibilities = row.compatibilities.length ? row.compatibilities : product?.compatibilities ?? [];
    const measurements = row.measurements ?? existingMeasurements;
    const changes = product ? [
      ...(row.name !== product.name ? ["Nombre"] : []),
      ...(row.brand !== product.brand ? ["Marca"] : []),
      ...(row.categorySlug !== product.category.slug ? ["Categoría"] : []),
      ...(row.priceCents !== product.priceCents ? ["Precio con IVA"] : []),
      ...(row.stock !== stock?.quantityOnHand ? ["Stock MAIN"] : []),
      ...(partNumber !== product.partNumber ? ["Número de parte"] : []),
      ...(description !== product.description ? ["Descripción"] : []),
      ...(compatibilityKey(compatibilities) !== compatibilityKey(product.compatibilities) ? ["Compatibilidades"] : []),
      ...(row.measurements && JSON.stringify(row.measurements) !== JSON.stringify(existingMeasurements) ? ["Peso y medidas"] : []),
      ...(product.isDemo ? ["Origen demo → catálogo real"] : []),
    ] : ["Nuevo producto"];
    items.push({ source: row, action: product ? "actualizar" : "crear", productId: product?.id ?? null, existingSku: product?.sku ?? null,
      isActive: product?.isActive ?? true, previousStock: stock?.quantityOnHand ?? null, previousPrice: product?.priceCents ?? null,
      measurements, partNumber, description, compatibilities, changes });
  }
  const demo = deactivateDemo ? products.filter((product) => product.isDemo && product.isActive && !skus.includes(normalizeCatalogSku(product.sku))).map(({ id, sku, name, slug }) => ({ id, sku, name, slug })) : [];
  return { items, errors, demo, revision: csvDigest(JSON.stringify({ products, categories })) };
}

export async function previewCatalogImport(source: string, deactivateDemo: boolean, actor: AdminSessionUser): Promise<CatalogImportPlan> {
  assertAdmin(actor);
  const parsed = parseCatalogCsv(source);
  if (parsed.errors.length) return { items: [], errors: parsed.errors, demo: [], revision: "" };
  return db.$transaction((tx) => buildPlan(tx, parsed.rows, deactivateDemo), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function commitCatalogImport(source: string, deactivateDemo: boolean, revision: string, actor: AdminSessionUser) {
  assertAdmin(actor);
  const parsed = parseCatalogCsv(source);
  if (parsed.errors.length) throw new CatalogImportError("El CSV contiene errores. Genera otra vista previa.");
  try {
    return await db.$transaction(async (tx) => {
      const plan = await buildPlan(tx, parsed.rows, deactivateDemo);
      if (plan.errors.length || plan.revision !== revision) throw new CatalogImportError("El catálogo o sus reservas cambiaron. Genera otra vista previa antes de confirmar.");
      const location = await tx.inventoryLocation.upsert({ where: { code: "MAIN" }, update: {}, create: { code: "MAIN", name: "Bodega principal", isDefault: true, isActive: true } });
      const slugs: string[] = [];
      for (const item of plan.items) {
        const row = item.source;
        const category = await tx.productCategory.upsert({ where: { slug: row.categorySlug }, update: {}, create: { slug: row.categorySlug, name: row.category } });
        const data = { name: row.name, brand: row.brand, ...(row.partNumber !== null ? { partNumber: row.partNumber } : {}), categoryId: category.id,
          priceCents: row.priceCents, ...(row.description !== null ? { description: row.description } : {}), isDemo: false, ...(row.measurements ?? {}) };
        const product = item.productId
          ? await tx.product.update({ where: { id: item.productId }, data })
          : await tx.product.create({ data: { ...data, sku: row.sku, slug: `${slugifyValue(row.name).slice(0, 100) || "producto"}-${csvDigest(row.sku).slice(0, 12)}`, currency: "USD" } });
        const stock = await tx.inventoryStock.findUnique({ where: { productId_locationId: { productId: product.id, locationId: location.id } } });
        if (row.stock < (stock?.quantityReserved ?? 0)) throw new CatalogImportError(`El stock de ${row.sku} es menor que sus reservas. Genera otra vista previa.`);
        const available = row.stock - (stock?.quantityReserved ?? 0);
        const status = available <= 0 ? "OUT_OF_STOCK" : available <= (stock?.reorderPoint ?? 0) ? "LOW_STOCK" : "IN_STOCK";
        await tx.inventoryStock.upsert({ where: { productId_locationId: { productId: product.id, locationId: location.id } }, update: { quantityOnHand: row.stock, status }, create: { productId: product.id, locationId: location.id, quantityOnHand: row.stock, status } });
        if (row.compatibilities.length) {
          await tx.vehicleCompatibility.deleteMany({ where: { productId: product.id } });
          await tx.vehicleCompatibility.createMany({ data: row.compatibilities.map((vehicle) => ({ ...vehicle, productId: product.id })) });
        }
        slugs.push(product.slug);
      }
      const deactivated = plan.demo.length ? await tx.product.updateMany({ where: { id: { in: plan.demo.map((product) => product.id) }, isDemo: true }, data: { isActive: false } }) : { count: 0 };
      const created = plan.items.filter((item) => item.action === "crear").length;
      await writeAdminAuditLog(tx, {
        action: "catalog.csv_imported", entityType: "Catalog", entityLabel: "Importación CSV",
        adminUserId: actor.id, adminUserEmail: actor.email,
        metadata: { sourceHash: csvDigest(source), created, updated: parsed.rows.length - created, deactivated: deactivated.count,
          rows: plan.items.map((item) => ({ sku: item.source.sku, storedSku: item.existingSku ?? item.source.sku, action: item.action,
            stockBefore: item.previousStock, stockAfter: item.source.stock, priceBefore: item.previousPrice, priceAfter: item.source.priceCents,
            measurements: item.measurements, compatibilities: item.compatibilities.length, changes: item.changes, isActive: item.isActive })),
          demoSkus: plan.demo.map((product) => product.sku),
        },
      });
      return { created, updated: parsed.rows.length - created, deactivated: deactivated.count, slugs: [...slugs, ...plan.demo.map((product) => product.slug)] };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 30_000 });
  } catch (error) {
    if (error instanceof CatalogImportError) throw error;
    // Conflicts and database exceptions must never expose query/connection data.
    throw new CatalogImportError("No se importó el lote. Puede haber un cambio concurrente o un conflicto de SKU/ruta. Genera otra vista previa e inténtalo de nuevo.");
  }
}
