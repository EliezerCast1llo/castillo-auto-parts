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
