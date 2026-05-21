import { expect, test } from "@playwright/test";

test("catalog search filters products", async ({ page }) => {
  await page.goto("/catalog?q=toyota");

  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();
});

test("customer can add an available product to the guest cart", async ({ page }) => {
  await page.goto("/catalog");

  await page.getByRole("button", { name: "Agregar" }).first().click();

  await expect(page).toHaveURL(/\/cart\?estado=added/);
  await expect(page.getByRole("heading", { name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("Producto agregado al carrito.")).toBeVisible();
});

test("local delivery checkout exposes delivery zone and map fields", async ({ page }) => {
  await page.goto("/catalog");

  await page.getByRole("button", { name: "Agregar" }).first().click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await page.locator('input[value="LOCAL_DELIVERY"]').click();
  await page.locator('select[name="deliveryZoneSlug"]').selectOption("santa-tecla");
  await page.locator('input[name="addressLine1"]').fill("Residencial prueba, Santa Tecla");
  await page.locator('input[name="latitude"]').fill("13.676900");
  await page.locator('input[name="longitude"]').fill("-89.279700");

  await expect(page.getByRole("heading", { name: "Ubicación exacta" })).toBeVisible();
  await expect(page.locator('select[name="deliveryZoneSlug"]')).toHaveValue("santa-tecla");
  await expect(page.locator('input[readonly]').first()).toHaveValue("La Libertad");
});
