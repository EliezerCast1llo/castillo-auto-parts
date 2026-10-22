import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { prisma } from "./helpers";
import { hashPassword } from "../../src/lib/admin-credentials";
import { CSV_COLUMNS, exportCsv } from "../../src/lib/catalog-csv";

// Own fixtures only: this spec never mutates the shared seed SKUs in PRODUCT_CLAIMS.
const prefix = `E2E-CSV-${randomUUID().slice(0, 8)}`;
const category = `Categoría ${prefix}`;
const marketingEmail = `${prefix.toLowerCase()}@e2e.castilloautoparts.com`;
const fixturePassword = "CsvFixturePassword123!";
const row = (sku: string) => [sku, `Repuesto ${sku}`, "Proveedor CSV", "PARTE-1", category, "25.50", "10", 'Descripción, con "comillas"', "1.250", "20.5", "10", "5", "Toyota|Corolla|2010|2018;Honda|Civic|2016|2020"];
const file = (rows: string[][]) => ({ name: "catalogo.csv", mimeType: "text/csv", buffer: Buffer.from(exportCsv([CSV_COLUMNS, ...rows])) });

async function login(page: Page, email = process.env.ADMIN_SEED_EMAIL || "admin@castilloautoparts.com", password = process.env.ADMIN_SEED_PASSWORD || "admin123") {
  await page.goto("/admin/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/(orders|products)/);
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${160 + testInfo.workerIndex}` });
});
test.afterAll(async () => {
  const filter = { product: { sku: { startsWith: prefix } } };
  await prisma.vehicleCompatibility.deleteMany({ where: filter });
  await prisma.inventoryStock.deleteMany({ where: filter });
  await prisma.productTranslation.deleteMany({ where: filter });
  await prisma.product.deleteMany({ where: { sku: { startsWith: prefix } } });
  await prisma.productCategory.deleteMany({ where: { name: category } });
  await prisma.user.deleteMany({ where: { email: marketingEmail } });
  await prisma.$disconnect();
});

test("admin previews, imports and updates CSV products without duplicates, and edits package measurements", async ({ page }) => {
  await login(page);
  await page.goto("/admin/products");
  await page.getByRole("link", { name: "Importar CSV", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar plantilla CSV" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("catalogo-plantilla.csv");
  const path = await download.path();
  expect(await readFile(path!, "utf8")).toContain('"sku","nombre","marca"');
  const importPrefix = `${prefix}-IMPORT`;
  const rows = [row(`${importPrefix}-ONE`), row(`${importPrefix}-TWO`)];
  await page.getByLabel("Archivo CSV").setInputFiles(file(rows));
  await page.getByRole("button", { name: "Validar y ver vista previa" }).click();
  await expect(page.getByText("2 productos nuevos; 0 existentes.")).toBeVisible();
  expect(await prisma.product.count({ where: { sku: { in: rows.map((row) => row[0]) } } })).toBe(0);
  await page.getByRole("button", { name: "Confirmar importación", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Importación completada" })).toContainText("2 creados, 0 actualizados");
  const created = await prisma.product.findUniqueOrThrow({ where: { sku: rows[0][0] }, include: { compatibilities: true, inventoryStocks: true } });
  expect(created).toMatchObject({ priceCents: 2550, weightGrams: 1250, lengthMm: 205, widthMm: 100, heightMm: 50, isDemo: false });
  expect(created.compatibilities).toHaveLength(2);
  expect(created.inventoryStocks[0].quantityOnHand).toBe(10);
  rows[0][5] = "30.75"; rows[0][6] = "12";
  await page.getByLabel("Archivo CSV").setInputFiles(file(rows));
  await page.getByRole("button", { name: "Validar y ver vista previa" }).click();
  await expect(page.getByText("0 productos nuevos; 2 existentes.")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar importación", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Importación completada" })).toContainText("0 creados, 2 actualizados");
  expect(await prisma.product.count({ where: { sku: { startsWith: importPrefix } } })).toBe(2);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ priceCents: 3075, slug: created.slug });
  const audit = await prisma.adminAuditLog.findFirst({ where: { action: "catalog.csv_imported", metadata: { path: ["rows"], array_contains: [{ sku: rows[0][0], action: "actualizar", stockBefore: 10, stockAfter: 12, priceBefore: 2550, priceAfter: 3075 }] } } });
  expect(audit).not.toBeNull();
  await page.goto(`/admin/products/${created.slug}/edit`);
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("1.25");
  await page.getByLabel("Peso (kg)").fill("2.5");
  await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
  await expect(page).toHaveURL(/estado=updated/);
  expect((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).weightGrams).toBe(2500);
});

test("CSV row errors prevent confirmation and partial imports", async ({ page }) => {
  await login(page);
  await page.goto("/admin/products/import");
  const valid = row(`${prefix}-VALID`), invalid = row(`${prefix}-INVALID`); invalid[5] = "bad-price";
  await page.getByLabel("Archivo CSV").setInputFiles(file([valid, invalid]));
  await page.getByRole("button", { name: "Validar y ver vista previa" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Corrige estos errores" })).toContainText("Fila 3 · precio_iva");
  await expect(page.getByRole("button", { name: "Confirmar importación", exact: true })).toBeDisabled();
  expect(await prisma.product.count({ where: { sku: { in: [valid[0], invalid[0]] } } })).toBe(0);
});

test("anonymous users and marketing cannot access catalog import", async ({ page, request }) => {
  expect((await request.get("/api/admin/catalog-import-template")).status()).toBe(401);
  await prisma.user.create({ data: { email: marketingEmail, name: "CSV Marketing", role: "MARKETING", isActive: true, passwordHash: await hashPassword(fixturePassword) } });
  await login(page, marketingEmail, fixturePassword);
  await page.goto("/admin/products");
  await expect(page.getByRole("link", { name: "Importar CSV", exact: true })).toHaveCount(0);
  await page.goto("/admin/products/import");
  await expect(page).toHaveURL(/\/admin\/products$/);
  expect((await page.request.get("/api/admin/catalog-import-template")).status()).toBe(403);
});
