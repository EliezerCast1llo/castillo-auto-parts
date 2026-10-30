import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { addProductToCart, fillCustomerFields, prisma, ES } from "./helpers";
import { departments, municipalitiesByDepartment } from "../../src/data/el-salvador";

let sku: string;
let slug: string;
test.afterAll(async () => { await prisma.$disconnect(); });

test.beforeEach(async ({ page, context }) => {
  // fullyParallel may run each test group in the same worker: create per test.
  sku = `E2E-SHIP-${randomUUID()}`;
  slug = sku.toLowerCase();
  const category = await prisma.productCategory.create({ data: { name: sku, slug } });
  const location = await prisma.inventoryLocation.findUniqueOrThrow({ where: { code: "MAIN" } });
  await prisma.product.create({ data: { sku, slug, name: "Repuesto QA nacional", brand: "QA", categoryId: category.id, priceCents: 2000, weightGrams: 1250, lengthMm: 200, widthMm: 100, heightMm: 80, inventoryStocks: { create: { locationId: location.id, quantityOnHand: 100, status: "IN_STOCK" } } } });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 13.48, longitude: -88.18 });
  await addProductToCart(page, slug);
  await page.goto(ES("/checkout"));
  await fillCustomerFields(page, { name: "QA nacional", email: `${sku}@example.com`, phone: "77777777" });
  await page.getByRole("radio", { name: "Envío nacional", exact: true }).check();
  await page.getByLabel("Dirección", { exact: true }).fill("Calle 5 casa 3");
  await page.getByLabel("Punto de referencia", { exact: true }).fill("Frente al parque");
  await page.getByLabel("Departamento", { exact: true }).selectOption("San Miguel");
  await page.getByLabel("Municipio", { exact: true }).selectOption("San Miguel Centro");
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.locator('input[name="latitude"]')).toHaveValue(/^13\.48(?:0*)$/);
});

test("all departments work; same-day rates include price; server rejects client price manipulation", async ({ page }) => {
  for (const department of departments) {
    await page.getByLabel("Departamento", { exact: true }).selectOption(department);
    await page.getByLabel("Municipio", { exact: true }).selectOption(municipalitiesByDepartment[department][0]);
  }
  await page.route("**/api/shipping/rates", async (route) => {
    const response = await route.fetch(); const data = await response.json();
    expect(data.totalWeightGrams).toBe(1250);
    data.rates[0].chargedCents = 1; data.rates[0].priceCents = 1;
    await route.fulfill({ response, json: data });
  });
  await page.getByRole("button", { name: "Calcular envío" }).click();
  await page.getByRole("radio", { name: /Paquetería de prueba Express.*Mismo día.*\$0.01/ }).check();
  await page.getByRole("button", { name: "Confirmar y pagar" }).click();
  await expect(page).toHaveURL(/\/payments\/mock\//);
  const order = await prisma.order.findFirstOrThrow({ where: { customerEmail: `${sku}@example.com` }, include: { shipment: true, address: true }, orderBy: { createdAt: "desc" } });
  expect(order).toMatchObject({ totalCents: 2500, shippingCents: 500 });
  expect(order.shipment).toMatchObject({ quotedCents: 500, chargedCents: 500, totalWeightGrams: 1250 });
  expect(order.address?.landmark).toBe("Frente al parque");
});

test("no rates provides WhatsApp and blocks payment; pickup remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/shipping/rates", (route) => route.fulfill({ json: { rates: [] } }));
  await page.getByRole("button", { name: "Calcular envío" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No pudimos calcular" })).toContainText("No pudimos calcular el envío a tu dirección en este momento.");
  const link = page.getByRole("link", { name: "WhatsApp", exact: true });
  await expect(link).toHaveAttribute("href", /https:\/\/wa.me\/50378907671\?text=/);
  await expect(page.getByRole("button", { name: "Confirmar y pagar" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("shipping-mobile.png"), fullPage: true });
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("radio", { name: "Retiro en bodega", exact: true }).check();
  await expect(page.getByText("Costo de retiro: $0.00")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar y pagar" }).click();
  await expect(page).toHaveURL(/\/payments\/mock\//);
});
