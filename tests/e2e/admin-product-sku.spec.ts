import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { prisma } from "./helpers";
import { CSV_COLUMNS, exportCsv } from "../../src/lib/catalog-csv";

const prefix = `E2E-SKU-${randomUUID().slice(0, 8)}`.toUpperCase();
const slugPrefix = prefix.toLowerCase();
let categoryId: string;
const categoryName = `Categoría ${prefix}`;

test.beforeAll(async () => {
  categoryId = (await prisma.productCategory.create({ data: { name: categoryName, slug: `${slugPrefix}-category` } })).id;
});
test.beforeEach(async ({ page }, info) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.101.${100 + info.workerIndex}` });
  await page.goto("/admin/login");
  await page.getByLabel("Correo electrónico").fill(process.env.ADMIN_SEED_EMAIL || "admin@castilloautoparts.com");
  await page.getByLabel("Contraseña").fill(process.env.ADMIN_SEED_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders/);
});
test.afterAll(async () => {
  const products = await prisma.product.findMany({ where: { slug: { startsWith: slugPrefix } }, select: { id: true } });
  const filter = { productId: { in: products.map(({ id }) => id) } };
  await prisma.vehicleCompatibility.deleteMany({ where: filter });
  await prisma.inventoryStock.deleteMany({ where: filter });
  await prisma.productTranslation.deleteMany({ where: filter });
  await prisma.product.deleteMany({ where: { id: filter.productId } });
  if (categoryId) await prisma.productCategory.deleteMany({ where: { id: categoryId } });
  await prisma.$disconnect();
});

async function prepareProduct(page: Page, sku: string, slug: string) {
  await page.goto("/admin/products/new");
  await page.getByLabel("Nombre", { exact: true }).fill(`Repuesto ${slug}`);
  await page.getByLabel("Marca", { exact: true }).fill("Proveedor SKU");
  await page.getByLabel("SKU", { exact: true }).fill(sku);
  await page.getByLabel("Slug", { exact: true }).fill(slug);
  await page.getByLabel("Precio USD", { exact: true }).fill("25.50");
  await page.getByLabel(/^Categoría/).selectOption(categoryId);
  await page.getByLabel("Cantidad", { exact: true }).fill("10");
}

test("manual creation normalizes SKU, self edits succeed and another-case CSV previews as update", async ({ page }) => {
  const sku = `${prefix}-QA-FIL/03`, slug = `${slugPrefix}-normalized`;
  await prepareProduct(page, ` ${prefix.toLowerCase()}-qa-fil/03 `, slug);
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${slug}/edit\\?estado=created$`));
  await expect(page.getByLabel("SKU", { exact: true })).toHaveValue(sku);
  const created = await prisma.product.findUniqueOrThrow({ where: { sku } });
  for (const value of [sku, sku.toLowerCase()]) {
    await page.getByLabel("SKU", { exact: true }).fill(value);
    await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
    await expect(page).toHaveURL(/estado=updated$/);
    await expect(page.getByLabel("SKU", { exact: true })).toHaveValue(sku);
  }
  expect(await prisma.product.count({ where: { sku } })).toBe(1);
  await page.goto("/admin/products/import");
  const contents = exportCsv([CSV_COLUMNS, [sku.toLowerCase(), created.name, created.brand, "", categoryName, "26.50", "12", "", "", "", "", "", ""]]);
  await page.getByLabel("Archivo CSV").setInputFiles({ name: "manual-sku.csv", mimeType: "text/csv", buffer: Buffer.from(contents) });
  await page.getByRole("button", { name: "Validar y ver vista previa" }).click();
  await expect(page.getByText("0 productos nuevos; 1 existentes.")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: sku })).toContainText("actualizar");
  await expect(page.getByRole("button", { name: "Confirmar importación", exact: true })).toBeEnabled();
  expect(await prisma.product.count({ where: { sku } })).toBe(1);
});

test("create and edit collisions report the existing SKU and preserve records", async ({ page }) => {
  const sku = `${prefix}-ABC-1`, existingSlug = `${slugPrefix}-existing`, otherSku = `${prefix}-OTHER`, otherSlug = `${slugPrefix}-other`;
  const existing = await prisma.product.create({ data: { sku, slug: existingSlug, name: "Existing SKU fixture", brand: "Fixture", categoryId, priceCents: 100 } });
  await prepareProduct(page, sku.toLowerCase(), `${slugPrefix}-duplicate`);
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/new\?estado=sku_conflict/);
  const notice = page.getByRole("alert").filter({ hasText: "El SKU coincide" });
  await expect(notice).toContainText(sku);
  await expect(notice).toContainText("no se guardó ningún cambio");
  expect(await prisma.product.count({ where: { sku } })).toBe(1);
  expect(await prisma.product.count({ where: { slug: `${slugPrefix}-duplicate` } })).toBe(0);
  const other = await prisma.product.create({ data: { sku: otherSku, slug: otherSlug, name: "Other SKU fixture", brand: "Fixture", categoryId, priceCents: 200 } });
  await page.goto(`/admin/products/${otherSlug}/edit`);
  await page.getByLabel("SKU", { exact: true }).fill(sku.toLowerCase());
  await page.getByLabel("Nombre", { exact: true }).fill("Must not overwrite");
  await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${otherSlug}/edit\\?estado=sku_conflict`));
  await expect(page.getByRole("alert").filter({ hasText: "El SKU coincide" })).toContainText(sku);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(existing);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: other.id } })).toEqual(other);
});

test("invalid SKU formats show allowed characters and return to the original edit form", async ({ page }) => {
  for (const invalid of ["ABC#1", "AÑO-1"]) {
    await prepareProduct(page, `${prefix}-${invalid}`, `${slugPrefix}-invalid`);
    await page.getByRole("button", { name: "Crear producto", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products\/new\?estado=invalid_sku$/);
    await expect(page.getByRole("alert").filter({ hasText: "El SKU es obligatorio" })).toContainText("A-Z sin tildes");
    expect(await prisma.product.count({ where: { slug: `${slugPrefix}-invalid` } })).toBe(0);
  }
  const sku = `${prefix}-AB.C_1`, slug = `${slugPrefix}-valid-punctuation`;
  await prepareProduct(page, sku.toLowerCase(), slug);
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await expect(page).toHaveURL(/estado=created$/);
  const before = await prisma.product.findUniqueOrThrow({ where: { sku }, include: { inventoryStocks: true } });
  for (const invalid of ["ABC#1", "AÑO-1"]) {
    await page.getByLabel("SKU", { exact: true }).fill(invalid);
    await page.getByLabel("Slug", { exact: true }).fill(`${slugPrefix}-attempted-slug`);
    await page.getByLabel("Nombre", { exact: true }).fill("Do not overwrite");
    await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/products/${slug}/edit\\?estado=invalid_sku$`));
    await expect(page.getByLabel("SKU", { exact: true })).toHaveValue(sku);
    const error = page.getByRole("alert").filter({ hasText: "El SKU es obligatorio" });
    await expect(error).toContainText("A-Z sin tildes");
    await expect(error).toContainText("punto, guion, barra o guion bajo");
    expect(await prisma.product.findUniqueOrThrow({ where: { id: before.id }, include: { inventoryStocks: true } })).toEqual(before);
  }
});

test("historical duplicate collisions instruct the admin to rename one product on its own edit page", async ({ page }) => {
  const sku = `${prefix}-DUP-1`, slug = `${slugPrefix}-legacy-one`;
  const existing = await prisma.product.create({ data: { sku, slug, name: "Legacy uppercase", brand: "Fixture", categoryId, priceCents: 100 } });
  const duplicate = await prisma.product.create({ data: { sku: `${prefix}-dup-1`, slug: `${slugPrefix}-legacy-two`, name: "Legacy lowercase", brand: "Fixture", categoryId, priceCents: 200 } });
  await page.goto(`/admin/products/${slug}/edit`);
  await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${slug}/edit\\?estado=sku_conflict`));
  const error = page.getByRole("alert").filter({ hasText: "El SKU coincide" });
  await expect(error).toContainText("renombra uno de los dos productos");
  await expect(error).toContainText(duplicate.sku);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(existing);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: duplicate.id } })).toEqual(duplicate);
});


test("historical invalid SKU requires correction before changing price and preserves the record", async ({ page }) => {
  const slug = `${slugPrefix}-historical-invalid`;
  const before = await prisma.product.create({ data: { sku: `${prefix}-OLD#1`, slug, name: "Legacy invalid SKU", brand: "Fixture", categoryId, priceCents: 100 } });
  await page.goto(`/admin/products/${slug}/edit`);
  await page.getByLabel("Precio USD", { exact: true }).fill("35.50");
  await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
  await expect(page).toHaveURL(/estado=invalid_sku$/);
  const error = page.getByRole("alert").filter({ hasText: "Primero corrige el SKU" });
  await expect(error).toContainText("guardar este u otros cambios");
  await expect(error).toContainText("punto, guion, barra o guion bajo");
  expect(await prisma.product.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
});
